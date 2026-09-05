import React, { useState } from 'react';
import { ClientPayload } from '../types/recovery';
import { calculatePredictiveRisk, PredictiveRiskAnalysis } from '../utils/predictiveRisk';
import { 
  Gauge, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Info,
  Clock,
  Target
} from 'lucide-react';

interface PredictiveRiskIndicatorProps {
  payload: ClientPayload;
}

export const PredictiveRiskIndicator: React.FC<PredictiveRiskIndicatorProps> = ({ payload }) => {
  const [showDriverDetails, setShowDriverDetails] = useState<boolean>(false);
  const analysis: PredictiveRiskAnalysis = calculatePredictiveRisk(payload);

  const getTheme = () => {
    switch (analysis.riskLevel) {
      case 'LOW':
        return {
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          gaugeText: 'text-emerald-700',
          barFill: 'bg-emerald-500',
          barBg: 'bg-emerald-100',
          cardBg: 'bg-emerald-50/40 border-emerald-200',
          label: 'LOW DEFAULT RISK',
          icon: ShieldCheck
        };
      case 'MODERATE':
        return {
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          gaugeText: 'text-amber-700',
          barFill: 'bg-amber-500',
          barBg: 'bg-amber-100',
          cardBg: 'bg-amber-50/40 border-amber-200',
          label: 'MODERATE RISK',
          icon: Gauge
        };
      case 'ELEVATED':
        return {
          badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
          gaugeText: 'text-orange-700',
          barFill: 'bg-orange-500',
          barBg: 'bg-orange-100',
          cardBg: 'bg-orange-50/40 border-orange-200',
          label: 'ELEVATED RISK',
          icon: AlertTriangle
        };
      case 'CRITICAL':
        return {
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
          gaugeText: 'text-rose-700',
          barFill: 'bg-rose-600',
          barBg: 'bg-rose-100',
          cardBg: 'bg-rose-50/40 border-rose-200',
          label: 'CRITICAL DEFAULT RISK',
          icon: ShieldAlert
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  return (
    <div className={`p-3.5 rounded-xl border transition-all duration-300 shadow-2xs ${theme.cardBg}`}>
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-stone-900 text-amber-400 flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <span>Predictive Recovery Likelihood</span>
              </h4>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badgeBg}`}>
                <IconComponent className="w-3 h-3" />
                <span>{theme.label}</span>
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Evaluates aging velocity, payment rating ({payload.history.payment_history_rating}), and behavioral friction.
            </p>
          </div>
        </div>

        {/* Risk Index Metric */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-2 py-1 rounded bg-white border border-stone-200 shadow-2xs text-right">
            <span className="text-[10px] text-stone-400 block leading-tight">RISK INDEX</span>
            <span className="font-bold text-stone-800 text-xs">
              {analysis.riskScore} <span className="text-stone-400 font-normal">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Metric Visualization */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Likelihood Gauge Bar */}
        <div className="md:col-span-7 bg-white p-3 rounded-lg border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-medium text-stone-400 uppercase tracking-wider block">
                Estimated Recovery Probability
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold tracking-tight font-mono ${theme.gaugeText}`}>
                  {analysis.recoveryLikelihood}%
                </span>
                <span className="text-xs text-stone-600 font-medium">
                  {analysis.recoveryLikelihood >= 75 
                    ? 'High Likelihood' 
                    : analysis.recoveryLikelihood >= 52 
                    ? 'Moderate Likelihood' 
                    : analysis.recoveryLikelihood >= 30 
                    ? 'Strained Likelihood' 
                    : 'Low Likelihood / Default Hazard'}
                </span>
              </div>
            </div>

            <div className="text-right text-[11px] font-mono text-stone-500">
              <span>{payload.invoice.days_overdue}d Overdue</span>
            </div>
          </div>

          {/* Dual-color Gauge Meter */}
          <div className="w-full">
            <div className={`h-2.5 w-full rounded-full ${theme.barBg} overflow-hidden p-0.5 border border-stone-200/60`}>
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${theme.barFill}`}
                style={{ width: `${analysis.recoveryLikelihood}%` }}
              />
            </div>
            {/* Scale markers */}
            <div className="flex justify-between text-[9px] font-mono text-stone-400 mt-1 px-0.5">
              <span>0% (Default)</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100% (Remitted)</span>
            </div>
          </div>

          {/* Strategy Insight */}
          <p className="text-[11px] text-stone-600 pt-1 border-t border-stone-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-medium text-stone-800">{analysis.summary}</span>
          </p>
        </div>

        {/* Operational Horizon & Recommended Action */}
        <div className="md:col-span-5 flex flex-col gap-2">
          <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-medium mb-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>EXPECTED RESOLUTION HORIZON</span>
            </div>
            <p className="font-semibold text-stone-800 font-mono text-xs">
              {analysis.expectedResolutionWindow}
            </p>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-stone-200 text-xs shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-[10px] font-medium mb-1">
              <Target className="w-3 h-3 text-emerald-600" />
              <span>RECOMMENDED INTERVENTION STRATEGY</span>
            </div>
            <p className="font-medium text-stone-800 text-[11px] leading-snug">
              {analysis.suggestedActionStrategy}
            </p>
          </div>
        </div>
      </div>

      {/* Accordion Toggle for Mathematical Risk Drivers */}
      <div className="mt-2.5 pt-2 border-t border-stone-200/80">
        <button
          type="button"
          onClick={() => setShowDriverDetails(!showDriverDetails)}
          className="w-full flex items-center justify-between text-xs text-stone-600 hover:text-stone-900 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            <span>Mathematical Risk Drivers &amp; Score Weights ({analysis.factors.length} signals)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-mono text-stone-500">
            {showDriverDetails ? 'Hide breakdown' : 'View breakdown'}
            {showDriverDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showDriverDetails && (
          <div className="mt-2 space-y-1.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {analysis.factors.map((factor, idx) => {
                const isPos = factor.impact === 'positive';
                const isNeg = factor.impact === 'negative';
                return (
                  <div 
                    key={idx}
                    className="p-2 rounded bg-white border border-stone-200 flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-stone-800 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isPos ? 'bg-emerald-500' : isNeg ? 'bg-rose-500' : 'bg-stone-400'
                        }`} />
                        <span>{factor.label}</span>
                      </div>
                      <p className="text-stone-500 text-[10px] leading-tight">{factor.description}</p>
                    </div>

                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                      factor.delta > 0 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : factor.delta < 0 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {factor.delta > 0 ? `+${factor.delta}%` : factor.delta < 0 ? `${factor.delta}%` : '0%'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Formula explanation note */}
            <div className="p-2 rounded bg-stone-100/70 border border-stone-200 text-[10px] text-stone-500 font-mono">
              Formula: Recovery Likelihood = Baseline ({analysis.baselineScore}%) - Aging Penalty ({analysis.agingPenalty}%) + Tier ({payload.client_tier}) - Friction Penalties ({analysis.frictionPenalty}%).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
