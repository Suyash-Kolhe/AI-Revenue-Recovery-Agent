export type ClientTier = 'High-Tier' | 'Low-Tier' | 'Mid-Tier';

export type PaymentHistoryRating = 'spotless' | 'occasional_late' | 'chronic_late' | 'new_client';

export type ClientSentiment = 'positive' | 'neutral' | 'frustrated' | 'angry';

export interface RecentInteraction {
  date: string;
  channel: 'Email' | 'WhatsApp' | 'Phone' | 'Portal';
  note: string;
  response_received: boolean;
}

export interface ClientPayload {
  client_id: string;
  client_name: string;
  client_tier: ClientTier;
  contact_email: string;
  contact_phone: string;
  account_manager: string;
  
  invoice: {
    invoice_id: string;
    amount: number;
    currency: string;
    issue_date: string;
    due_date: string;
    days_overdue: number;
    service_description: string;
    payment_link: string;
  };

  history: {
    payment_history_rating: PaymentHistoryRating;
    average_days_to_pay: number;
    lifetime_invoices_paid: number;
    last_contact_date: string;
    days_since_last_contact: number;
    previous_contact_count: number;
    previous_contacts_failed: boolean;
  };

  interaction_state: {
    active_promise_to_pay: {
      active: boolean;
      promised_date: string; // YYYY-MM-DD
      promised_amount?: number;
      notes?: string;
    } | null;
    dispute_status: boolean;
    dispute_details?: string;
    sentiment: ClientSentiment;
    service_issue_reported: boolean;
    service_issue_details?: string;
    recent_interactions: RecentInteraction[];
  };
}

export interface RuleEvaluationResult {
  checked: boolean;
  triggered: boolean;
  detail: string;
}

export interface StoppingRulesEvaluation {
  rule_1_frequency: RuleEvaluationResult;
  rule_2_promise_to_pay: RuleEvaluationResult;
  rule_3_escalation: RuleEvaluationResult;
  rule_4_hard_default: RuleEvaluationResult;
}

export type ActionCategory = 
  | 'NO_ACTION_SKIP'
  | 'ESCALATE_TO_HUMAN'
  | 'INTERVENTION_EXECUTED';

export interface ToolCallExecution {
  tool_name: 
    | 'skip_and_audit'
    | 'escalate_to_human'
    | 'send_gentle_email'
    | 'send_firm_whatsapp'
    | 'propose_installment_plan_email'
    | 'send_suspension_warning_whatsapp';
  parameters: Record<string, any>;
  rendered_content?: {
    channel: 'Email' | 'WhatsApp' | 'Escalation Ticket' | 'Compliance System';
    title: string;
    recipient: string;
    subject?: string;
    body: string;
    meta?: Record<string, any>;
  };
}

export interface AuditTrailRecord {
  id: string;
  timestamp: string;
  invoice_id: string;
  client_id: string;
  client_name: string;
  client_tier: ClientTier;
  contact_email?: string;
  contact_phone?: string;
  amount_due?: string;
  currency?: string;
  days_overdue: number;
  days_since_last_contact: number;
  stopping_rules: StoppingRulesEvaluation;
  action_category: ActionCategory;
  applied_rule_or_matrix: string;
  communication_tone: string;
  decision_rationale: string;
  tool_call: ToolCallExecution;
  compliance_guardrails_passed: boolean;
  predictive_risk?: {
    recovery_likelihood: number;
    risk_score: number;
    risk_level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  };
}

export interface AgentCycleResult {
  gather: {
    invoice_id: string;
    client_name: string;
    client_tier: ClientTier;
    contact_email?: string;
    contact_phone?: string;
    days_overdue: number;
    last_contact_date: string;
    days_since_last_contact: number;
    amount_due: string;
    history_rating: PaymentHistoryRating;
  };
  evaluate: {
    stopping_rule_triggered: boolean;
    triggering_rule?: string;
    stopping_rules: StoppingRulesEvaluation;
    calculated_tone: string;
    matrix_bracket: string;
    predictive_risk?: {
      recovery_likelihood: number;
      risk_score: number;
      risk_level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
      summary: string;
    };
  };
  act: ToolCallExecution;
  record: AuditTrailRecord;
  execution_time_ms: number;
}
