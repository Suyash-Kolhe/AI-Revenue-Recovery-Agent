import React from 'react';
import { ShieldCheck, Cpu, AlertTriangle, ArrowRightLeft, FileCheck, FileText, TrendingUp, Layers, BookOpen } from 'lucide-react';

export type AppPage = 'oms' | 'predictive' | 'audit';

interface HeaderProps {
  activePage: AppPage;
  onChangePage: (page: AppPage) => void;
  metrics: {
    totalEvaluations: number;
    skips: number;
    escalations: number;
    interventions: number;
    complianceRate: number;
  };
  onRunAllScenarios: () => void;
  isRunningBatch: boolean;
  onExportPdf?: () => void;
  onOpenRulesModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activePage,
  onChangePage,
  metrics, 
  onRunAllScenarios, 
  isRunningBatch,
  onExportPdf,
  onOpenRulesModal
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Framework Tag */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-stone-900 text-amber-400 flex items-center justify-center font-mono font-bold text-lg shadow-sm border border-stone-800 shrink-0">
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-stone-900">
                  Autonomous B2B Revenue Recovery Agent
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Active Guardrails
                </span>
              </div>
              <p className="text-xs text-stone-500 font-mono flex items-center gap-2">
                <span>FRAMEWORK: GATHER → EVALUATE → ACT → RECORD</span>
                <span className="text-stone-300">•</span>
                <span className="text-stone-600 font-sans">Strictly Non-Conversational Tool Execution</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <FileCheck className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-stone-500">Evaluations:</span>
              <span className="font-semibold text-stone-900">{metrics.totalEvaluations}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-stone-500">Interventions:</span>
              <span className="font-semibold text-stone-900">{metrics.interventions}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-stone-500">Skips:</span>
              <span className="font-semibold text-stone-900">{metrics.skips}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-stone-100 border border-stone-200 text-stone-700">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-stone-500">Escalations:</span>
              <span className="font-semibold text-rose-700">{metrics.escalations}</span>
            </div>

            {onExportPdf && metrics.totalEvaluations > 0 && (
              <button
                id="header-export-audit-pdf-btn"
                onClick={onExportPdf}
                title="Export session audit ledger to compliance PDF document"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-700 hover:bg-rose-800 text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
              >
                <FileText className="w-3 h-3" />
                <span>Export PDF</span>
              </button>
            )}

            <button
              id="batch-evaluation-btn"
              onClick={onRunAllScenarios}
              disabled={isRunningBatch}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ArrowRightLeft className={`w-3 h-3 ${isRunningBatch ? 'animate-spin' : ''}`} />
              {isRunningBatch ? 'Evaluating...' : 'Run All Scenarios'}
            </button>
          </div>

        </div>

        {/* Multi-Page Navigation Tabs */}
        <div className="mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between gap-2">
          <nav className="flex items-center gap-1 text-xs" aria-label="Application Pages">
            <button
              id="nav-tab-oms"
              type="button"
              onClick={() => onChangePage('oms')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activePage === 'oms'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Framework Cycle Complete (OMS)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activePage === 'oms' ? 'bg-stone-800 text-amber-300' : 'bg-stone-200/80 text-stone-600'
              }`}>
                Live Cycle
              </span>
            </button>

            <button
              id="nav-tab-predictive"
              type="button"
              onClick={() => onChangePage('predictive')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activePage === 'predictive'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Predictive Recovery Likelihood</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activePage === 'predictive' ? 'bg-stone-800 text-emerald-300' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                Actuarial Risk
              </span>
            </button>

            <button
              id="nav-tab-audit"
              type="button"
              onClick={() => onChangePage('audit')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activePage === 'audit'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <FileCheck className="w-4 h-4 text-blue-400" />
              <span>Audit Trail &amp; Compliance Ledger</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activePage === 'audit' ? 'bg-stone-800 text-blue-300' : 'bg-stone-200/80 text-stone-600'
              }`}>
                {metrics.totalEvaluations} records
              </span>
            </button>
          </nav>

          {onOpenRulesModal && (
            <button
              type="button"
              onClick={onOpenRulesModal}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors cursor-pointer px-2 py-1 rounded hover:bg-stone-100"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Rules &amp; SOP Spec</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

