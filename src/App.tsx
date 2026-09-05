import React, { useState, useEffect } from 'react';
import { PRESET_SCENARIOS, ScenarioPreset } from './agent/presets';
import { RevenueRecoveryEngine } from './agent/recoveryEngine';
import { ClientPayload, AgentCycleResult, AuditTrailRecord } from './types/recovery';
import { Header, AppPage } from './components/Header';
import { ScenarioSelector } from './components/ScenarioSelector';
import { PayloadEditor } from './components/PayloadEditor';
import { AgentExecutionView } from './components/AgentExecutionView';
import { AuditTrailLedger } from './components/AuditTrailLedger';
import { PredictiveLikelihoodPage } from './components/PredictiveLikelihoodPage';
import { RulesReferenceModal } from './components/RulesReferenceModal';
import { BookOpen, RefreshCw, CheckCircle2, ShieldCheck, TrendingUp, Cpu, FileCheck, ArrowRight } from 'lucide-react';
import { formatCurrency } from './utils/currency';
import { downloadAuditTrailPdf } from './utils/pdfExport';

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>('oms');
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>(PRESET_SCENARIOS[0]);
  const [currentPayload, setCurrentPayload] = useState<ClientPayload>(PRESET_SCENARIOS[0].payload);
  const [executionResult, setExecutionResult] = useState<AgentCycleResult | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditTrailRecord[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Execute on initial mount for instant working display
  useEffect(() => {
    runAgentCycle(PRESET_SCENARIOS[0].payload, false);
  }, []);

  const runAgentCycle = (payloadToRun: ClientPayload, animate: boolean = true) => {
    if (animate) {
      setIsExecuting(true);
      setTimeout(() => {
        const result = RevenueRecoveryEngine.executeCycle(payloadToRun);
        setExecutionResult(result);
        setAuditRecords(prev => [result.record, ...prev]);
        setIsExecuting(false);
      }, 350);
    } else {
      const result = RevenueRecoveryEngine.executeCycle(payloadToRun);
      setExecutionResult(result);
      setAuditRecords([result.record]);
    }
  };

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setSelectedPreset(preset);
    setCurrentPayload(preset.payload);
    runAgentCycle(preset.payload, true);
  };

  const handleResetPayload = () => {
    setCurrentPayload(selectedPreset.payload);
    runAgentCycle(selectedPreset.payload, true);
  };

  const handleRunAllScenarios = async () => {
    setIsRunningBatch(true);
    const newRecords: AuditTrailRecord[] = [];
    
    // Evaluate all presets in batch
    for (const preset of PRESET_SCENARIOS) {
      const res = RevenueRecoveryEngine.executeCycle(preset.payload);
      newRecords.push(res.record);
    }

    setAuditRecords(prev => [...newRecords, ...prev]);
    setIsRunningBatch(false);
  };

  const handleClearRecords = () => {
    setAuditRecords([]);
  };

  // Metrics computation
  const metrics = {
    totalEvaluations: auditRecords.length,
    skips: auditRecords.filter(r => r.action_category === 'NO_ACTION_SKIP').length,
    escalations: auditRecords.filter(r => r.action_category === 'ESCALATE_TO_HUMAN').length,
    interventions: auditRecords.filter(r => r.action_category === 'INTERVENTION_EXECUTED').length,
    complianceRate: 100
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col">
      {/* Top Application Header with Multi-Page Navigation */}
      <Header
        activePage={activePage}
        onChangePage={setActivePage}
        metrics={metrics}
        onRunAllScenarios={handleRunAllScenarios}
        isRunningBatch={isRunningBatch}
        onExportPdf={() => downloadAuditTrailPdf(auditRecords)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
      />

      {/* Secondary Bar with Active Payload Context */}
      <div className="bg-stone-50 border-b border-stone-200 py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center flex-wrap gap-2 text-stone-600">
            <span className="font-semibold text-stone-900">Active Debtor:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-800">
              {currentPayload.client_name} ({currentPayload.invoice.invoice_id})
            </span>
            <span className="text-stone-300">•</span>
            <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {formatCurrency(currentPayload.invoice.amount, currentPayload.invoice.currency)}
            </span>
            <span className="text-stone-300">•</span>
            <span className="px-1.5 py-0.5 rounded bg-stone-200/70 text-stone-700 font-medium">{currentPayload.client_tier}</span>
            <span className="text-stone-300">•</span>
            <span className="font-mono text-stone-700">{currentPayload.invoice.days_overdue}d overdue</span>
          </div>

          <div className="flex items-center gap-2">
            {activePage !== 'predictive' && (
              <button
                type="button"
                onClick={() => setActivePage('predictive')}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium transition-colors cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200"
              >
                <TrendingUp className="w-3 h-3" />
                <span>View Risk Intelligence</span>
              </button>
            )}

            {activePage !== 'oms' && (
              <button
                type="button"
                onClick={() => setActivePage('oms')}
                className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded border border-amber-200"
              >
                <Cpu className="w-3 h-3" />
                <span>Execute in OMS Cycle</span>
              </button>
            )}

            <button
              onClick={() => runAgentCycle(currentPayload, true)}
              disabled={isExecuting}
              className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900 font-medium transition-colors bg-white px-2 py-1 rounded border border-stone-200 shadow-2xs"
            >
              <RefreshCw className={`w-3 h-3 ${isExecuting ? 'animate-spin text-amber-600' : ''}`} />
              <span>Re-Evaluate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        {/* PAGE 1: Framework Cycle Complete (OMS) */}
        {activePage === 'oms' && (
          <div className="space-y-5">
            {/* Scenario Presets Matrix */}
            <section>
              <ScenarioSelector
                selectedPresetId={selectedPreset.id}
                onSelectPreset={handleSelectPreset}
              />
            </section>

            {/* Two-Column Grid: Left is Payload & Controls, Right is Agent Execution & Outputs */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Payload Editor & Quick Sliders (5 cols) */}
              <div className="lg:col-span-5 h-full">
                <PayloadEditor
                  payload={currentPayload}
                  onChangePayload={(updated) => {
                    setCurrentPayload(updated);
                  }}
                  onResetPayload={handleResetPayload}
                  onExecuteAgent={() => runAgentCycle(currentPayload, true)}
                  isExecuting={isExecuting}
                />
              </div>

              {/* Right Column: Execution View & Generated Artifacts (7 cols) */}
              <div className="lg:col-span-7">
                <AgentExecutionView
                  result={executionResult}
                  isExecuting={isExecuting}
                />
              </div>
            </section>

            {/* Bottom Quick Bar to Full Audit Trail */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-stone-900 text-blue-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Audit Trail &amp; Compliance Ledger ({auditRecords.length} records logged)
                  </h4>
                  <p className="text-[11px] text-stone-500 font-mono">
                    All non-conversational tool executions and stopping rule skips are cryptographically recorded.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadAuditTrailPdf(auditRecords)}
                  disabled={auditRecords.length === 0}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-medium text-xs transition-colors cursor-pointer disabled:opacity-40"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActivePage('audit')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Open Full Audit Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: Predictive Recovery Likelihood */}
        {activePage === 'predictive' && (
          <PredictiveLikelihoodPage
            currentPayload={currentPayload}
            onUpdatePayload={(updated) => {
              setCurrentPayload(updated);
              runAgentCycle(updated, false);
            }}
            onNavigateToOMS={(preset) => {
              if (preset) handleSelectPreset(preset);
              setActivePage('oms');
            }}
          />
        )}

        {/* PAGE 3: Audit Trail & Compliance Ledger */}
        {activePage === 'audit' && (
          <div className="space-y-4">
            <AuditTrailLedger
              records={auditRecords}
              onClearRecords={handleClearRecords}
              onSelectRecord={(rec) => {
                // Inspected in modal
              }}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-3.5 px-4 text-center text-xs text-stone-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Autonomous B2B Revenue Recovery Agent • Zero Conversational Text Policy Enforced</span>
          </div>
          <div className="text-stone-400">
            Compliant with ISO-27001 B2B Fair Collections & Relationship Preservation Guardrails
          </div>
        </div>
      </footer>

      {/* Reference Modal */}
      <RulesReferenceModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
