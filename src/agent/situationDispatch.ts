import { ClientPayload } from '../types/recovery';
import { formatCurrency } from '../utils/currency';

export type SituationType =
  | 'GENTLE_EMAIL_1_15'
  | 'FIRM_WHATSAPP_16_30'
  | 'INSTALLMENT_EMAIL_31_60_HIGH'
  | 'SUSPENSION_WHATSAPP_31_60_LOW'
  | 'EXECUTIVE_ARREARS_OVER_60'
  | 'RULE_1_COOLDOWN'
  | 'RULE_2_PROMISE_TO_PAY'
  | 'RULE_3_DISPUTE_ESCALATION'
  | 'RULE_4_HARD_DEFAULT';

export interface SituationDetails {
  type: SituationType;
  badgeLabel: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
  title: string;
  rationale: string;
  recommendedChannel: 'WhatsApp' | 'Email' | 'Escalation' | 'Cooldown';
  channelRecommendationNote: string;
  
  // Email packet
  email: {
    recipient: string;
    sender: string;
    subject: string;
    body: string;
    mailtoUrl: string;
  };

  // WhatsApp packet
  whatsapp: {
    recipientPhone: string;
    cleanPhone: string;
    message: string;
    waDirectUrl: string;
    waWebUrl: string;
  };

  // Escalation / Internal note
  internalNote: string;
}

