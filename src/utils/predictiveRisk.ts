import { ClientPayload, PaymentHistoryRating, ClientTier } from '../types/recovery';

export interface PredictiveRiskFactor {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  delta: number;
  description: string;
}

export interface PredictiveRiskAnalysis {
  recoveryLikelihood: number; // 0 to 100 percentage
  riskScore: number; // 0 to 100 (higher = riskier)
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  baselineScore: number;
  agingPenalty: number;
  behaviorBonusOrPenalty: number;
  frictionPenalty: number;
  factors: PredictiveRiskFactor[];
  summary: string;
  expectedResolutionWindow: string;
  suggestedActionStrategy: string;
}

/**
 * Calculates a predictive recovery risk score based on the client's past payment
 * history, invoice aging (days overdue), customer tier, and behavioral friction.
 */
export function calculatePredictiveRisk(payload: ClientPayload): PredictiveRiskAnalysis {
  const factors: PredictiveRiskFactor[] = [];
  
  // 1. BASELINE FROM PAST PAYMENT BEHAVIOR (0 to 100 scale)
  let baseScore = 60;
  let behaviorDelta = 0;
  const historyRating = payload.history.payment_history_rating;

  switch (historyRating) {
    case 'spotless':
      baseScore = 85;
      behaviorDelta = +25;
      factors.push({
        label: 'Spotless Payment Track Record',
        impact: 'positive',
        delta: +25,
        description: 'Client historically honors invoices promptly with minimal friction.'
      });
      break;
    case 'occasional_late':
      baseScore = 68;
      behaviorDelta = +8;
      factors.push({
        label: 'Occasional Late Settlement',
        impact: 'neutral',
        delta: +8,
        description: 'Client occasionally requires automated follow-up reminders before remittance.'
      });
      break;
    case 'new_client':
      baseScore = 55;
      behaviorDelta = -5;
      factors.push({
        label: 'Unestablished Credit Track (New Client)',
        impact: 'neutral',
        delta: -5,
        description: 'No prior settlement history available; default prudent baseline applied.'
      });
      break;
    case 'chronic_late':
      baseScore = 32;
      behaviorDelta = -28;
      factors.push({
        label: 'Habitual Chronic Delinquency',
        impact: 'negative',
        delta: -28,
        description: 'Pattern of prolonged delays, cash flow rationing, or payment deferrals.'
      });
      break;
  }

  // 2. AGING DEPRECIATION (Days Overdue)
  const daysOverdue = Math.max(0, payload.invoice.days_overdue);
  let agingPenalty = 0;

  if (daysOverdue === 0) {
    factors.push({
      label: 'Pre-Delinquency / Current',
      impact: 'positive',
      delta: 0,
      description: 'Invoice is within standard credit term.'
    });
  } else if (daysOverdue <= 15) {
    // 1-15 days: Minor decay 2% to 6%
    agingPenalty = Math.round(2 + (daysOverdue / 15) * 4);
    factors.push({
      label: `Early Delinquency (${daysOverdue}d overdue)`,
      impact: 'neutral',
      delta: -agingPenalty,
      description: 'Standard accounts payable processing lag window.'
    });
  } else if (daysOverdue <= 30) {
    // 16-30 days: 8% to 18% decay
    agingPenalty = Math.round(8 + ((daysOverdue - 15) / 15) * 10);
    factors.push({
      label: `Moderate Aging (${daysOverdue}d overdue)`,
      impact: 'negative',
      delta: -agingPenalty,
      description: 'Beyond standard Net-30 grace window; active outreach warranted.'
    });
  } else if (daysOverdue <= 60) {
    // 31-60 days: 20% to 38% decay
    agingPenalty = Math.round(20 + ((daysOverdue - 30) / 30) * 18);
    factors.push({
      label: `Elevated Aging (${daysOverdue}d overdue)`,
      impact: 'negative',
      delta: -agingPenalty,
      description: 'Secondary aging bucket; recovery velocity drops significantly.'
    });
  } else if (daysOverdue <= 90) {
    // 61-90 days: 40% to 60% decay
    agingPenalty = Math.round(40 + ((daysOverdue - 60) / 30) * 20);
    factors.push({
      label: `Severe Aging (${daysOverdue}d overdue)`,
      impact: 'negative',
      delta: -agingPenalty,
      description: 'Critical aged arrears; high likelihood of disputed balance or distress.'
    });
  } else {
    // > 90 days: 62% to 80% decay
    const excess = Math.min(30, daysOverdue - 90);
    agingPenalty = Math.round(62 + (excess / 30) * 18);
    factors.push({
      label: `Default Territory (${daysOverdue}d overdue)`,
      impact: 'negative',
      delta: -agingPenalty,
      description: 'Statutory write-off exposure; collection requires pre-legal escalation.'
    });
  }

  // 3. TIER & ACCOUNT EQUITY
  let tierDelta = 0;
  if (payload.client_tier === 'High-Tier') {
    tierDelta = +8;
    factors.push({
      label: 'Strategic Enterprise Tier (High Equity)',
      impact: 'positive',
      delta: +8,
      description: 'Higher ongoing commercial incentives to protect credit standing.'
    });
  } else if (payload.client_tier === 'Low-Tier') {
    tierDelta = -6;
    factors.push({
      label: 'Low Commercial Equity Tier',
      impact: 'negative',
      delta: -6,
      description: 'Lower recurring revenue exposure; higher default/attrition rate.'
    });
  }

  // 4. BEHAVIORAL FRICTION & STOPPING RULE SIGNALS
  let frictionPenalty = 0;

  // Active Promise to Pay
  if (payload.interaction_state.active_promise_to_pay?.active) {
    frictionPenalty -= 10; // positive boost
    factors.push({
      label: 'Active Promise to Pay Logged',
      impact: 'positive',
      delta: +10,
      description: `Formal remittance commitment registered for ${payload.interaction_state.active_promise_to_pay.promised_date}.`
    });
  }

  // Active Dispute
  if (payload.interaction_state.dispute_status) {
    frictionPenalty += 18;
    factors.push({
      label: 'Contested Invoice / Active Dispute',
      impact: 'negative',
      delta: -18,
      description: 'Billing contest halts routine collection; requires audit mediation.'
    });
  }

  // Service Outage / SLA Breach
  if (payload.interaction_state.service_issue_reported) {
    frictionPenalty += 14;
    factors.push({
      label: 'Open SLA Incident / Service Issue',
      impact: 'negative',
      delta: -14,
      description: 'Debtor withholding funds pending technical SLA credit resolution.'
    });
  }

  // Sentiment Friction
  if (payload.interaction_state.sentiment === 'angry') {
    frictionPenalty += 16;
    factors.push({
      label: 'Hostile / Confrontational Sentiment',
      impact: 'negative',
      delta: -16,
      description: 'Severe friction; automated interventions risk relationship destruction.'
    });
  } else if (payload.interaction_state.sentiment === 'frustrated') {
    frictionPenalty += 6;
    factors.push({
      label: 'Frustrated Debtor Sentiment',
      impact: 'negative',
      delta: -6,
      description: 'Moderate communication friction noted.'
    });
  }

  // Unresponsive / Failed Prior Contacts
  if (payload.history.previous_contacts_failed) {
    frictionPenalty += 20;
    factors.push({
      label: 'Debtor Unresponsive / Failed Contacts',
      impact: 'negative',
      delta: -20,
      description: 'Prior recovery channels unacknowledged; evasion risk elevated.'
    });
  }

  // 5. SYNTHESIZE RAW SCORE
  let rawLikelihood = baseScore - agingPenalty + tierDelta - frictionPenalty;
  
  // Mathematical bounds clamp
  const recoveryLikelihood = Math.min(96, Math.max(4, Math.round(rawLikelihood)));
  const riskScore = 100 - recoveryLikelihood;

  // Risk Classification
  let riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL' = 'LOW';
  let summary = '';
  let expectedResolutionWindow = '';
  let suggestedActionStrategy = '';

  if (recoveryLikelihood >= 75) {
    riskLevel = 'LOW';
    summary = 'High probability of organic or single-touch automated remittance.';
    expectedResolutionWindow = '3 – 7 business days';
    suggestedActionStrategy = 'Light automated reminder or self-service payment link.';
  } else if (recoveryLikelihood >= 52) {
    riskLevel = 'MODERATE';
    summary = 'Substantial collection probability, but requires structured channel nudging.';
    expectedResolutionWindow = '7 – 14 business days';
    suggestedActionStrategy = 'Direct WhatsApp payment notification or formal installment option.';
  } else if (recoveryLikelihood >= 30) {
    riskLevel = 'ELEVATED';
    summary = 'Significant default risk. Payment friction or dispute requires proactive handling.';
    expectedResolutionWindow = '15 – 30 business days';
    suggestedActionStrategy = 'Service suspension warning or dedicated Account Manager intervention.';
  } else {
    riskLevel = 'CRITICAL';
    summary = 'Severe probability of non-recovery / bad debt write-off.';
    expectedResolutionWindow = '30+ days or Legal Escrow';
    suggestedActionStrategy = 'Immediate stopping rule escalation to Legal Ops / Collections partner.';
  }

  return {
    recoveryLikelihood,
    riskScore,
    riskLevel,
    baselineScore: baseScore,
    agingPenalty,
    behaviorBonusOrPenalty: behaviorDelta,
    frictionPenalty,
    factors,
    summary,
    expectedResolutionWindow,
    suggestedActionStrategy
  };
}

