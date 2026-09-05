import React from 'react';
import { BookOpen, ShieldCheck, Zap, AlertTriangle, CheckCircle, Split } from 'lucide-react';

interface RulesReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesReferenceModal: React.FC<RulesReferenceModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-stone-900 text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Operating Framework & Compliance Guardrails Specification
              </h3>
              <p className="text-xs text-stone-500 font-mono">
                Autonomous B2B Revenue Recovery Standard Operating Procedure (SOP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 text-lg font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700 leading-relaxed">
          {/* Section 1: 4-Step Framework */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              1. Operating Framework
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/70">
                <span className="font-bold text-stone-900 block mb-1">1. GATHER</span>
                <p className="text-stone-600">
                  Review the invoice age (<code className="font-mono text-stone-800">days_overdue</code>), client tier (<code className="font-mono text-stone-800">High-Tier</code> / <code className="font-mono text-stone-800">Low-Tier</code>), and <code className="font-mono text-stone-800">last_contact_date</code>.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/70">
                <span className="font-bold text-stone-900 block mb-1">2. EVALUATE</span>
                <p className="text-stone-600">
                  Determine if a stopping rule applies. If not, determine the most effective communication tone based on the client&apos;s payment history.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/70">
                <span className="font-bold text-stone-900 block mb-1">3. ACT</span>
                <p className="text-stone-600">
                  Execute the correct intervention tool without conversational chatter. Strictly deterministic tool calls.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-stone-200 bg-stone-50/70">
                <span className="font-bold text-stone-900 block mb-1">4. RECORD</span>
                <p className="text-stone-600">
                  Always log an immutable audit trail entry before concluding turn, detailing rationale and rule checks.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Strict Stopping Rules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              2. Strict Stopping Rules (Non-Negotiable)
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60">
                <div className="font-bold text-amber-950 flex items-center justify-between mb-1">
                  <span>RULE 1: Frequency Limit</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    NO ACTION (SKIP)
                  </span>
                </div>
                <p className="text-amber-900 text-xs">
                  If <code className="font-mono font-semibold">days_since_last_contact &lt; 3</code>, take <strong>NO ACTION</strong>. Output an audit log explaining the skip to prevent over-contacting.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60">
                <div className="font-bold text-amber-950 flex items-center justify-between mb-1">
                  <span>RULE 2: Promise to Pay</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                    NO ACTION (SKIP)
                  </span>
                </div>
                <p className="text-amber-900 text-xs">
                  If the client&apos;s status contains an active &quot;Promise to Pay&quot; date in the future, take <strong>NO ACTION</strong>. Output an audit log explaining the skip.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/60">
                <div className="font-bold text-rose-950 flex items-center justify-between mb-1">
                  <span>RULE 3: Escalation Guardrail</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                    escalate_to_human
                  </span>
                </div>
                <p className="text-rose-900 text-xs">
                  If the client payload indicates an active &quot;dispute&quot;, &quot;angry sentiment&quot;, or &quot;service issue&quot;, immediately trigger <code className="font-mono font-semibold">escalate_to_human</code> and halt automated recovery to protect relationships.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/60">
                <div className="font-bold text-rose-950 flex items-center justify-between mb-1">
                  <span>RULE 4: Hard Default</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                    escalate_to_human (Legal)
                  </span>
                </div>
                <p className="text-rose-900 text-xs">
                  If the invoice is over 90 days past due <strong>AND</strong> previous contacts failed, trigger <code className="font-mono font-semibold">escalate_to_human</code> for legal and risk review.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Intervention Matrix */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-mono mb-2.5 flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-blue-600" />
              3. Intervention Matrix
            </h4>
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 font-mono text-stone-700 border-b border-stone-200">
                  <tr>
                    <th className="py-2 px-3">Overdue Bracket</th>
                    <th className="py-2 px-3">Client Segment</th>
                    <th className="py-2 px-3">Target Tool & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">1 - 15 days</td>
                    <td className="py-2.5 px-3 text-stone-600">All Tiers</td>
                    <td className="py-2.5 px-3 font-mono text-blue-700">send_gentle_email (Gentle email reminder)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">16 - 30 days</td>
                    <td className="py-2.5 px-3 text-stone-600">All Tiers</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700">send_firm_whatsapp (Firm WhatsApp with direct payment link)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">31 - 60 days</td>
                    <td className="py-2.5 px-3 font-semibold text-amber-800">High-Tier Client</td>
                    <td className="py-2.5 px-3 font-mono text-blue-700">propose_installment_plan_email (Installment plan via email)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">31 - 60 days</td>
                    <td className="py-2.5 px-3 font-semibold text-stone-800">Low-Tier Client</td>
                    <td className="py-2.5 px-3 font-mono text-rose-700">send_suspension_warning_whatsapp (Warning of service suspension)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
