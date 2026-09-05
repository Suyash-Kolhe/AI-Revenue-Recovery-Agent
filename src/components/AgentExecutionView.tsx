import React, { useState, useEffect } from 'react';
import { AgentCycleResult } from '../types/recovery';
import { WhatsAppArtifactViewer } from './WhatsAppArtifactViewer';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  Mail, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  ExternalLink,
  Lock,
  Layers,
  FileSpreadsheet,
  Send,
  Copy,
  Check,
  Edit3,
  Eye,
  RotateCcw,
  Plus
} from 'lucide-react';

interface AgentExecutionViewProps {
  result: AgentCycleResult | null;
  isExecuting: boolean;
}

export const AgentExecutionView: React.FC<AgentExecutionViewProps> = ({
  result,
  isExecuting
}) => {
  const [activeArtifactTab, setActiveArtifactTab] = useState<'preview' | 'tool_call' | 'raw_audit'>('preview');
  const [copyEmailFeedback, setCopyEmailFeedback] = useState(false);
  const [isEditingExecutionEmail, setIsEditingExecutionEmail] = useState(false);
  const [editedEmailSubject, setEditedEmailSubject] = useState<string | null>(null);
  const [editedEmailBody, setEditedEmailBody] = useState<string | null>(null);
  const [editedEmailRecipient, setEditedEmailRecipient] = useState<string | null>(null);
  const [editedEmailCc, setEditedEmailCc] = useState<string>('');

  // Reset custom edits when a new cycle is executed
  useEffect(() => {
    setIsEditingExecutionEmail(false);
    setEditedEmailSubject(null);
    setEditedEmailBody(null);
    setEditedEmailRecipient(null);
    setEditedEmailCc('');
  }, [result]);

  if (isExecuting) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-xs flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-4" />
        <h3 className="text-sm font-semibold text-stone-900">Executing B2B Recovery Framework</h3>
        <p className="text-xs text-stone-500 mt-1 font-mono">
          Step 1: GATHER → Step 2: EVALUATE → Step 3: ACT → Step 4: RECORD
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-xs flex flex-col items-center justify-center min-h-[420px] text-center">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
          <Terminal className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-stone-800">Autonomous Agent Ready</h3>
        <p className="text-xs text-stone-500 max-w-sm mt-1">
          Select a test scenario or customize the client payload on the left, then click &quot;Execute Recovery Agent Cycle&quot;.
        </p>
      </div>
    );
  }

  const { gather, evaluate, act, record, execution_time_ms } = result;

  return (
    <div className="space-y-4">
      {/* Framework Pipeline Stepper */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono">
              Framework Cycle Complete ({execution_time_ms}ms)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-medium ${
              record.action_category === 'NO_ACTION_SKIP'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : record.action_category === 'ESCALATE_TO_HUMAN'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {record.action_category}
            </span>
            <span className="text-[11px] font-mono text-stone-400">ID: {record.id}</span>
          </div>
        </div>

        {/* 4-Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* STEP 1: GATHER */}
          <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">1</span>
                GATHER
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-medium">VERIFIED</span>
            </div>
            <div className="space-y-1 text-xs text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-500">Amount Due:</span>
                <span className="font-semibold font-mono text-emerald-800">{gather.amount_due}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Invoice Age:</span>
                <span className="font-semibold text-stone-900">{gather.days_overdue} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Client Tier:</span>
                <span className="font-semibold text-stone-900">{gather.client_tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Last Contact:</span>
                <span className="font-mono text-stone-900">{gather.days_since_last_contact}d ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">History Rating:</span>
                <span className="capitalize font-medium text-stone-900">{gather.history_rating}</span>
              </div>
              <div className="pt-1.5 mt-1 border-t border-stone-200/80 space-y-0.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    WA:
                  </span>
                  <span className="font-mono text-emerald-800 font-semibold truncate max-w-[120px]" title={gather.contact_phone}>
                    {gather.contact_phone || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                    Email:
                  </span>
                  <span className="font-mono text-stone-700 truncate max-w-[120px]" title={gather.contact_email}>
                    {gather.contact_email || 'Not provided'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: EVALUATE */}
          <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">2</span>
                EVALUATE
              </span>
              {evaluate.stopping_rule_triggered ? (
                <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">HALTED</span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-600 font-medium">PASSED</span>
              )}
            </div>
            <div className="space-y-1 text-xs">
              <div className="text-[11px] text-stone-500 truncate">
                Stopping Rule:
              </div>
              <div className="font-medium text-stone-900 truncate">
                {evaluate.triggering_rule || 'None (Matrix Active)'}
              </div>
              <div className="text-[11px] text-stone-500 truncate mt-1">
                Tone Applied:
              </div>
              <div className="text-[11px] text-stone-700 font-medium line-clamp-1">
                {evaluate.calculated_tone.split('(')[0]}
              </div>
              {evaluate.predictive_risk && (
                <div className="pt-1.5 mt-1 border-t border-stone-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Recovery Likelihood:</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                    evaluate.predictive_risk.risk_level === 'LOW'
                      ? 'bg-emerald-100 text-emerald-800'
                      : evaluate.predictive_risk.risk_level === 'MODERATE'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {evaluate.predictive_risk.recovery_likelihood}% ({evaluate.predictive_risk.risk_level})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: ACT */}
          <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">3</span>
                ACT
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-medium">EXECUTED</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="text-[11px] text-stone-500">Tool Dispatched:</div>
              <div className="font-mono text-xs font-bold text-stone-900 bg-stone-200/70 px-1.5 py-0.5 rounded truncate">
                {act.tool_name}()
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Channel Target:</div>
              <div className="text-[11px] font-medium text-stone-800">
                {act.rendered_content?.channel || 'Internal Service'}
              </div>
            </div>
          </div>

          {/* STEP 4: RECORD */}
          <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/50">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px]">4</span>
                RECORD
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-medium">LOGGED</span>
            </div>
            <div className="space-y-1 text-xs text-stone-600">
              <div className="flex justify-between">
                <span className="text-stone-500">Guardrails:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> 100% OK
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Audit Status:</span>
                <span className="font-mono text-stone-900">IMMUTABLE</span>
              </div>
              <div className="text-[10px] text-stone-400 font-mono truncate mt-1">
                {record.timestamp.split('T')[1].slice(0, 8)} UTC
              </div>
            </div>
          </div>

        </div>

        {/* Evaluation Decision Rationale Banner */}
        <div className="mt-3 p-3 rounded-lg bg-stone-100/80 border border-stone-200 text-xs">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              {record.action_category === 'NO_ACTION_SKIP' ? (
                <Clock className="w-4 h-4 text-amber-600" />
              ) : record.action_category === 'ESCALATE_TO_HUMAN' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div>
              <span className="font-semibold text-stone-900">Agent Rationale & Applied Rule: </span>
              <span className="text-stone-700">{record.decision_rationale}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stopping Rules Deep Inspection Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700 font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            Compliance Guardrails & Stopping Rules Audit
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">Evaluated in Strict Priority Order</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {/* Rule 1 */}
          <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
            evaluate.stopping_rules.rule_1_frequency.triggered
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-stone-50/50 border-stone-200 text-stone-700'
          }`}>
            <div className="mt-0.5">
              {evaluate.stopping_rules.rule_1_frequency.triggered ? (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-medium">
                <span>RULE 1: Frequency Limit (&lt; 3 days)</span>
                <span className="font-mono text-[10px]">
                  {evaluate.stopping_rules.rule_1_frequency.triggered ? 'TRIGGERED (HALT)' : 'PASSED'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                {evaluate.stopping_rules.rule_1_frequency.detail}
              </p>
            </div>
          </div>

          {/* Rule 2 */}
          <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
            evaluate.stopping_rules.rule_2_promise_to_pay.triggered
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-stone-50/50 border-stone-200 text-stone-700'
          }`}>
            <div className="mt-0.5">
              {evaluate.stopping_rules.rule_2_promise_to_pay.triggered ? (
                <Clock className="w-4 h-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-medium">
                <span>RULE 2: Active Promise to Pay</span>
                <span className="font-mono text-[10px]">
                  {evaluate.stopping_rules.rule_2_promise_to_pay.triggered ? 'TRIGGERED (HALT)' : 'PASSED'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                {evaluate.stopping_rules.rule_2_promise_to_pay.detail}
              </p>
            </div>
          </div>

          {/* Rule 3 */}
          <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
            evaluate.stopping_rules.rule_3_escalation.triggered
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-stone-50/50 border-stone-200 text-stone-700'
          }`}>
            <div className="mt-0.5">
              {evaluate.stopping_rules.rule_3_escalation.triggered ? (
                <XCircle className="w-4 h-4 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-medium">
                <span>RULE 3: Dispute / Angry / Service Issue</span>
                <span className="font-mono text-[10px]">
                  {evaluate.stopping_rules.rule_3_escalation.triggered ? 'TRIGGERED (ESCALATE)' : 'PASSED'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                {evaluate.stopping_rules.rule_3_escalation.detail}
              </p>
            </div>
          </div>

          {/* Rule 4 */}
          <div className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
            evaluate.stopping_rules.rule_4_hard_default.triggered
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-stone-50/50 border-stone-200 text-stone-700'
          }`}>
            <div className="mt-0.5">
              {evaluate.stopping_rules.rule_4_hard_default.triggered ? (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between font-medium">
                <span>RULE 4: Hard Default (&gt;90d + Failed Contacts)</span>
                <span className="font-mono text-[10px]">
                  {evaluate.stopping_rules.rule_4_hard_default.triggered ? 'TRIGGERED (LEGAL)' : 'PASSED'}
                </span>
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-snug">
                {evaluate.stopping_rules.rule_4_hard_default.detail}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Output Tabs: Channel Preview vs Strict Tool Call JSON */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-900">Output Artifact & Dispatch</span>
            <span className="text-[11px] text-stone-400 font-mono">Channel: {act.rendered_content?.channel}</span>
          </div>

          <div className="flex rounded-md bg-stone-200/80 p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveArtifactTab('preview')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeArtifactTab === 'preview' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Channel Render
            </button>
            <button
              onClick={() => setActiveArtifactTab('tool_call')}
              className={`px-2.5 py-1 rounded transition-colors font-mono text-[11px] flex items-center gap-1 ${
                activeArtifactTab === 'tool_call' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Terminal className="w-3 h-3" />
              Strict Tool Call
            </button>
            <button
              onClick={() => setActiveArtifactTab('raw_audit')}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] flex items-center gap-1 ${
                activeArtifactTab === 'raw_audit' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileSpreadsheet className="w-3 h-3" />
              Audit Log Record
            </button>
          </div>
        </div>

        <div className="p-4">
          {activeArtifactTab === 'preview' && (
            <div>
              {/* Email channel */}
              {act.rendered_content?.channel === 'Email' && (() => {
                const activeRecipient = editedEmailRecipient ?? act.rendered_content?.recipient ?? '';
                const activeSubject = editedEmailSubject ?? act.rendered_content?.subject ?? '';
                const activeBody = editedEmailBody ?? act.rendered_content?.body ?? '';
                const hasCustomized = editedEmailSubject !== null || editedEmailBody !== null || editedEmailRecipient !== null;
                const portalLink = act.parameters?.payment_link || act.parameters?.portal_link || '#';

                let mailtoUrl = `mailto:${encodeURIComponent(activeRecipient)}?subject=${encodeURIComponent(activeSubject)}&body=${encodeURIComponent(activeBody)}`;
                if (editedEmailCc.trim()) {
                  mailtoUrl += `&cc=${encodeURIComponent(editedEmailCc.trim())}`;
                }

                return (
                  <div className="border border-stone-200 rounded-lg overflow-hidden bg-white shadow-xs">
                    {/* Top subheader with Edit toggle & Reset */}
                    <div className="bg-stone-50 px-3.5 py-2 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span>Generated Email Artifact</span>
                        </span>
                        {hasCustomized && (
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                            Custom Edited
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsEditingExecutionEmail(!isEditingExecutionEmail)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                            isEditingExecutionEmail 
                              ? 'bg-blue-600 text-white shadow-2xs font-semibold' 
                              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {isEditingExecutionEmail ? <Eye className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                          <span>{isEditingExecutionEmail ? 'View Rendered Preview' : 'Edit Email Draft'}</span>
                        </button>

                        {hasCustomized && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditedEmailSubject(null);
                              setEditedEmailBody(null);
                              setEditedEmailRecipient(null);
                              setEditedEmailCc('');
                              setIsEditingExecutionEmail(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-stone-500 hover:text-stone-800 hover:bg-stone-200 transition-colors cursor-pointer"
                            title="Reset back to agent generated email"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset to Original</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Email Headers: From, To, CC, Subject */}
                    <div className="bg-stone-100/90 px-4 py-3 border-b border-stone-200 text-xs space-y-2 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 w-16 shrink-0 font-mono">From:</span>
                        <span className="text-stone-800 font-medium flex-1">Accounts Receivable &lt;ar@financecore.io&gt;</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 w-16 shrink-0 font-mono">To:</span>
                        {isEditingExecutionEmail ? (
                          <input
                            type="email"
                            value={activeRecipient}
                            onChange={(e) => setEditedEmailRecipient(e.target.value)}
                            placeholder="recipient@company.com"
                            className="flex-1 text-xs font-mono font-medium rounded border border-stone-300 px-2.5 py-1 bg-white text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        ) : (
                          <span className="text-stone-900 font-medium flex-1">{activeRecipient}</span>
                        )}
                      </div>

                      {isEditingExecutionEmail && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500 w-16 shrink-0 font-mono">CC:</span>
                          <input
                            type="text"
                            value={editedEmailCc}
                            onChange={(e) => setEditedEmailCc(e.target.value)}
                            placeholder="finance-escalations@financecore.io"
                            className="flex-1 text-xs font-mono rounded border border-stone-300 px-2.5 py-1 bg-white text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-stone-500 w-16 shrink-0 font-mono">Subject:</span>
                        {isEditingExecutionEmail ? (
                          <input
                            type="text"
                            value={activeSubject}
                            onChange={(e) => setEditedEmailSubject(e.target.value)}
                            placeholder="Subject line..."
                            className="flex-1 text-xs font-semibold rounded border border-stone-300 px-2.5 py-1 bg-white text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                          />
                        ) : (
                          <span className="text-stone-900 font-semibold flex-1">{activeSubject}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick variables insertion bar when editing */}
                    {isEditingExecutionEmail && (
                      <div className="bg-stone-50/70 px-4 py-1.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-1.5 text-stone-500 font-mono">
                          <span>Quick Insert:</span>
                          {act.parameters?.payment_link && (
                            <button
                              type="button"
                              onClick={() => setEditedEmailBody(prev => (prev ?? act.rendered_content?.body ?? '') + `\n👉 Direct payment link: ${act.parameters.payment_link}`)}
                              className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-blue-700 cursor-pointer"
                            >
                              + Payment Link
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditedEmailBody(prev => (prev ?? act.rendered_content?.body ?? '') + '\n\nPlease treat this notice as high priority.')}
                            className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer"
                          >
                            + High Priority Note
                          </button>
                        </div>
                        <span className="text-stone-400 font-mono">
                          {activeBody.split(/\s+/).filter(Boolean).length} words • {activeBody.length} chars
                        </span>
                      </div>
                    )}

                    {/* Body: Editor or Rendered */}
                    <div className="p-4 font-sans text-xs text-stone-800 leading-relaxed">
                      {isEditingExecutionEmail ? (
                        <textarea
                          value={activeBody}
                          onChange={(e) => setEditedEmailBody(e.target.value)}
                          rows={10}
                          className="w-full text-xs font-mono bg-white border border-stone-300 rounded-lg p-3 text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs leading-relaxed"
                          placeholder="Customize email body content..."
                        />
                      ) : (
                        <div className="whitespace-pre-wrap">
                          {activeBody}
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <a
                          href={mailtoUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 shadow-xs transition-colors"
                          title="Open your email client with this draft preloaded"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send via Email Client Now</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`To: ${activeRecipient}${editedEmailCc.trim() ? `\nCC: ${editedEmailCc.trim()}` : ''}\nSubject: ${activeSubject}\n\n${activeBody}`);
                            setCopyEmailFeedback(true);
                            setTimeout(() => setCopyEmailFeedback(false), 2500);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium transition-colors cursor-pointer"
                          title="Copy email subject and body to clipboard"
                        >
                          {copyEmailFeedback ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copyEmailFeedback ? 'Copied' : 'Copy Text'}</span>
                        </button>
                      </div>

                      <a
                        href={portalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-900 text-white font-medium text-xs hover:bg-stone-800"
                      >
                        <span>Direct Payment Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* WhatsApp channel */}
              {act.rendered_content?.channel === 'WhatsApp' && (
                <WhatsAppArtifactViewer toolCall={act} />
              )}

              {/* Escalation Ticket */}
              {act.rendered_content?.channel === 'Escalation Ticket' && (
                <div className="border border-rose-200 rounded-lg bg-white overflow-hidden">
                  <div className="bg-rose-50 px-4 py-3 border-b border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono text-[10px] font-bold">
                        {act.parameters.priority || 'HIGH'} PRIORITY
                      </span>
                      <h4 className="text-xs font-semibold text-rose-950">
                        {act.rendered_content.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-rose-700 font-medium">
                      Queue: {act.parameters.assigned_queue}
                    </span>
                  </div>

                  <div className="p-4 text-xs text-stone-800 space-y-3">
                    <div className="p-3 bg-stone-50 rounded-md border border-stone-200 whitespace-pre-wrap leading-relaxed font-mono text-[11px]">
                      {act.rendered_content.body}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded bg-stone-50 border border-stone-200">
                        <span className="text-stone-500 font-medium">Recommended Action:</span>
                        <p className="text-stone-900 mt-1 font-medium">{act.parameters.recommended_action}</p>
                      </div>
                      <div className="p-2.5 rounded bg-stone-50 border border-stone-200">
                        <span className="text-stone-500 font-medium">Escalation Trigger:</span>
                        <p className="text-stone-900 mt-1 font-mono text-[11px]">
                          {Array.isArray(act.parameters.escalation_triggers)
                            ? act.parameters.escalation_triggers.join(', ')
                            : act.parameters.rule_triggered}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compliance System (Skip notice) */}
              {act.rendered_content?.channel === 'Compliance System' && (
                <div className="border border-amber-200 rounded-lg bg-amber-50/50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-950">
                        {act.rendered_content.title}
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        {act.rendered_content.body}
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-white border border-amber-200 text-xs font-mono text-amber-900">
                        <span>Rule:</span>
                        <strong>{act.parameters.rule_triggered}</strong>
                        <span>•</span>
                        <span>Outbound Dispatches Blocked: 100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeArtifactTab === 'tool_call' && (
            <div>
              <div className="text-xs text-stone-500 mb-2 font-mono flex items-center justify-between">
                <span>Deterministic tool execution signature:</span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Zero Conversational Text Enforced
                </span>
              </div>
              <pre className="p-3.5 rounded-lg bg-stone-950 text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed border border-stone-800">
{JSON.stringify(
  {
    tool: act.tool_name,
    parameters: act.parameters
  },
  null,
  2
)}
              </pre>
            </div>
          )}

          {activeArtifactTab === 'raw_audit' && (
            <div>
              <div className="text-xs text-stone-500 mb-2 font-mono">
                Immutable Ledger Entry (Rule Step 4: RECORD):
              </div>
              <pre className="p-3.5 rounded-lg bg-stone-900 text-stone-200 font-mono text-xs overflow-x-auto leading-relaxed">
{JSON.stringify(record, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