export interface AgingDecayPoint {
  days: number;
  label: string;
  likelihood: number;
  riskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';
  projectedRecovery: number;
}

/**
 * Projects the aging decay curve for a specific invoice payload across 0 to 120 days overdue.
 */
export function getAgingDecayCurve(payload: ClientPayload): AgingDecayPoint[] {
  const checkDays = [0, 7, 15, 21, 30, 45, 60, 75, 90, 120];
  return checkDays.map(days => {
    const mockPayload: ClientPayload = {
      ...payload,
      invoice: {
        ...payload.invoice,
        days_overdue: days
      }
    };
    const analysis = calculatePredictiveRisk(mockPayload);
    const projectedRecovery = Math.round((payload.invoice.amount * analysis.recoveryLikelihood) / 100);
    return {
      days,
      label: days === 0 ? 'Current' : `${days}d`,
      likelihood: analysis.recoveryLikelihood,
      riskLevel: analysis.riskLevel,
      projectedRecovery
    };
  });
}

export interface PortfolioRiskSummary {
  totalDebtors: number;
  averageLikelihood: number;
  averageRiskScore: number;
  totalReceivables: number;
  projectedRecoveryYield: number;
  atRiskWriteOffCapital: number;
  lowRiskCount: number;
  moderateRiskCount: number;
  elevatedRiskCount: number;
  criticalRiskCount: number;
}

