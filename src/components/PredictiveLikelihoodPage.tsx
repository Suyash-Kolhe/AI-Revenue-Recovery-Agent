import React, { useState, useMemo } from 'react';
import { ClientPayload, PaymentHistoryRating, ClientTier } from '../types/recovery';
import { PRESET_SCENARIOS, ScenarioPreset } from '../agent/presets';
import { 
  calculatePredictiveRisk, 
  getAgingDecayCurve, 
  calculatePortfolioRiskSummary,
  PredictiveRiskAnalysis,
  AgingDecayPoint
} from '../utils/predictiveRisk';
import { formatCurrency, formatIndianDenomination } from '../utils/currency';
import { 
  TrendingUp, 
  Gauge, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Target, 
  ArrowRight, 
  Sparkles, 
  Info, 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Zap, 
  ChevronRight,
  Sliders,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface PredictiveLikelihoodPageProps {
  currentPayload: ClientPayload;
  onUpdatePayload: (updated: ClientPayload) => void;
  onNavigateToOMS: (presetToLoad?: ScenarioPreset) => void;
}

export const PredictiveLikelihoodPage: React.FC<PredictiveLikelihoodPageProps> = ({
  currentPayload,
  onUpdatePayload,
  onNavigateToOMS
}) => {
  // Local state for active simulation adjustments
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>('current');

  // Benchmark all 9 preset scenarios
  const portfolioSummary = useMemo(() => {
    const allPayloads = [currentPayload, ...PRESET_SCENARIOS.map(p => p.payload)];
    return calculatePortfolioRiskSummary(allPayloads);
  }, [currentPayload]);

  const presetAnalyses = useMemo(() => {
    return PRESET_SCENARIOS.map(preset => {
      const analysis = calculatePredictiveRisk(preset.payload);
      const projectedRecovery = Math.round((preset.payload.invoice.amount * analysis.recoveryLikelihood) / 100);
      const atRiskAmount = preset.payload.invoice.amount - projectedRecovery;
      return {
        preset,
        analysis,
        projectedRecovery,
        atRiskAmount
      };
    });
  }, []);

  // Current client analysis
  const currentAnalysis: PredictiveRiskAnalysis = useMemo(() => {
    return calculatePredictiveRisk(currentPayload);
  }, [currentPayload]);

  // Aging decay curve for current payload
  const decayCurve: AgingDecayPoint[] = useMemo(() => {
    return getAgingDecayCurve(currentPayload);
  }, [currentPayload]);

  const projectedRecoveryAmount = Math.round((currentPayload.invoice.amount * currentAnalysis.recoveryLikelihood) / 100);
  const projectedAtRiskAmount = Math.max(0, currentPayload.invoice.amount - projectedRecoveryAmount);

  const getRiskTheme = (level: 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL') => {
    switch (level) {
      case 'LOW':
        return {
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          text: 'text-emerald-700',
          fill: 'bg-emerald-500',
          border: 'border-emerald-200',
          bg: 'bg-emerald-50/40',
          icon: ShieldCheck,
          label: 'LOW DEFAULT RISK'
        };
      case 'MODERATE':
        return {
          badge: 'bg-amber-100 text-amber-900 border-amber-300',
          text: 'text-amber-700',
          fill: 'bg-amber-500',
          border: 'border-amber-200',
          bg: 'bg-amber-50/40',
          icon: Gauge,
          label: 'MODERATE RISK'
        };
      case 'ELEVATED':
        return {
          badge: 'bg-orange-100 text-orange-900 border-orange-300',
          text: 'text-orange-700',
          fill: 'bg-orange-500',
          border: 'border-orange-200',
          bg: 'bg-orange-50/40',
          icon: AlertTriangle,
          label: 'ELEVATED RISK'
        };
      case 'CRITICAL':
        return {
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          text: 'text-rose-700',
          fill: 'bg-rose-600',
          border: 'border-rose-200',
          bg: 'bg-rose-50/40',
          icon: ShieldAlert,
          label: 'CRITICAL DEFAULT RISK'
        };
    }
  };

  const theme = getRiskTheme(currentAnalysis.riskLevel);
  const RiskIcon = theme.icon;

  const handleSelectPresetDebtor = (preset: ScenarioPreset) => {
    setSelectedDebtorId(preset.id);
    onUpdatePayload(preset.payload);
  };

  const handleDaysOverdueChange = (val: number) => {
    onUpdatePayload({
      ...currentPayload,
      invoice: {
        ...currentPayload.invoice,
        days_overdue: val
      }
    });
  };

  const handlePaymentHistoryChange = (rating: PaymentHistoryRating) => {
    onUpdatePayload({
      ...currentPayload,
      history: {
        ...currentPayload.history,
        payment_history_rating: rating
      }
    });
  };

  const handleTierChange = (tier: ClientTier) => {
    onUpdatePayload({
      ...currentPayload,
      client_tier: tier
    });
  };

  const handleDisputeToggle = () => {
    onUpdatePayload({
      ...currentPayload,
      interaction_state: {
        ...currentPayload.interaction_state,
        dispute_status: !currentPayload.interaction_state.dispute_status
      }
    });
  };

  const handleOutageToggle = () => {
    onUpdatePayload({
      ...currentPayload,
      interaction_state: {
        ...currentPayload.interaction_state,
        service_issue_reported: !currentPayload.interaction_state.service_issue_reported
      }
    });
  };

  const handleFailedContactsToggle = () => {
    onUpdatePayload({
      ...currentPayload,
      history: {
        ...currentPayload.history,
        previous_contacts_failed: !currentPayload.history.previous_contacts_failed
      }
    });
  };

  const handleSentimentChange = (sentiment: 'neutral' | 'frustrated' | 'angry') => {
    onUpdatePayload({
      ...currentPayload,
      interaction_state: {
        ...currentPayload.interaction_state,
        sentiment
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Title & Quick Action */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">
              Predictive Recovery Likelihood &amp; Risk Intelligence
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Real-Time Actuarial Model
            </span>
          </div>
          <p className="text-xs text-stone-600 max-w-3xl">
            Correlates historical settlement behavior, non-linear invoice aging decay, debtor commercial equity, and operational friction to project probability of remittance, financial write-off risk, and optimal recovery timing.
          </p>
        </div>

        <button
          onClick={() => onNavigateToOMS()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
        >
          <span>Dispatch in Framework Cycle (OMS)</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Portfolio Aggregate Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Average Recovery Probability</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-stone-900">{portfolioSummary.averageLikelihood}%</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Active Benchmark
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Across {portfolioSummary.totalDebtors} monitored enterprise accounts</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Projected Cash Recovery Yield</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {formatCurrency(portfolioSummary.projectedRecoveryYield, currentPayload.invoice.currency)}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Total Receivables: {formatCurrency(portfolioSummary.totalReceivables, currentPayload.invoice.currency)}
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Default Write-off Exposure</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-rose-700">
              {formatCurrency(portfolioSummary.atRiskWriteOffCapital, currentPayload.invoice.currency)}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Unmitigated non-collection capital at risk</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Risk Distribution Profile</span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800" title="Low Risk">
              {portfolioSummary.lowRiskCount} Low
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800" title="Moderate Risk">
              {portfolioSummary.moderateRiskCount} Mod
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800" title="Elevated Risk">
              {portfolioSummary.elevatedRiskCount} Elev
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800" title="Critical Risk">
              {portfolioSummary.criticalRiskCount} Crit
            </span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 font-mono">Portfolio Health Index: {portfolioSummary.averageRiskScore}/100</p>
        </div>
      </div>

      {/* Main Focus: Active Debtor Simulation & Interactive Stress Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (5 cols): Parameter Stress Testing Controls */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-stone-700" />
              <h3 className="text-sm font-bold text-stone-900">Debtor Stress Test Parameters</h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {currentPayload.client_name.split(' ')[0]}
            </span>
          </div>

          {/* Preset Quick Select for Simulation */}
          <div>
            <label className="text-[11px] font-semibold text-stone-700 block mb-1.5">
              Load Preset Profile for Risk Simulation:
            </label>
            <select
              value={selectedDebtorId}
              onChange={(e) => {
                const p = PRESET_SCENARIOS.find(s => s.id === e.target.value);
                if (p) handleSelectPresetDebtor(p);
              }}
              className="w-full text-xs font-mono p-2 rounded-lg border border-stone-300 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-800"
            >
              <option value="current">Current Active Payload ({currentPayload.client_name})</option>
              {PRESET_SCENARIOS.map(s => (
                <option key={s.id} value={s.id}>
                  {s.payload.client_name} - {s.name} ({s.payload.invoice.days_overdue}d overdue)
                </option>
              ))}
            </select>
          </div>

          {/* Days Overdue Interactive Slider */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Invoice Aging: Days Overdue</span>
              </span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-stone-200 text-stone-900">
                {currentPayload.invoice.days_overdue} days
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="1"
              value={currentPayload.invoice.days_overdue}
              onChange={(e) => handleDaysOverdueChange(Number(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-stone-400">
              <span>0d (Current)</span>
              <span>30d (Grace End)</span>
              <span>60d (Arrears)</span>
              <span>90d+ (Default)</span>
            </div>
          </div>

          {/* Past Payment Behavior Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-700 block">
              Historical Payment Track Record:
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { key: 'spotless', label: 'Spotless', desc: '+25% baseline' },
                { key: 'occasional_late', label: 'Occasional Late', desc: '+8% baseline' },
                { key: 'new_client', label: 'New Client', desc: '-5% baseline' },
                { key: 'chronic_late', label: 'Chronic Delinquent', desc: '-28% penalty' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handlePaymentHistoryChange(item.key as PaymentHistoryRating)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    currentPayload.history.payment_history_rating === item.key
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="font-bold text-[11px] leading-tight">{item.label}</div>
                  <div className={`text-[10px] ${currentPayload.history.payment_history_rating === item.key ? 'text-stone-300' : 'text-stone-500'}`}>
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customer Commercial Tier */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-stone-700 block">
              Commercial Account Tier:
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['High-Tier', 'Mid-Tier', 'Low-Tier'] as ClientTier[]).map(tier => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleTierChange(tier)}
                  className={`py-1.5 px-2 rounded-lg border font-medium text-xs text-center transition-all cursor-pointer ${
                    currentPayload.client_tier === tier
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {/* Behavioral Friction Factors */}
          <div className="space-y-2 pt-2 border-t border-stone-200">
            <label className="text-[11px] font-semibold text-stone-700 block">
              Friction Signals &amp; Stopping Triggers:
            </label>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center justify-between p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer">
                <span className="text-[11px] font-medium text-stone-800">Active Billing Dispute</span>
                <input
                  type="checkbox"
                  checked={currentPayload.interaction_state.dispute_status}
                  onChange={handleDisputeToggle}
                  className="rounded border-stone-300 accent-rose-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer">
                <span className="text-[11px] font-medium text-stone-800">Open Service / SLA Incident</span>
                <input
                  type="checkbox"
                  checked={currentPayload.interaction_state.service_issue_reported}
                  onChange={handleOutageToggle}
                  className="rounded border-stone-300 accent-amber-600"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer">
                <span className="text-[11px] font-medium text-stone-800">Debtor Ghosting / Failed Contacts</span>
                <input
                  type="checkbox"
                  checked={currentPayload.history.previous_contacts_failed}
                  onChange={handleFailedContactsToggle}
                  className="rounded border-stone-300 accent-rose-600"
                />
              </label>
            </div>

            {/* Sentiment */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-stone-700 block mb-1">Debtor Sentiment:</span>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {(['neutral', 'frustrated', 'angry'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSentimentChange(s)}
                    className={`py-1 px-2 rounded border text-xs capitalize transition-all cursor-pointer ${
                      currentPayload.interaction_state.sentiment === s
                        ? 'border-stone-900 bg-stone-900 text-white font-bold'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Resulting Likelihood, Aging Curve & Action Strategy */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Likelihood Showcase Card */}
          <div className={`p-4 rounded-xl border shadow-2xs transition-all ${theme.bg} ${theme.border}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-stone-900">
                    {currentPayload.client_name}
                  </h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badge}`}>
                    <RiskIcon className="w-3.5 h-3.5" />
                    <span>{theme.label}</span>
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5 font-mono">
                  Invoice {currentPayload.invoice.invoice_id} • {formatCurrency(currentPayload.invoice.amount, currentPayload.invoice.currency)} • {currentPayload.client_tier}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg bg-white border border-stone-200 text-right shadow-2xs">
                  <span className="text-[10px] text-stone-400 block font-mono">RISK INDEX</span>
                  <span className="font-extrabold font-mono text-stone-900 text-sm">
                    {currentAnalysis.riskScore} <span className="text-stone-400 text-xs font-normal">/ 100</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Big Probability Meter & Monetary Yield Projection */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
              <div className="sm:col-span-7 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs space-y-2">
                <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider block font-mono">
                  Estimated Recovery Likelihood
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-extrabold font-mono tracking-tight ${theme.text}`}>
                    {currentAnalysis.recoveryLikelihood}%
                  </span>
                  <span className="text-xs font-semibold text-stone-700">
                    {currentAnalysis.recoveryLikelihood >= 75
                      ? 'High Remittance Confidence'
                      : currentAnalysis.recoveryLikelihood >= 52
                      ? 'Moderate Recovery Window'
                      : currentAnalysis.recoveryLikelihood >= 30
                      ? 'Strained / Arrears Friction'
                      : 'Severe Default Hazard'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden p-0.5 border border-stone-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${theme.fill}`}
                    style={{ width: `${currentAnalysis.recoveryLikelihood}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] font-mono text-stone-400">
                  <span>0% Non-Recovery</span>
                  <span>50%</span>
                  <span>100% Full Remittance</span>
                </div>
              </div>

              {/* Monetary Yield Comparison */}
              <div className="sm:col-span-5 flex flex-col gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs shadow-2xs">
                  <span className="text-[10px] text-stone-500 font-medium block">PROJECTED RECOVERY CASH</span>
                  <span className="font-bold text-emerald-800 font-mono text-sm block mt-0.5">
                    {formatCurrency(projectedRecoveryAmount, currentPayload.invoice.currency)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ({currentAnalysis.recoveryLikelihood}% expected collection)
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs shadow-2xs">
                  <span className="text-[10px] text-stone-500 font-medium block">AT-RISK WRITE-OFF EXPOSURE</span>
                  <span className="font-bold text-rose-700 font-mono text-sm block mt-0.5">
                    {formatCurrency(projectedAtRiskAmount, currentPayload.invoice.currency)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    ({100 - currentAnalysis.recoveryLikelihood}% bad debt write-off)
                  </span>
                </div>
              </div>
            </div>

            {/* Strategic Advice */}
            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
                <div className="flex items-center gap-1 text-stone-500 text-[10px] font-medium mb-0.5">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>EXPECTED RESOLUTION HORIZON</span>
                </div>
                <p className="font-semibold text-stone-900 font-mono text-xs">
                  {currentAnalysis.expectedResolutionWindow}
                </p>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
                <div className="flex items-center gap-1 text-stone-500 text-[10px] font-medium mb-0.5">
                  <Target className="w-3 h-3 text-emerald-600" />
                  <span>RECOMMENDED ACTION STRATEGY</span>
                </div>
                <p className="font-medium text-stone-800 text-[11px] leading-snug">
                  {currentAnalysis.suggestedActionStrategy}
                </p>
              </div>
            </div>
          </div>

          {/* Aging Decay Visualizer (0d to 120d Curve) */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-stone-600" />
                <h4 className="text-xs font-bold text-stone-900">
                  Aging Decay Curve (Recovery Likelihood vs. Days Overdue)
                </h4>
              </div>
              <span className="text-[10px] font-mono text-stone-500">
                Current Position: {currentPayload.invoice.days_overdue}d
              </span>
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Simulates how probability decays over time for this exact debtor profile if uncollected.
            </p>

            {/* Visual Bar Chart of Decay Points */}
            <div className="grid grid-cols-10 gap-1.5 items-end h-28 pt-2 pb-1 border-b border-stone-200">
              {decayCurve.map((point) => {
                const isCurrent = Math.abs(point.days - currentPayload.invoice.days_overdue) <= 5;
                const barHeight = Math.max(8, Math.round(point.likelihood * 0.9));
                const barColor = 
                  point.likelihood >= 75 ? 'bg-emerald-500' :
                  point.likelihood >= 52 ? 'bg-amber-500' :
                  point.likelihood >= 30 ? 'bg-orange-500' : 'bg-rose-500';

                return (
                  <div key={point.days} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 bg-stone-900 text-white text-[9px] font-mono px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {point.likelihood}% ({formatCurrency(point.projectedRecovery, currentPayload.invoice.currency)})
                    </div>

                    <span className="text-[9px] font-mono text-stone-600 mb-1">
                      {point.likelihood}%
                    </span>

                    <div 
                      className={`w-full rounded-t transition-all ${barColor} ${
                        isCurrent ? 'ring-2 ring-stone-900 ring-offset-1' : 'opacity-80 group-hover:opacity-100'
                      }`}
                      style={{ height: `${barHeight}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels below chart */}
            <div className="grid grid-cols-10 gap-1.5 text-center mt-1.5">
              {decayCurve.map(point => (
                <span 
                  key={point.days} 
                  className={`text-[9px] font-mono truncate ${
                    Math.abs(point.days - currentPayload.invoice.days_overdue) <= 5
                      ? 'font-bold text-stone-900 underline'
                      : 'text-stone-400'
                  }`}
                >
                  {point.label}
                </span>
              ))}
            </div>

            {/* Milestones Annotations */}
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono text-stone-500 pt-2 border-t border-stone-100">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt;75%: Standard AP Lag (0–15d)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 52–75%: Net-30 Grace Expiry (16–30d)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> 30–52%: Elevated Arrears (31–60d)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> &lt;30%: Default Hazard (&gt;60d)
              </span>
            </div>
          </div>

          {/* Mathematical Driver Breakdown */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-stone-500" />
                <span>Score Formulation &amp; Attribution</span>
              </h4>
              <span className="text-[11px] font-mono text-stone-500">
                Baseline: {currentAnalysis.baselineScore}% | Aging Penalty: -{currentAnalysis.agingPenalty}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {currentAnalysis.factors.map((f, i) => (
                <div key={i} className="p-2 rounded bg-stone-50 border border-stone-200 flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-stone-800 text-[11px]">{f.label}</div>
                    <div className="text-stone-500 text-[10px] leading-tight">{f.description}</div>
                  </div>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    f.delta > 0 ? 'bg-emerald-100 text-emerald-800' :
                    f.delta < 0 ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {f.delta > 0 ? `+${f.delta}%` : f.delta < 0 ? `${f.delta}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Scenario Presets Benchmark Table */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              <span>Comparative Debtor Benchmark (All 9 Framework Scenarios)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Evaluates predictive collection probability across all enterprise scenario presets.
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md">
            9 Enterprise Test Profiles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-600 font-mono text-[11px]">
                <th className="py-2.5 px-3">Debtor &amp; Tier</th>
                <th className="py-2.5 px-3">Invoice &amp; Aging</th>
                <th className="py-2.5 px-3">Payment History</th>
                <th className="py-2.5 px-3">Friction Status</th>
                <th className="py-2.5 px-3">Recovery Likelihood</th>
                <th className="py-2.5 px-3">Projected Yield</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 font-sans">
              {presetAnalyses.map(({ preset, analysis, projectedRecovery, atRiskAmount }) => {
                const itemTheme = getRiskTheme(analysis.riskLevel);
                const isSelected = currentPayload.client_id === preset.payload.client_id;

                return (
                  <tr 
                    key={preset.id} 
                    className={`hover:bg-stone-50/80 transition-colors ${isSelected ? 'bg-amber-50/30' : ''}`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-stone-900">{preset.payload.client_name}</div>
                      <div className="text-[10px] font-mono text-stone-500">
                        {preset.payload.client_id} • {preset.payload.client_tier}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-medium text-stone-800">
                        {formatCurrency(preset.payload.invoice.amount, preset.payload.invoice.currency)}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500">
                        {preset.payload.invoice.days_overdue} days overdue
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-stone-700 capitalize">
                        {preset.payload.history.payment_history_rating.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-stone-400 font-mono">
                        Avg: {preset.payload.history.average_days_to_pay}d
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {preset.payload.interaction_state.dispute_status ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Dispute Active
                        </span>
                      ) : preset.payload.interaction_state.service_issue_reported ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          SLA Incident
                        </span>
                      ) : preset.payload.history.previous_contacts_failed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Ghosting
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Clean Channel
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold text-xs ${itemTheme.text}`}>
                          {analysis.recoveryLikelihood}%
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${itemTheme.badge}`}>
                          {analysis.riskLevel}
                        </span>
                      </div>
                      <div className="w-20 h-1.5 bg-stone-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full ${itemTheme.fill}`} 
                          style={{ width: `${analysis.recoveryLikelihood}%` }} 
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="text-emerald-800 font-medium">
                        {formatCurrency(projectedRecovery, preset.payload.invoice.currency)}
                      </div>
                      <div className="text-[10px] text-rose-600">
                        -{formatCurrency(atRiskAmount, preset.payload.invoice.currency)} risk
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSelectPresetDebtor(preset)}
                          className="px-2 py-1 text-[11px] rounded bg-white border border-stone-200 hover:border-stone-400 text-stone-700 font-medium transition-colors cursor-pointer"
                        >
                          Simulate
                        </button>
                        <button
                          onClick={() => {
                            onNavigateToOMS(preset);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                        >
                          <span>Execute in OMS</span>
                          <ArrowUpRight className="w-3 h-3 text-amber-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
