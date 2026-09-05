import {
  ClientPayload,
  AgentCycleResult,
  StoppingRulesEvaluation,
  ToolCallExecution,
  AuditTrailRecord
} from '../types/recovery';
import { formatCurrency } from '../utils/currency';
import { calculatePredictiveRisk } from '../utils/predictiveRisk';

export class RevenueRecoveryEngine {
  /**
   * Evaluates if a promise date is currently in the future relative to anchorDate (default today)
   */
  private static isFutureDate(dateStr: string, anchorDateStr: string = '2026-09-04'): boolean {
    if (!dateStr) return false;
    const promise = new Date(dateStr);
    const anchor = new Date(anchorDateStr);
    return promise.getTime() >= anchor.getTime();
  }

  /**
   * Determine the communication tone based on payment history
   */
  public static calculateTone(historyRating: string, averageDaysToPay: number): string {
    switch (historyRating) {
      case 'spotless':
        return 'Courteous & Collaborative (Acknowledges stellar history; assumes invoice was overlooked in routine accounts payable batches)';
      case 'occasional_late':
        return 'Professional & Direct (Firm reminder with explicit due dates and quick self-service reconciliation links)';
      case 'chronic_late':
        return 'Strict & Urgent (High-priority notice highlighting immediate credit term enforcement and service continuity risk)';
      case 'new_client':
      default:
        return 'Supportive & Educational (Guides new partner on payment routing, remittance advice, and standard net terms)';
    }
  }

