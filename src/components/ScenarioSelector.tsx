import React from 'react';
import { PRESET_SCENARIOS, ScenarioPreset } from '../agent/presets';
import { ShieldAlert, Split, CheckCircle2, MessageSquare, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface ScenarioSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (preset: ScenarioPreset) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  selectedPresetId,
  onSelectPreset
}) => {
  const stoppingRules = PRESET_SCENARIOS.filter(s => s.category === 'STOPPING_RULE');
  const matrixScenarios = PRESET_SCENARIOS.filter(s => s.category === 'INTERVENTION_MATRIX');

  const waScenario1630 = PRESET_SCENARIOS.find(s => s.id === 'matrix-16-30-days');
  const waScenarioLowTier = PRESET_SCENARIOS.find(s => s.id === 'matrix-31-60-low-tier');

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-900 tracking-tight flex items-center gap-2">
          <span>Test Scenarios & Guardrail Matrix</span>
        </h2>
        <span className="text-xs text-stone-500 font-mono">
          Select a payload to inspect agent behavior
        </span>
      </div>

      <div className="space-y-4">
        {/* Strict Stopping Rules Group */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Strict Stopping Rules (Non-Negotiable Guardrails)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {stoppingRules.map(preset => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  id={`scenario-btn-${preset.id}`}
                  onClick={() => onSelectPreset(preset)}
                  className={`text-left p-2.5 rounded-lg border transition-all relative ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                      isSelected ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {preset.ruleBadge}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </div>
                  <div className="text-xs font-medium text-stone-900 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                    {preset.description}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100 text-[10px] font-mono">
                    <span className="text-stone-400 font-sans">{preset.payload.client_tier}</span>
                    <span className="font-semibold text-stone-800">{formatCurrency(preset.payload.invoice.amount, preset.payload.invoice.currency)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Intervention Matrix Group */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 uppercase tracking-wider">
              <Split className="w-3.5 h-3.5 text-blue-600" />
              <span>Intervention Matrix (Aging & Tier Bracket Dispatch)</span>
            </div>

            {/* Quick WhatsApp Test Buttons */}
            <div className="flex items-center gap-1.5 text-xs">
              {waScenario1630 && (
                <button
                  onClick={() => onSelectPreset(waScenario1630)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                    selectedPresetId === waScenario1630.id
                      ? 'bg-[#25D366] text-white border-[#25D366]'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Test 16-30 days overdue firm WhatsApp dispatch"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Test 16–30d WhatsApp</span>
                </button>
              )}

              {waScenarioLowTier && (
                <button
                  onClick={() => onSelectPreset(waScenarioLowTier)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                    selectedPresetId === waScenarioLowTier.id
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                  }`}
                  title="Test 31-60 days low-tier WhatsApp service suspension warning"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Test 31–60d Suspension</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {matrixScenarios.map(preset => {
              const isSelected = selectedPresetId === preset.id;
              const isWhatsApp1630 = preset.id === 'matrix-16-30-days';
              const isWhatsAppSuspension = preset.id === 'matrix-31-60-low-tier';

              return (
                <button
                  key={preset.id}
                  id={`scenario-btn-${preset.id}`}
                  onClick={() => onSelectPreset(preset)}
                  className={`text-left p-2.5 rounded-lg border transition-all relative cursor-pointer ${
                    isSelected
                      ? isWhatsAppSuspension
                        ? 'border-rose-500 bg-rose-50/80 ring-1 ring-rose-500/20 shadow-xs'
                        : isWhatsApp1630
                        ? 'border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500/20 shadow-xs'
                        : 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/20 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/70 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium flex items-center gap-1 ${
                      isSelected
                        ? isWhatsAppSuspension
                          ? 'bg-rose-600 text-white'
                          : isWhatsApp1630
                          ? 'bg-[#25D366] text-white'
                          : 'bg-blue-600 text-white'
                        : isWhatsAppSuspension
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isWhatsApp1630
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-700'
                    }`}>
                      {(isWhatsApp1630 || isWhatsAppSuspension) && (
                        <MessageSquare className="w-2.5 h-2.5" />
                      )}
                      <span>{preset.ruleBadge}</span>
                    </span>
                    {isSelected && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${
                        isWhatsAppSuspension ? 'text-rose-600' : isWhatsApp1630 ? 'text-emerald-600' : 'text-blue-600'
                      }`} />
                    )}
                  </div>
                  <div className="text-xs font-medium text-stone-900 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-snug">
                    {preset.description}
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100 text-[10px] font-mono">
                    <span className="text-stone-400 font-sans">{preset.payload.client_tier}</span>
                    <span className="font-semibold text-stone-800">{formatCurrency(preset.payload.invoice.amount, preset.payload.invoice.currency)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
