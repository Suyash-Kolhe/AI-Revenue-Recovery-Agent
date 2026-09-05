import { ClientPayload } from '../types/recovery';

export interface ScenarioPreset {
  id: string;
  name: string;
  category: 'STOPPING_RULE' | 'INTERVENTION_MATRIX';
  ruleBadge: string;
  description: string;
  expectedOutcome: string;
  payload: ClientPayload;
}

export const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'rule-1-frequency',
    name: 'Rule 1: Frequency Limit',
    category: 'STOPPING_RULE',
    ruleBadge: 'RULE 1 - SKIP',
    description: 'Last contact was only 1 day ago (< 3 days). Prevents aggressive spamming & preserves relationship.',
    expectedOutcome: 'NO ACTION. Emits audit log explaining frequency cooldown.',
    payload: {
      client_id: 'C-8921',
      client_name: 'Apex Robotics Technologies India',
      client_tier: 'High-Tier',
      contact_email: 'accounts@apexrobotics.in',
      contact_phone: '+91 98201 44321',
      account_manager: 'Priya Sharma',
      invoice: {
        invoice_id: 'INV-2026-081',
        amount: 285000,
        currency: 'INR',
        issue_date: '2026-07-15',
        due_date: '2026-08-15',
        days_overdue: 20,
        service_description: 'Enterprise Cloud Infrastructure - Q3 Subscription',
        payment_link: 'https://pay.financecore.io/i/INV-2026-081'
      },
      history: {
        payment_history_rating: 'occasional_late',
        average_days_to_pay: 38,
        lifetime_invoices_paid: 14,
        last_contact_date: '2026-09-03',
        days_since_last_contact: 1,
        previous_contact_count: 2,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false,
        recent_interactions: [
          {
            date: '2026-09-03',
            channel: 'Email',
            note: 'Automated statement check sent to accounts payable.',
            response_received: false
          }
        ]
      }
    }
  },
  {
    id: 'rule-2-promise-to-pay',
    name: 'Rule 2: Promise to Pay Active',
    category: 'STOPPING_RULE',
    ruleBadge: 'RULE 2 - SKIP',
    description: 'Client CFO submitted a formal commitment to remit payment on 2026-09-12 (future date).',
    expectedOutcome: 'NO ACTION. Respects agreed payment commitment window.',
    payload: {
      client_id: 'C-7740',
      client_name: 'Starlight BioPharm India Pvt Ltd',
      client_tier: 'High-Tier',
      contact_email: 'finance@starlightbio.in',
      contact_phone: '+91 98112 55901',
      account_manager: 'Rajesh Nair',
      invoice: {
        invoice_id: 'INV-2026-064',
        amount: 675000,
        currency: 'INR',
        issue_date: '2026-07-01',
        due_date: '2026-08-01',
        days_overdue: 34,
        service_description: 'Precision Genetics Compute Pipeline & Dedicated Cluster',
        payment_link: 'https://pay.financecore.io/i/INV-2026-064'
      },
      history: {
        payment_history_rating: 'spotless',
        average_days_to_pay: 30,
        lifetime_invoices_paid: 22,
        last_contact_date: '2026-08-28',
        days_since_last_contact: 7,
        previous_contact_count: 1,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: {
          active: true,
          promised_date: '2026-09-12',
          promised_amount: 675000,
          notes: 'CFO confirmed board treasury approval cycle completes Sept 11, funds release Sept 12 via RTGS.'
        },
        dispute_status: false,
        sentiment: 'positive',
        service_issue_reported: false,
        recent_interactions: [
          {
            date: '2026-08-28',
            channel: 'Email',
            note: 'CFO Elena Rostova replied with Promise to Pay scheduled for Sept 12.',
            response_received: true
          }
        ]
      }
    }
  },
  {
    id: 'rule-3-dispute',
    name: 'Rule 3: Active Client Dispute',
    category: 'STOPPING_RULE',
    ruleBadge: 'RULE 3 - ESCALATE',
    description: 'Client formally contested seat licensing count on invoice line item 3.',
    expectedOutcome: 'ESCALATE TO HUMAN. Halts automated recovery to prevent client breach.',
    payload: {
      client_id: 'C-4109',
      client_name: 'Nexus Global Logistics India',
      client_tier: 'High-Tier',
      contact_email: 'billing@nexus-logistics.in',
      contact_phone: '+91 98334 11200',
      account_manager: 'Priya Sharma',
      invoice: {
        invoice_id: 'INV-2026-092',
        amount: 390000,
        currency: 'INR',
        issue_date: '2026-07-20',
        due_date: '2026-08-19',
        days_overdue: 16,
        service_description: 'Fleet Optimization API Tier 4 & Telematics Connector',
        payment_link: 'https://pay.financecore.io/i/INV-2026-092'
      },
      history: {
        payment_history_rating: 'spotless',
        average_days_to_pay: 28,
        lifetime_invoices_paid: 19,
        last_contact_date: '2026-08-30',
        days_since_last_contact: 5,
        previous_contact_count: 1,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: true,
        dispute_details: 'Client flagged 50 inactive seats billed in error; withholding payment pending revised invoice credit memo.',
        sentiment: 'frustrated',
        service_issue_reported: false,
        recent_interactions: [
          {
            date: '2026-08-30',
            channel: 'Email',
            note: 'Client sent dispute documentation regarding seat count overage.',
            response_received: true
          }
        ]
      }
    }
  },
  {
    id: 'rule-3-angry-sentiment',
    name: 'Rule 3: Angry Sentiment Detected',
    category: 'STOPPING_RULE',
    ruleBadge: 'RULE 3 - ESCALATE',
    description: 'Client response expressed high frustration threatening contract cancellation if contacted by bot.',
    expectedOutcome: 'ESCALATE TO HUMAN. Immediate VIP Account Executive intervention.',
    payload: {
      client_id: 'C-5582',
      client_name: 'Solaria Energy Systems Bangalore',
      client_tier: 'High-Tier',
      contact_email: 'ap@solariaenergy.in',
      contact_phone: '+91 98450 78210',
      account_manager: 'Rajesh Nair',
      invoice: {
        invoice_id: 'INV-2026-077',
        amount: 240000,
        currency: 'INR',
        issue_date: '2026-07-10',
        due_date: '2026-08-09',
        days_overdue: 26,
        service_description: 'Grid Analytics & Automated Load Balancing Platform',
        payment_link: 'https://pay.financecore.io/i/INV-2026-077'
      },
      history: {
        payment_history_rating: 'occasional_late',
        average_days_to_pay: 35,
        lifetime_invoices_paid: 11,
        last_contact_date: '2026-08-29',
        days_since_last_contact: 6,
        previous_contact_count: 2,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'angry',
        service_issue_reported: true,
        service_issue_details: 'Client VP escalated severe API latency on production solar grid during peak hours.',
        recent_interactions: [
          {
            date: '2026-08-29',
            channel: 'Email',
            note: 'Client sent angry email stating: "Fix your broken API before sending more billing reminders!"',
            response_received: true
          }
        ]
      }
    }
  },
  {
    id: 'rule-4-hard-default',
    name: 'Rule 4: Hard Default (>90 Days + Failed)',
    category: 'STOPPING_RULE',
    ruleBadge: 'RULE 4 - LEGAL',
    description: '94 days past due. 4 previous automated & manual contact attempts yielded zero response or bounced.',
    expectedOutcome: 'ESCALATE TO HUMAN. Dispatch ticket to Legal & Risk Review for recovery action.',
    payload: {
      client_id: 'C-1093',
      client_name: 'Vanguard Retail Partners Mumbai',
      client_tier: 'Low-Tier',
      contact_email: 'finance@vanguard-retail.fake',
      contact_phone: '+91 98711 23099',
      account_manager: 'Sarah Jenkins',
      invoice: {
        invoice_id: 'INV-2026-015',
        amount: 125000,
        currency: 'INR',
        issue_date: '2026-05-01',
        due_date: '2026-06-01',
        days_overdue: 95,
        service_description: 'Retail POS Analytics & Store Footprint Heatmaps',
        payment_link: 'https://pay.financecore.io/i/INV-2026-015'
      },
      history: {
        payment_history_rating: 'chronic_late',
        average_days_to_pay: 78,
        lifetime_invoices_paid: 3,
        last_contact_date: '2026-08-15',
        days_since_last_contact: 20,
        previous_contact_count: 5,
        previous_contacts_failed: true
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false,
        recent_interactions: [
          {
            date: '2026-08-15',
            channel: 'Email',
            note: 'Final suspension warning email unanswered.',
            response_received: false
          },
          {
            date: '2026-08-01',
            channel: 'WhatsApp',
            note: 'WhatsApp notification delivered, no response.',
            response_received: false
          }
        ]
      }
    }
  },
  {
    id: 'matrix-1-15-days',
    name: 'Matrix: 1-15 Days Overdue',
    category: 'INTERVENTION_MATRIX',
    ruleBadge: '1-15 DAYS',
    description: '9 days past due. Spotless historic client. Requires courteous, gentle reminder.',
    expectedOutcome: 'send_gentle_email with friendly phrasing & payment portal link.',
    payload: {
      client_id: 'C-6621',
      client_name: 'Horizon Software Solutions Hyderabad',
      client_tier: 'High-Tier',
      contact_email: 'accounts@horizonsoftware.in',
      contact_phone: '+91 98202 88410',
      account_manager: 'Rajesh Nair',
      invoice: {
        invoice_id: 'INV-2026-118',
        amount: 150000,
        currency: 'INR',
        issue_date: '2026-07-26',
        due_date: '2026-08-26',
        days_overdue: 9,
        service_description: 'Developer Suite Enterprise Seats (100 licenses)',
        payment_link: 'https://pay.financecore.io/i/INV-2026-118'
      },
      history: {
        payment_history_rating: 'spotless',
        average_days_to_pay: 22,
        lifetime_invoices_paid: 34,
        last_contact_date: '2026-08-24',
        days_since_last_contact: 11,
        previous_contact_count: 0,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'positive',
        service_issue_reported: false,
        recent_interactions: []
      }
    }
  },
  {
    id: 'matrix-16-30-days',
    name: 'Matrix: 16-30 Days Overdue',
    category: 'INTERVENTION_MATRIX',
    ruleBadge: '16-30 DAYS',
    description: '22 days past due. Email reminders unacknowledged. Escalates to WhatsApp with direct payment link.',
    expectedOutcome: 'send_firm_whatsapp with clear 48-hour payment link & urgency.',
    payload: {
      client_id: 'C-3890',
      client_name: 'Crestview Media Agency Delhi',
      client_tier: 'Mid-Tier',
      contact_email: 'finance@crestviewmedia.in',
      contact_phone: '+91 98103 44520',
      account_manager: 'Sarah Jenkins',
      invoice: {
        invoice_id: 'INV-2026-105',
        amount: 78500,
        currency: 'INR',
        issue_date: '2026-07-13',
        due_date: '2026-08-13',
        days_overdue: 22,
        service_description: 'Video Transcoding & CDN Bandwidth Allocation',
        payment_link: 'https://pay.financecore.io/i/INV-2026-105'
      },
      history: {
        payment_history_rating: 'occasional_late',
        average_days_to_pay: 42,
        lifetime_invoices_paid: 8,
        last_contact_date: '2026-08-27',
        days_since_last_contact: 8,
        previous_contact_count: 1,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false,
        recent_interactions: [
          {
            date: '2026-08-27',
            channel: 'Email',
            note: 'First polite reminder sent; opened but no payment made.',
            response_received: false
          }
        ]
      }
    }
  },
  {
    id: 'matrix-31-60-high-tier',
    name: 'Matrix: 31-60 Days (High-Tier)',
    category: 'INTERVENTION_MATRIX',
    ruleBadge: '31-60 HIGH-TIER',
    description: '42 days past due. High-Tier enterprise client. Objective is relationship preservation via installment.',
    expectedOutcome: 'propose_installment_plan_email offering structured 3-month split.',
    payload: {
      client_id: 'C-9901',
      client_name: 'BioMatrix Therapeutics Chennai',
      client_tier: 'High-Tier',
      contact_email: 'accounts.payable@biomatrix-tx.com',
      contact_phone: '+91 98404 66120',
      account_manager: 'Priya Sharma',
      invoice: {
        invoice_id: 'INV-2026-052',
        amount: 525000,
        currency: 'INR',
        issue_date: '2026-06-24',
        due_date: '2026-07-24',
        days_overdue: 42,
        service_description: 'Clinical Trial Data Ingestion Engine & Dedicated Compliance Pod',
        payment_link: 'https://pay.financecore.io/i/INV-2026-052'
      },
      history: {
        payment_history_rating: 'occasional_late',
        average_days_to_pay: 38,
        lifetime_invoices_paid: 27,
        last_contact_date: '2026-08-25',
        days_since_last_contact: 10,
        previous_contact_count: 2,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false,
        recent_interactions: [
          {
            date: '2026-08-25',
            channel: 'WhatsApp',
            note: 'Second notification sent to billing lead.',
            response_received: false
          }
        ]
      }
    }
  },
  {
    id: 'matrix-31-60-low-tier',
    name: 'Matrix: 31-60 Days (Low-Tier)',
    category: 'INTERVENTION_MATRIX',
    ruleBadge: '31-60 LOW-TIER',
    description: '42 days past due. Low-Tier customer with chronic delay. Requires strict suspension warning.',
    expectedOutcome: 'send_suspension_warning_whatsapp notifying 72-hour service cutoff.',
    payload: {
      client_id: 'C-2150',
      client_name: 'Kitecraft Studio Pune',
      client_tier: 'Low-Tier',
      contact_email: 'admin@kitecraft.in',
      contact_phone: '+91 98920 11980',
      account_manager: 'Sarah Jenkins',
      invoice: {
        invoice_id: 'INV-2026-053',
        amount: 35000,
        currency: 'INR',
        issue_date: '2026-06-24',
        due_date: '2026-07-24',
        days_overdue: 42,
        service_description: 'Starter Cloud Hosting & Asset Storage',
        payment_link: 'https://pay.financecore.io/i/INV-2026-053'
      },
      history: {
        payment_history_rating: 'chronic_late',
        average_days_to_pay: 55,
        lifetime_invoices_paid: 5,
        last_contact_date: '2026-08-26',
        days_since_last_contact: 9,
        previous_contact_count: 3,
        previous_contacts_failed: false
      },
      interaction_state: {
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false,
        recent_interactions: [
          {
            date: '2026-08-26',
            channel: 'WhatsApp',
            note: 'Standard notice sent with link.',
            response_received: false
          }
        ]
      }
    }
  }
];