  /**
   * Executes the 4-step Operating Framework: GATHER -> EVALUATE -> ACT -> RECORD
   */
  public static executeCycle(payload: ClientPayload, simulatedDate: string = '2026-09-04'): AgentCycleResult {
    const startTime = performance.now();

    // 1. GATHER
    const { invoice, history, interaction_state, client_tier, client_name, client_id, contact_email, contact_phone, account_manager } = payload;
    const daysOverdue = invoice.days_overdue;
    const daysSinceLastContact = history.days_since_last_contact;
    const lastContactDate = history.last_contact_date;
    const formattedAmount = formatCurrency(invoice.amount, invoice.currency);

    const gatherSummary = {
      invoice_id: invoice.invoice_id,
      client_name,
      client_tier,
      contact_email,
      contact_phone,
      days_overdue: daysOverdue,
      last_contact_date: lastContactDate,
      days_since_last_contact: daysSinceLastContact,
      amount_due: formattedAmount,
      history_rating: history.payment_history_rating
    };

    // 2. EVALUATE
    const stoppingRules: StoppingRulesEvaluation = {
      rule_1_frequency: {
        checked: true,
        triggered: false,
        detail: `Days since last contact: ${daysSinceLastContact} (Threshold: minimum 3 days required)`
      },
      rule_2_promise_to_pay: {
        checked: false,
        triggered: false,
        detail: 'No active promise to pay'
      },
      rule_3_escalation: {
        checked: false,
        triggered: false,
        detail: 'No dispute, negative sentiment, or service issues detected'
      },
      rule_4_hard_default: {
        checked: false,
        triggered: false,
        detail: `Overdue ${daysOverdue} days (Threshold: >90 days + failed contacts)`
      }
    };

    let stoppingRuleTriggered = false;
    let triggeringRuleName: string | undefined;
    let actionCategory: 'NO_ACTION_SKIP' | 'ESCALATE_TO_HUMAN' | 'INTERVENTION_EXECUTED' = 'INTERVENTION_EXECUTED';
    let decisionRationale = '';
    let appliedRuleOrMatrix = '';
    let toolCall: ToolCallExecution;

    // RULE 1: Frequency Limit
    if (daysSinceLastContact < 3) {
      stoppingRules.rule_1_frequency.triggered = true;
      stoppingRules.rule_1_frequency.detail = `HALT: Contact frequency violation. Last contacted ${daysSinceLastContact} day(s) ago. Rule 1 enforces a minimum 3-day buffer to avoid spamming and preserve client goodwill.`;
      
      stoppingRuleTriggered = true;
      triggeringRuleName = 'RULE 1 (Frequency Limit)';
      actionCategory = 'NO_ACTION_SKIP';
      appliedRuleOrMatrix = 'RULE 1: Frequency Cooldown (< 3 days)';
      decisionRationale = `Client was contacted ${daysSinceLastContact} day(s) ago (last: ${lastContactDate}). Minimum interval required is 3 days. Automated recovery skipped to preserve relationship.`;

      const resumeDays = 3 - daysSinceLastContact;
      const resumeDate = new Date(new Date(simulatedDate).getTime() + resumeDays * 86400000).toISOString().split('T')[0];

      toolCall = {
        tool_name: 'skip_and_audit',
        parameters: {
          client_id,
          invoice_id: invoice.invoice_id,
          reason: 'FREQUENCY_LIMIT_EXCEEDED',
          days_since_last_contact: daysSinceLastContact,
          minimum_required_interval: 3,
          action: 'NO_ACTION',
          next_eligible_contact_date: resumeDate,
          rule_triggered: 'RULE_1_FREQUENCY_LIMIT'
        },
        rendered_content: {
          channel: 'Compliance System',
          title: 'Automated Contact Suppressed (Rule 1 Frequency Limit)',
          recipient: `${client_name} (${contact_email})`,
          body: `Notice suppressed by B2B Recovery Compliance Engine. Last outreach occurred ${daysSinceLastContact} day(s) ago (${lastContactDate}). Safe cooldown expires on ${resumeDate}. Zero outbound messages dispatched.`
        }
      };
    }

    // RULE 2: Promise to Pay
    if (!stoppingRuleTriggered) {
      stoppingRules.rule_2_promise_to_pay.checked = true;
      const ptp = interaction_state.active_promise_to_pay;
      
      if (ptp && ptp.active && ptp.promised_date) {
        const isFuture = this.isFutureDate(ptp.promised_date, simulatedDate);
        if (isFuture) {
          stoppingRules.rule_2_promise_to_pay.triggered = true;
          stoppingRules.rule_2_promise_to_pay.detail = `HALT: Active Promise to Pay registered for ${ptp.promised_date}. ${ptp.notes || ''}`;
          
          stoppingRuleTriggered = true;
          triggeringRuleName = 'RULE 2 (Promise to Pay)';
          actionCategory = 'NO_ACTION_SKIP';
          appliedRuleOrMatrix = `RULE 2: Active Promise to Pay (${ptp.promised_date})`;
          decisionRationale = `Client has a formal active Promise to Pay mature on ${ptp.promised_date}. Collections actions frozen until scheduled fulfillment date.`;

          toolCall = {
            tool_name: 'skip_and_audit',
            parameters: {
              client_id,
              invoice_id: invoice.invoice_id,
              reason: 'ACTIVE_PROMISE_TO_PAY',
              promised_date: ptp.promised_date,
              promised_amount: ptp.promised_amount || invoice.amount,
              action: 'NO_ACTION',
              grace_period_expiry: ptp.promised_date,
              rule_triggered: 'RULE_2_PROMISE_TO_PAY'
            },
            rendered_content: {
              channel: 'Compliance System',
              title: 'Automated Outreach Suspended (Promise to Pay)',
              recipient: `${client_name} (${contact_email})`,
              body: `Client confirmed payment commitment of ${formattedAmount} scheduled for ${ptp.promised_date}. Recovery engine holds all outreach in adherence with B2B relationship protection protocol.`
            }
          };
        } else {
          stoppingRules.rule_2_promise_to_pay.detail = `Promise to pay date (${ptp.promised_date}) has passed without settlement. Rule 2 does not halt recovery.`;
        }
      }
    }

    // RULE 3: Escalation (dispute, angry sentiment, service issue)
    if (!stoppingRuleTriggered) {
      stoppingRules.rule_3_escalation.checked = true;
      const isDisputed = interaction_state.dispute_status;
      const isAngry = interaction_state.sentiment === 'angry';
      const isServiceIssue = interaction_state.service_issue_reported;

      if (isDisputed || isAngry || isServiceIssue) {
        stoppingRules.rule_3_escalation.triggered = true;
        const reasons: string[] = [];
        if (isDisputed) reasons.push(`Dispute Active (${interaction_state.dispute_details || 'Billed amount contestation'})`);
        if (isAngry) reasons.push('Angry Sentiment Flagged');
        if (isServiceIssue) reasons.push(`Service Issue Reported (${interaction_state.service_issue_details || 'Technical / SLA ticket open'})`);
        
        stoppingRules.rule_3_escalation.detail = `HALT: Immediate Human Escalation required. Triggered by: ${reasons.join('; ')}`;
        stoppingRuleTriggered = true;
        triggeringRuleName = 'RULE 3 (Escalation)';
        actionCategory = 'ESCALATE_TO_HUMAN';
        appliedRuleOrMatrix = 'RULE 3: Escalation to Human Agent';
        decisionRationale = `Client flags indicate ${reasons.join(' & ')}. Automated bots must never press collections on active disputes or aggrieved clients. Immediate human handoff initiated.`;

        const assignedQueue = isDisputed ? 'Account_Management' : isServiceIssue ? 'Customer_Support' : 'Account_Management';

        toolCall = {
          tool_name: 'escalate_to_human',
          parameters: {
            client_id,
            client_name,
            invoice_id: invoice.invoice_id,
            amount_due: formattedAmount,
            escalation_triggers: reasons,
            priority: 'HIGH',
            assigned_queue: assignedQueue,
            assigned_account_manager: account_manager,
            recommended_action: isDisputed 
              ? 'Review billing contestation and issue credit memo or reconciliation statement.' 
              : 'Conduct executive outreach to address service complaints prior to requesting funds.',
            rule_triggered: 'RULE_3_ESCALATION'
          },
          rendered_content: {
            channel: 'Escalation Ticket',
            title: `[URGENT ESCALATION] ${client_name} - ${reasons[0]}`,
            recipient: `Assigned: ${account_manager} (${assignedQueue})`,
            body: `AUTOMATED RECOVERY CEASED.\nClient ${client_name} (Invoice: ${invoice.invoice_id} for ${formattedAmount}) triggered Rule 3 Escalation.\nTriggers: ${reasons.join(', ')}\nContext: Automated communications halted immediately to safeguard key customer contract.`
          }
        };
      }
    }

    // RULE 4: Hard Default (>90 days past due AND previous contacts failed)
    if (!stoppingRuleTriggered) {
      stoppingRules.rule_4_hard_default.checked = true;
      const isPast90Days = daysOverdue > 90;
      const contactsFailed = history.previous_contacts_failed || history.previous_contact_count >= 4;

      if (isPast90Days && contactsFailed) {
        stoppingRules.rule_4_hard_default.triggered = true;
        stoppingRules.rule_4_hard_default.detail = `HALT: Hard Default detected. Invoice is ${daysOverdue} days past due (>90 days) with ${history.previous_contact_count} failed prior contact attempts.`;
        
        stoppingRuleTriggered = true;
        triggeringRuleName = 'RULE 4 (Hard Default)';
        actionCategory = 'ESCALATE_TO_HUMAN';
        appliedRuleOrMatrix = 'RULE 4: Hard Default (>90 Days & Contacts Failed)';
        decisionRationale = `Invoice is ${daysOverdue} days overdue with repeated contact failures. Standard autonomous workflows exhausted. Escalating to Legal & Credit Risk Review for formal demand or write-off determination.`;

        toolCall = {
          tool_name: 'escalate_to_human',
          parameters: {
            client_id,
            client_name,
            invoice_id: invoice.invoice_id,
            amount_due: formattedAmount,
            days_overdue: daysOverdue,
            prior_contact_count: history.previous_contact_count,
            priority: 'CRITICAL',
            assigned_queue: 'Legal_Risk',
            recommended_action: 'Initiate formal legal notice, freeze credit line, and evaluate external collections / litigation pathway.',
            rule_triggered: 'RULE_4_HARD_DEFAULT'
          },
          rendered_content: {
            channel: 'Escalation Ticket',
            title: `[LEGAL & RISK REFERRAL] Hard Default - ${client_name} (${invoice.invoice_id})`,
            recipient: 'Assigned: Office of General Counsel / Collections Risk Desk',
            body: `CRITICAL ACTION REQUIRED.\nAccount ${client_name} has entered hard default status at ${daysOverdue} days overdue with ${history.previous_contact_count} non-responsive contacts.\nTotal Exposure: ${formattedAmount}.\nAutonomous agent actions terminated. Case referred for legal demand letter.`
          }
        };
      } else {
        stoppingRules.rule_4_hard_default.detail = `Invoice age is ${daysOverdue} days (Hard default requires >90 days AND failed contacts).`;
      }
    }

    // INTERVENTION MATRIX (When no stopping rule triggered)
    const calculatedTone = this.calculateTone(history.payment_history_rating, history.average_days_to_pay);
    let matrixBracket = '';

    if (!stoppingRuleTriggered) {
      if (daysOverdue >= 1 && daysOverdue <= 15) {
        matrixBracket = '1-15 Days Overdue';
        appliedRuleOrMatrix = 'INTERVENTION MATRIX: 1-15 Days Overdue (Gentle Email)';
        decisionRationale = `Invoice is ${daysOverdue} days overdue (Bracket: 1-15 days). Deploying gentle email reminder with polite tone to maintain relationship.`;

        const emailSubject = `Friendly Reminder: Invoice ${invoice.invoice_id} for ${client_name}`;
        const emailBody = `Dear ${client_name} Accounts Team,\n\nWe hope this email finds you well.\n\nThis is a friendly reminder regarding invoice ${invoice.invoice_id} for ${formattedAmount}, which was due on ${invoice.due_date} (${daysOverdue} days ago).\n\nAs a valued partner, we understand billing schedules can occasionally shift. You can review the line items and settle the balance directly via our secure payment gateway:\n👉 ${invoice.payment_link}\n\nIf you have already processed this remittance, please disregard this note. Thank you for your continued partnership.\n\nWarm regards,\nAccounts Receivable Team`;

        toolCall = {
          tool_name: 'send_gentle_email',
          parameters: {
            recipient_email: contact_email,
            client_name,
            invoice_id: invoice.invoice_id,
            amount_due: formattedAmount,
            due_date: invoice.due_date,
            days_overdue: daysOverdue,
            payment_link: invoice.payment_link,
            tone: calculatedTone,
            subject: emailSubject
          },
          rendered_content: {
            channel: 'Email',
            title: emailSubject,
            recipient: `${client_name} <${contact_email}>`,
            subject: emailSubject,
            body: emailBody,
            meta: {
              invoice_id: invoice.invoice_id,
              amount: formattedAmount,
              due_date: invoice.due_date,
              link: invoice.payment_link
            }
          }
        };
      } else if (daysOverdue >= 16 && daysOverdue <= 30) {
        matrixBracket = '16-30 Days Overdue';
        appliedRuleOrMatrix = 'INTERVENTION MATRIX: 16-30 Days Overdue (Firm WhatsApp)';
        decisionRationale = `Invoice is ${daysOverdue} days overdue (Bracket: 16-30 days). Escalating channel from email to WhatsApp with firm phrasing and direct payment link.`;

        const waMessage = `⚠️ Finance Notice: Urgent Account Update for ${client_name}.\n\nInvoice *${invoice.invoice_id}* (*${formattedAmount}*) is now *${daysOverdue} days overdue* (Due: ${invoice.due_date}).\n\nTo ensure uninterrupted service access, please submit payment via the direct instant clearing link below:\n🔗 ${invoice.payment_link}\n\nPayment must be reconciled within 48 hours. If remittance advice is ready, please reply with the reference number.`;

        toolCall = {
          tool_name: 'send_firm_whatsapp',
          parameters: {
            recipient_phone: contact_phone,
            client_name,
            invoice_id: invoice.invoice_id,
            amount_due: formattedAmount,
            days_overdue: daysOverdue,
            payment_link: invoice.payment_link,
            direct_payment_link: invoice.payment_link,
            urgency: 'HIGH',
            tone: calculatedTone
          },
          rendered_content: {
            channel: 'WhatsApp',
            title: `WhatsApp Business Dispatch to ${contact_phone}`,
            recipient: `${client_name} (${contact_phone})`,
            body: waMessage,
            meta: {
              invoice_id: invoice.invoice_id,
              amount: formattedAmount,
              payment_link: invoice.payment_link
            }
          }
        };
      } else if (daysOverdue >= 31 && daysOverdue <= 60) {
        matrixBracket = '31-60 Days Overdue';
        if (client_tier === 'High-Tier') {
          appliedRuleOrMatrix = 'INTERVENTION MATRIX: 31-60 Days Overdue (High-Tier Installment Plan)';
          decisionRationale = `Invoice is ${daysOverdue} days overdue for High-Tier client (${client_tier}). Per protocol, prioritizing long-term relationship preservation by offering structured installment plan.`;

          const installmentAmount = Math.round((invoice.amount / 3) * 100) / 100;
          const installmentPlan = [
            { installment_no: 1, amount: installmentAmount, due_date: 'Immediate (Due upon acceptance)' },
            { installment_no: 2, amount: installmentAmount, due_date: '30 Days from Phase 1' },
            { installment_no: 3, amount: invoice.amount - (installmentAmount * 2), due_date: '60 Days from Phase 1' }
          ];

          const emailSubject = `Payment Accommodation & Installment Plan Proposal: Invoice ${invoice.invoice_id}`;
          const emailBody = `Dear ${client_name} Leadership,\n\nWe recognize the strategic importance of our ongoing partnership with ${client_name}. Regarding outstanding invoice ${invoice.invoice_id} (${formattedAmount}, now ${daysOverdue} days past due), we want to provide immediate flexibility to accommodate your internal cash flow scheduling.\n\nYour Account Executive, ${account_manager}, has pre-approved a 3-part flexible installment schedule:\n\n• Installment 1: ${formatCurrency(installmentPlan[0].amount, invoice.currency)} (Upon confirmation)\n• Installment 2: ${formatCurrency(installmentPlan[1].amount, invoice.currency)} (+30 days)\n• Installment 3: ${formatCurrency(installmentPlan[2].amount, invoice.currency)} (+60 days)\n\nYou may accept this accommodation and remit the first installment directly at:\n👉 ${invoice.payment_link}?plan=installment3\n\nWe look forward to maintaining seamless cooperation.\n\nSincerely,\nExecutive Revenue Operations & Client Success`;

          toolCall = {
            tool_name: 'propose_installment_plan_email',
            parameters: {
              recipient_email: contact_email,
              client_name,
              client_tier,
              invoice_id: invoice.invoice_id,
              total_amount: formattedAmount,
              days_overdue: daysOverdue,
              installments: installmentPlan,
              account_manager,
              portal_link: `${invoice.payment_link}?plan=installment3`
            },
            rendered_content: {
              channel: 'Email',
              title: emailSubject,
              recipient: `${client_name} <${contact_email}>`,
              subject: emailSubject,
              body: emailBody,
              meta: {
                installment_count: 3,
                installment_amount: formatCurrency(installmentAmount, invoice.currency),
                account_manager
              }
            }
          };
        } else {
          // Low-Tier Client (or non-high tier)
          appliedRuleOrMatrix = 'INTERVENTION MATRIX: 31-60 Days Overdue (Low-Tier Suspension Warning)';
          decisionRationale = `Invoice is ${daysOverdue} days overdue for ${client_tier} client. Per protocol, issuing formal firm WhatsApp warning of service suspension.`;

          const cutoffDays = 3;
          const cutoffDate = new Date(new Date(simulatedDate).getTime() + cutoffDays * 86400000).toISOString().split('T')[0];
          const reinstatementFee = formatCurrency(15000, invoice.currency);
          const suspensionMsg = `🚨 FINAL NOTICE OF SERVICE SUSPENSION\n\nTo: ${client_name} Management\nInvoice: *${invoice.invoice_id}*\nOverdue Balance: *${formattedAmount}* (${daysOverdue} days past due)\n\nUnless full payment is received by *${cutoffDate} (17:00 UTC)*, all active platform access, API tokens, and dedicated computing capacity will be automatically suspended.\n\nPay immediately to prevent business disruption:\n🔗 ${invoice.payment_link}\n\nReactivation post-suspension will incur a mandatory ${reinstatementFee} reinstatement administrative surcharge.`;

          toolCall = {
            tool_name: 'send_suspension_warning_whatsapp',
            parameters: {
              recipient_phone: contact_phone,
              client_name,
              client_tier,
              invoice_id: invoice.invoice_id,
              amount_due: formattedAmount,
              days_overdue: daysOverdue,
              service_cutoff_date: cutoffDate,
              payment_link: invoice.payment_link,
              direct_payment_link: invoice.payment_link,
              action_required: 'IMMEDIATE_FULL_SETTLEMENT'
            },
            rendered_content: {
              channel: 'WhatsApp',
              title: `Suspension Warning Dispatch to ${contact_phone}`,
              recipient: `${client_name} (${contact_phone})`,
              body: suspensionMsg,
              meta: {
                cutoff_date: cutoffDate,
                amount: formattedAmount,
                payment_link: invoice.payment_link
              }
            }
          };
        }
      } else {
        // 61-90 days overdue (before hard default at >90 with failed contacts)
        matrixBracket = '>60 Days Overdue (Pre-Legal Critical Notice)';
        appliedRuleOrMatrix = 'EXTENDED MATRIX: 61-90 Days Pre-Legal Notice';
        decisionRationale = `Invoice is ${daysOverdue} days overdue (Bracket: 61-90 days). Final pre-legal notice dispatched prior to formal hard-default legal referral.`;

        toolCall = {
          tool_name: 'escalate_to_human',
          parameters: {
            client_id,
            client_name,
            invoice_id: invoice.invoice_id,
            amount_due: formattedAmount,
            days_overdue: daysOverdue,
            priority: 'HIGH',
            assigned_queue: 'Account_Management',
            recommended_action: 'Urgent partner meeting required before 90-day hard default legal transfer.',
            rule_triggered: 'PRE_LEGAL_HIGH_ARREARS'
          },
          rendered_content: {
            channel: 'Escalation Ticket',
            title: `[ARREARS CRITICAL] High Delinquency Alert - ${client_name} (${daysOverdue} days)`,
            recipient: `Assigned: ${account_manager} (Executive Collections)`,
            body: `High Risk Arrears Notice.\nClient ${client_name} is ${daysOverdue} days overdue on ${invoice.invoice_id} (${formattedAmount}).\nHard default threshold (90 days) will be reached in ${90 - daysOverdue} days. Immediate executive intervention recommended.`
          }
        };
      }
    }

    const executionTimeMs = Math.round(performance.now() - startTime);

    // Predictive recovery risk analysis
    const predictiveRisk = calculatePredictiveRisk(payload);

    // 4. RECORD - Immutable Audit Trail
    const record: AuditTrailRecord = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      invoice_id: invoice.invoice_id,
      client_id,
      client_name,
      client_tier,
      contact_email,
      contact_phone,
      amount_due: formattedAmount,
      currency: invoice.currency,
      days_overdue: daysOverdue,
      days_since_last_contact: daysSinceLastContact,
      stopping_rules: stoppingRules,
      action_category: actionCategory,
      applied_rule_or_matrix: appliedRuleOrMatrix,
      communication_tone: calculatedTone,
      decision_rationale: decisionRationale,
      tool_call: toolCall!,
      compliance_guardrails_passed: true,
      predictive_risk: {
        recovery_likelihood: predictiveRisk.recoveryLikelihood,
        risk_score: predictiveRisk.riskScore,
        risk_level: predictiveRisk.riskLevel
      }
    };

    return {
      gather: gatherSummary,
      evaluate: {
        stopping_rule_triggered: stoppingRuleTriggered,
        triggering_rule: triggeringRuleName,
        stopping_rules: stoppingRules,
        calculated_tone: calculatedTone,
        matrix_bracket: matrixBracket,
        predictive_risk: {
          recovery_likelihood: predictiveRisk.recoveryLikelihood,
          risk_score: predictiveRisk.riskScore,
          risk_level: predictiveRisk.riskLevel,
          summary: predictiveRisk.summary
        }
      },
      act: toolCall!,
      record,
      execution_time_ms: executionTimeMs
    };
  }
}