/**
 * Computes aggregate predictive statistics across a set of client payloads.
 */
export function calculatePortfolioRiskSummary(payloads: ClientPayload[]): PortfolioRiskSummary {
  if (payloads.length === 0) {
    return {
      totalDebtors: 0,
      averageLikelihood: 0,
      averageRiskScore: 0,
      totalReceivables: 0,
      projectedRecoveryYield: 0,
      atRiskWriteOffCapital: 0,
      lowRiskCount: 0,
      moderateRiskCount: 0,
      elevatedRiskCount: 0,
      criticalRiskCount: 0
    };
  }

  let totalLikelihood = 0;
  let totalReceivables = 0;
  let projectedRecoveryYield = 0;
  let lowRiskCount = 0;
  let moderateRiskCount = 0;
  let elevatedRiskCount = 0;
  let criticalRiskCount = 0;

  for (const p of payloads) {
    const analysis = calculatePredictiveRisk(p);
    totalLikelihood += analysis.recoveryLikelihood;
    totalReceivables += p.invoice.amount;
    projectedRecoveryYield += Math.round((p.invoice.amount * analysis.recoveryLikelihood) / 100);

    if (analysis.riskLevel === 'LOW') lowRiskCount++;
    else if (analysis.riskLevel === 'MODERATE') moderateRiskCount++;
    else if (analysis.riskLevel === 'ELEVATED') elevatedRiskCount++;
    else criticalRiskCount++;
  }

  const averageLikelihood = Math.round(totalLikelihood / payloads.length);
  const averageRiskScore = 100 - averageLikelihood;
  const atRiskWriteOffCapital = Math.max(0, totalReceivables - projectedRecoveryYield);

  return {
    totalDebtors: payloads.length,
    averageLikelihood,
    averageRiskScore,
    totalReceivables,
    projectedRecoveryYield,
    atRiskWriteOffCapital,
    lowRiskCount,
    moderateRiskCount,
    elevatedRiskCount,
    criticalRiskCount
  };
}