export function evaluateClientSituation(payload: ClientPayload): SituationDetails {
  const { 
    client_name, 
    client_tier, 
    contact_email, 
    contact_phone, 
    account_manager, 
    invoice, 
    history, 
    interaction_state 
  } = payload;

  const daysOverdue = invoice.days_overdue;
  const daysSinceContact = history.days_since_last_contact;
  const formattedAmount = formatCurrency(invoice.amount, invoice.currency);
  const cleanPhone = (contact_phone || '').replace(/[^0-9]/g, '');
  const senderEmail = 'Accounts Receivable <ar@financecore.io>';
  const paymentLink = invoice.payment_link || `https://pay.financecore.io/inv/${invoice.invoice_id}`;

  // Check Rule 1: Frequency Cooldown (<3 days)
  if (daysSinceContact < 3) {
    const resumeDays = 3 - daysSinceContact;
    const emailSubject = `Notice of Account Review: Invoice ${invoice.invoice_id} - ${client_name}`;
    const emailBody = `Dear ${client_name} Accounts Team,\n\nOur records indicate our team recently communicated regarding invoice ${invoice.invoice_id} for ${formattedAmount}.\n\nIn accordance with our B2B communication protocol, automated collection outreach is currently paused to allow your accounts department sufficient processing time.\n\nShould you wish to settle this balance ahead of schedule, you can access our secure instant gateway here:\n👉 ${paymentLink}\n\nThank you for your cooperation.\n\nWarm regards,\n${account_manager} | Accounts Receivable Team`;

    const waMsg = `📌 Notice: Account update regarding Invoice *${invoice.invoice_id}* (*${formattedAmount}*) for ${client_name}.\n\nOutreach cooldown active. If payment has been initiated, please share the transaction reference here.\n\nDirect settlement portal:\n🔗 ${paymentLink}`;

    return {
      type: 'RULE_1_COOLDOWN',
      badgeLabel: `Rule 1 Cooldown (${daysSinceContact}d ago)`,
      badgeColor: 'amber',
      title: 'Frequency Cooldown Active (< 3 Days Since Outreach)',
      rationale: `Last contact occurred ${daysSinceContact} day(s) ago. Standard cadence mandates a minimum 3-day buffer to avoid partner harassment.`,
      recommendedChannel: 'Cooldown',
      channelRecommendationNote: `Automated engine suppresses outreach. Manual executive bypass permitted if urgent. Eligible resume in ${resumeDays} day(s).`,
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: `Cooldown active. Resumes in ${resumeDays} day(s).`
    };
  }

  // Check Rule 2: Active Promise to Pay
  if (interaction_state.active_promise_to_pay?.active && interaction_state.active_promise_to_pay.promised_date) {
    const promisedDate = interaction_state.active_promise_to_pay.promised_date;
    const emailSubject = `Payment Commitment Confirmed: Invoice ${invoice.invoice_id} (${client_name})`;
    const emailBody = `Dear ${client_name} Finance Team,\n\nThank you for confirming your payment commitment for invoice ${invoice.invoice_id} (${formattedAmount}).\n\nPer our agreement, collection activity remains held until ${promisedDate}. Your account executive, ${account_manager}, has updated our ledgers accordingly.\n\nShould your batch schedule permit early release, the direct payment gateway remains open:\n👉 ${paymentLink}\n\nWarm regards,\nAccounts Receivable Team`;

    const waMsg = `✅ Payment Commitment Recorded: ${client_name}.\n\nWe have noted your scheduled payment for Invoice *${invoice.invoice_id}* (*${formattedAmount}*) on *${promisedDate}*.\n\nActive collections are temporarily paused. Remittance link:\n🔗 ${paymentLink}`;

    return {
      type: 'RULE_2_PROMISE_TO_PAY',
      badgeLabel: `Promise to Pay (${promisedDate})`,
      badgeColor: 'blue',
      title: 'Promise to Pay Registered - Temporary Hold',
      rationale: `Client confirmed remittance schedule for ${promisedDate}. Standard outreach is held to honor B2B goodwill.`,
      recommendedChannel: 'Email',
      channelRecommendationNote: 'Courtesy confirmation email recommended. Heavy collection messaging suppressed.',
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: `Outreach held against promised date ${promisedDate}.`
    };
  }

  // Check Rule 3: Escalation (Dispute, Angry Sentiment, Service Issue)
  const isDispute = interaction_state.dispute_status;
  const isAngry = interaction_state.sentiment === 'angry';
  const isServiceIssue = interaction_state.service_issue_reported;

  if (isDispute || isAngry || isServiceIssue) {
    const reason = isDispute 
      ? `Billing Dispute (${interaction_state.dispute_details || 'Rate/Scope Contestation'})`
      : isServiceIssue 
      ? `Service Issue Reported (${interaction_state.service_issue_details || 'SLA Ticket Open'})`
      : 'Customer Sentiment Flagged (Aggrieved)';

    const emailSubject = `Executive Account Notice: Invoice ${invoice.invoice_id} Billing Review - ${client_name}`;
    const emailBody = `Dear ${client_name} Leadership,\n\nWe have flagged your account regarding invoice ${invoice.invoice_id} (${formattedAmount}).\n\nTrigger Note: ${reason}.\n\nOur automated billing collection has been suspended with immediate effect. Your assigned Account Executive, ${account_manager}, is currently reviewing the matter with our operations team to ensure a fair resolution before any further invoicing steps are taken.\n\nWe appreciate your patience while we investigate.\n\nSincerely,\nExecutive Client Success & Revenue Governance`;

    const waMsg = `⚠️ Account Executive Notice for ${client_name}.\n\nAutomated collections for Invoice *${invoice.invoice_id}* have been paused due to: *${reason}*.\n\nYour Account Manager (${account_manager}) has been assigned to personally resolve this issue with you.`;

    return {
      type: 'RULE_3_DISPUTE_ESCALATION',
      badgeLabel: 'Rule 3 Escalation',
      badgeColor: 'rose',
      title: 'Human Escalation Required: Dispute or Service Contestation',
      rationale: `Client context has flagged: ${reason}. Automated collections halted to avoid exacerbating contractual disputes.`,
      recommendedChannel: 'Escalation',
      channelRecommendationNote: 'Outreach shifted to Account Executive. Client acknowledgment notice prepared below.',
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: `Assigned to ${account_manager}. Automated outreach halted.`
    };
  }

  // Check Rule 4: Hard Default (>90 days past due AND prior contacts failed)
  if (daysOverdue > 90 && (history.previous_contacts_failed || history.previous_contact_count >= 4)) {
    const emailSubject = `FORMAL DEMAND FOR PAYMENT: Invoice ${invoice.invoice_id} (${client_name}) - Pre-Litigation Review`;
    const emailBody = `ATTENTION: ACCOUNTS PAYABLE & LEGAL DEPARTMENT (${client_name})\n\nRE: OUTSTANDING BALANCE ${formattedAmount} (INVOICE REF: ${invoice.invoice_id})\nDAYS OVERDUE: ${daysOverdue} DAYS\n\nDespite multiple prior notices, invoice ${invoice.invoice_id} remains unsettled. This communication serves as formal demand for payment.\n\nUnless full settlement or an approved legal agreement is executed within five (5) business days, this account will be transferred to our external legal counsel and commercial recovery agency, which may result in formal proceedings, interest assessments, and credit bureau notification.\n\nDirect settlement portal:\n👉 ${paymentLink}\n\nLegal & Credit Risk Department\nFinanceCore Global Operations`;

    const waMsg = `🚨 LEGAL DEMAND NOTICE: Final Recovery Warning for ${client_name}.\n\nInvoice *${invoice.invoice_id}* for *${formattedAmount}* is *${daysOverdue} days past due* with prior notices unacknowledged.\n\nImmediate remittance required within 5 days to avoid external collections and credit line revocation.\n\nSettle securely:\n🔗 ${paymentLink}`;

    return {
      type: 'RULE_4_HARD_DEFAULT',
      badgeLabel: 'Rule 4 Hard Default',
      badgeColor: 'purple',
      title: 'Hard Default (>90 Days + Multiple Contact Failures)',
      rationale: `Invoice is ${daysOverdue} days overdue with ${history.previous_contact_count} failed prior contact attempts. Standard recovery exhausted.`,
      recommendedChannel: 'Escalation',
      channelRecommendationNote: 'Legal demand notice prepared. Autonomous soft recovery ceased.',
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: 'Transferred to Legal & Credit Risk for formal collection proceedings.'
    };
  }

  // Standard Matrix Situations:

  // Situation 1: 1–15 Days Overdue (Gentle Email)
  if (daysOverdue >= 1 && daysOverdue <= 15) {
    const emailSubject = `Friendly Reminder: Invoice ${invoice.invoice_id} for ${client_name}`;
    const emailBody = `Dear ${client_name} Accounts Team,\n\nWe hope this email finds you well.\n\nThis is a friendly reminder regarding invoice ${invoice.invoice_id} for ${formattedAmount}, which was due on ${invoice.due_date} (${daysOverdue} days ago).\n\nAs a valued partner, we understand billing schedules can occasionally shift. You can review the line items and settle the balance directly via our secure payment gateway:\n👉 ${paymentLink}\n\nIf you have already processed this remittance, please disregard this note. Thank you for your continued partnership.\n\nWarm regards,\nAccounts Receivable Team\nFinanceCore Operations`;

    const waMsg = `👋 Hello ${client_name} finance team, friendly reminder that invoice *${invoice.invoice_id}* (*${formattedAmount}*) was due on ${invoice.due_date} (${daysOverdue} days ago).\n\nYou can review invoice details and settle directly here:\n🔗 ${paymentLink}\n\nThank you!`;

    return {
      type: 'GENTLE_EMAIL_1_15',
      badgeLabel: '1–15d Overdue: Gentle Email',
      badgeColor: 'blue',
      title: 'Early Delinquency (1–15 Days): Gentle Courtesy Email',
      rationale: `Invoice is ${daysOverdue} days overdue. In this initial bracket, soft educational outreach maintains customer rapport.`,
      recommendedChannel: 'Email',
      channelRecommendationNote: 'Protocol mandates gentle email channel to preserve relationship with courteous tone.',
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: 'Gentle courtesy email scheduled. Payment link verified.'
    };
  }

  // Situation 2: 16–30 Days Overdue (Firm WhatsApp)
  if (daysOverdue >= 16 && daysOverdue <= 30) {
    const waMsg = `⚠️ Finance Notice: Urgent Account Update for ${client_name}.\n\nInvoice *${invoice.invoice_id}* (*${formattedAmount}*) is now *${daysOverdue} days overdue* (Due: ${invoice.due_date}).\n\nTo ensure uninterrupted service access, please submit payment via the direct instant clearing link below:\n🔗 ${paymentLink}\n\nPayment must be reconciled within 48 hours. If remittance advice is ready, please reply with the reference number.`;

    const emailSubject = `URGENT: Overdue Balance for Invoice ${invoice.invoice_id} - ${client_name}`;
    const emailBody = `Dear ${client_name} Finance Team,\n\nThis is an urgent notice regarding invoice ${invoice.invoice_id} for ${formattedAmount}, which is now ${daysOverdue} days past due.\n\nPlease process payment via our express clearing portal within 48 hours to ensure uninterrupted services:\n👉 ${paymentLink}\n\nIf remittance has already been initiated, kindly reply with the transaction reference.\n\nSincerely,\nCredit Control Team`;

    return {
      type: 'FIRM_WHATSAPP_16_30',
      badgeLabel: '16–30d Overdue: Firm WhatsApp',
      badgeColor: 'emerald',
      title: 'Mid-Stage Delinquency (16–30 Days): Firm WhatsApp Dispatch',
      rationale: `Invoice is ${daysOverdue} days overdue. Protocol escalates from email to direct WhatsApp for high open rates and immediate response.`,
      recommendedChannel: 'WhatsApp',
      channelRecommendationNote: 'Direct WhatsApp message with instant clearing link dispatched for immediate mobile attention.',
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: 'Firm WhatsApp notice dispatched. Direct payment link attached.'
    };
  }

  // Situation 3: 31–60 Days Overdue (High-Tier Installment Plan Offer)
  if (daysOverdue >= 31 && daysOverdue <= 60 && client_tier === 'High-Tier') {
    const installmentAmount = Math.round((invoice.amount / 3) * 100) / 100;
    const formattedInstallment = formatCurrency(installmentAmount, invoice.currency);

    const emailSubject = `Payment Accommodation & Installment Plan: Invoice ${invoice.invoice_id} (${client_name})`;
    const emailBody = `Dear ${client_name} Leadership,\n\nWe recognize the strategic importance of our ongoing partnership with ${client_name}. Regarding outstanding invoice ${invoice.invoice_id} (${formattedAmount}, now ${daysOverdue} days past due), we want to provide immediate flexibility to accommodate your internal cash flow scheduling.\n\nYour Account Executive, ${account_manager}, has pre-approved a 3-part flexible installment schedule:\n\n• Installment 1: ${formattedInstallment} (Upon confirmation)\n• Installment 2: ${formattedInstallment} (+30 days)\n• Installment 3: ${formattedInstallment} (+60 days)\n\nYou may accept this accommodation and remit the first installment directly at:\n👉 ${paymentLink}?plan=installment3\n\nWe look forward to maintaining seamless cooperation.\n\nSincerely,\nExecutive Revenue Operations & Client Success`;

    const waMsg = `🤝 Special Accommodation for ${client_name}:\nRegarding Invoice *${invoice.invoice_id}* (*${formattedAmount}*, ${daysOverdue}d overdue), Account Executive ${account_manager} has approved a flexible 3-installment schedule (${formattedInstallment}/mo).\n\nAccept plan & pay first tranche:\n🔗 ${paymentLink}?plan=installment3`;

    return {
      type: 'INSTALLMENT_EMAIL_31_60_HIGH',
      badgeLabel: '31–60d High-Tier: Installment Plan',
      badgeColor: 'blue',
      title: 'Late Delinquency (31–60 Days High-Tier): Structured Installment Offer',
      rationale: `Invoice is ${daysOverdue} days overdue for High-Tier client. Policy prioritizes relationship preservation by offering flexible 3-part payment schedule.`,
      recommendedChannel: 'Email',
      channelRecommendationNote: 'Executive email with pre-approved 3-installment breakdown dispatched to finance leadership.',
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: 'Structured 3-part installment plan offer dispatched.'
    };
  }

  // Situation 4: 31–60 Days Overdue (Low-Tier or Non-High Service Suspension Warning)
  if (daysOverdue >= 31 && daysOverdue <= 60) {
    const cutoffDays = 3;
    const cutoffDate = new Date(Date.now() + cutoffDays * 86400000).toISOString().split('T')[0];
    const reinstatementFee = formatCurrency(15000, invoice.currency);

    const waMsg = `🚨 FINAL NOTICE OF SERVICE SUSPENSION\n\nTo: ${client_name} Management\nInvoice: *${invoice.invoice_id}*\nOverdue Balance: *${formattedAmount}* (${daysOverdue} days past due)\n\nUnless full payment is received by *${cutoffDate} (17:00 UTC)*, all active platform access, API tokens, and dedicated computing capacity will be automatically suspended.\n\nPay immediately to prevent business disruption:\n🔗 ${paymentLink}\n\nReactivation post-suspension will incur a mandatory ${reinstatementFee} administrative surcharge.`;

    const emailSubject = `FINAL NOTICE: Service Suspension Scheduled for Invoice ${invoice.invoice_id} - ${client_name}`;
    const emailBody = `FINAL NOTICE OF PENDING SERVICE CUTOFF\n\nTo: ${client_name} Management\nInvoice Ref: ${invoice.invoice_id}\nOverdue Balance: ${formattedAmount} (${daysOverdue} days past due)\nCutoff Deadline: ${cutoffDate} (17:00 UTC)\n\nUnless full payment is confirmed before the deadline, all platform infrastructure, API keys, and enterprise services will be automatically disabled.\n\nInstant clearing portal:\n👉 ${paymentLink}\n\nReactivation following suspension requires payment of a mandatory ${reinstatementFee} fee.\n\nCredit Operations Desk`;

    return {
      type: 'SUSPENSION_WHATSAPP_31_60_LOW',
      badgeLabel: '31–60d Suspension Warning',
      badgeColor: 'rose',
      title: 'Late Delinquency (31–60 Days): Service Suspension Warning',
      rationale: `Invoice is ${daysOverdue} days overdue for ${client_tier} client. SOP activates formal service cutoff warning with 72-hour hard deadline.`,
      recommendedChannel: 'WhatsApp',
      channelRecommendationNote: 'High-urgency WhatsApp notice with suspension deadline and penalty warning dispatched.',
      email: {
        recipient: contact_email,
        sender: senderEmail,
        subject: emailSubject,
        body: emailBody,
        mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
      },
      whatsapp: {
        recipientPhone: contact_phone,
        cleanPhone,
        message: waMsg,
        waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
        waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
      },
      internalNote: `Cutoff warning set for ${cutoffDate}.`
    };
  }

  // Situation 5: >60 Days Overdue (Executive Arrears Escalation)
  const emailSubject = `PRE-LEGAL NOTICE: Severely Overdue Account - Invoice ${invoice.invoice_id} (${client_name})`;
  const emailBody = `ATTENTION: EXECUTIVE MANAGEMENT (${client_name})\n\nInvoice ${invoice.invoice_id} (${formattedAmount}) is now ${daysOverdue} days overdue.\n\nThis matter has been escalated to Executive Arrears Management. Please settle immediately via the link below:\n👉 ${paymentLink}\n\nFailure to remit will result in debt collection referral.\n\nExecutive Credit Risk Desk`;

  const waMsg = `🚨 EXECUTIVE ARREARS NOTICE: ${client_name}.\nInvoice *${invoice.invoice_id}* (*${formattedAmount}*) is now *${daysOverdue} days overdue*.\n\nImmediate settlement required:\n🔗 ${paymentLink}`;

  return {
    type: 'EXECUTIVE_ARREARS_OVER_60',
    badgeLabel: '>60d Executive Arrears',
    badgeColor: 'rose',
    title: 'Severe Arrears (>60 Days Overdue): Pre-Legal Intervention',
    rationale: `Invoice is ${daysOverdue} days overdue (>60 days). Escalated to Executive Arrears prior to default write-off.`,
    recommendedChannel: 'Email',
    channelRecommendationNote: 'Formal pre-legal email notice sent to executive management.',
    email: {
      recipient: contact_email,
      sender: senderEmail,
      subject: emailSubject,
      body: emailBody,
      mailtoUrl: `mailto:${encodeURIComponent(contact_email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    },
    whatsapp: {
      recipientPhone: contact_phone,
      cleanPhone,
      message: waMsg,
      waDirectUrl: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`,
      waWebUrl: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMsg)}`
    },
    internalNote: 'Severe arrears notice prepared for executive management.'
  };
}
