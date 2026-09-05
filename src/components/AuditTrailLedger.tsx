import React, { useState } from 'react';
import { AuditTrailRecord, ActionCategory } from '../types/recovery';
import { 
  FileSpreadsheet, 
  Search, 
  Download, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  Loader2
} from 'lucide-react';
import { downloadAuditTrailPdf, downloadSingleRecordPdf } from '../utils/pdfExport';

interface AuditTrailLedgerProps {
  records: AuditTrailRecord[];
  onClearRecords: () => void;
  onSelectRecord: (record: AuditTrailRecord) => void;
}

export const AuditTrailLedger: React.FC<AuditTrailLedgerProps> = ({
  records,
  onClearRecords,
  onSelectRecord
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AuditTrailRecord | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const filteredRecords = records.filter(record => {
    if (filterCategory !== 'ALL' && record.action_category !== filterCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        record.invoice_id.toLowerCase().includes(q) ||
        record.client_name.toLowerCase().includes(q) ||
        record.client_id.toLowerCase().includes(q) ||
        record.tool_call.tool_name.toLowerCase().includes(q) ||
        record.applied_rule_or_matrix.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `b2b_recovery_audit_ledger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON audit records exported successfully');
  };

  const handleExportPdf = () => {
    if (records.length === 0) return;
    setIsExportingPdf(true);
    try {
      downloadAuditTrailPdf(records);
      showToast(`Compliance PDF Audit Trail generated successfully (${records.length} records)`);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      showToast('Error generating PDF audit report');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportSingleRecordPdf = (record: AuditTrailRecord) => {
    try {
      downloadSingleRecordPdf(record);
      showToast(`Decision Certificate PDF downloaded for ${record.invoice_id}`);
    } catch (err) {
      console.error('Failed to export record PDF:', err);
      showToast('Error generating decision certificate');
    }
  };

  const showToast = (msg: string) => {
    setExportFeedback(msg);
    setTimeout(() => {
      setExportFeedback(prev => (prev === msg ? null : prev));
    }, 4500);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-stone-50/80">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-stone-700" />
            <span>Audit Trail & Compliance Ledger (Framework Step 4: RECORD)</span>
          </h3>
          <p className="text-xs text-stone-500 font-mono">
            {records.length} logged decision events • 100% immutable audit chain
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export PDF Compliance Report */}
          <button
            id="export-audit-pdf-btn"
            onClick={handleExportPdf}
            disabled={records.length === 0 || isExportingPdf}
            title="Generate and download formatted PDF audit document for compliance reporting"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-40 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Export Audit Trail (PDF)</span>
          </button>

          {/* Export JSON */}
          <button
            id="export-audit-json-btn"
            onClick={exportJson}
            disabled={records.length === 0}
            title="Download raw JSON ledger"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          {/* Clear Ledger */}
          <button
            id="clear-audit-ledger-btn"
            onClick={onClearRecords}
            disabled={records.length === 0}
            title="Clear Ledger"
            className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Export Feedback Toast Banner */}
      {exportFeedback && (
        <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportFeedback}</span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 border-b border-stone-100 flex flex-col sm:flex-row gap-2 bg-stone-50/30">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search by invoice ID, client name, rule, or tool..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-stone-200 bg-white text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-900"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-stone-400" />
          <div className="flex rounded-md bg-stone-100 p-0.5 text-xs font-medium">
            {(['ALL', 'INTERVENTION_EXECUTED', 'NO_ACTION_SKIP', 'ESCALATE_TO_HUMAN'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-1 rounded transition-colors text-[11px] ${
                  filterCategory === cat
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat === 'INTERVENTION_EXECUTED' ? 'Interventions' : cat === 'NO_ACTION_SKIP' ? 'Skips' : 'Escalations'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-mono">
            <tr>
              <th className="py-2.5 px-3">Timestamp / ID</th>
              <th className="py-2.5 px-3">Client & Tier</th>
              <th className="py-2.5 px-3">Invoice</th>
              <th className="py-2.5 px-3">Action Category</th>
              <th className="py-2.5 px-3">Tool Dispatched</th>
              <th className="py-2.5 px-3">Applied Rule / Rationale</th>
              <th className="py-2.5 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-stone-400 text-xs">
                  No audit trail records found matching criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((rec) => (
                <tr 
                  key={rec.id}
                  className="hover:bg-stone-50/80 transition-colors cursor-pointer group"
                  onClick={() => setSelectedRecordForDetail(rec)}
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                    <div>{rec.timestamp.split('T')[1].slice(0, 8)} UTC</div>
                    <div className="text-[10px] text-stone-400">{rec.id.slice(0, 14)}...</div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-medium text-stone-900">{rec.client_name}</div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {rec.client_tier} • {rec.client_id}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-mono text-stone-900 font-medium">{rec.invoice_id}</div>
                    <div className="text-[10px] text-stone-500 flex items-center gap-1">
                      <span>{rec.days_overdue}d overdue</span>
                      {rec.amount_due && (
                        <>
                          <span>•</span>
                          <span className="font-mono font-semibold text-emerald-800">{rec.amount_due}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      rec.action_category === 'NO_ACTION_SKIP'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : rec.action_category === 'ESCALATE_TO_HUMAN'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {rec.action_category === 'NO_ACTION_SKIP' ? (
                        <Clock className="w-3 h-3" />
                      ) : rec.action_category === 'ESCALATE_TO_HUMAN' ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {rec.action_category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-stone-800 whitespace-nowrap">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                      {rec.tool_call.tool_name}()
                    </span>
                  </td>
                  <td className="py-2.5 px-3 max-w-xs truncate text-stone-600 text-[11px]" title={rec.decision_rationale}>
                    <div className="font-medium text-stone-800 truncate">{rec.applied_rule_or_matrix}</div>
                    <div className="text-stone-500 truncate text-[10px]">{rec.decision_rationale}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecordForDetail(rec);
                      }}
                      className="p-1 rounded text-stone-400 hover:text-stone-900 hover:bg-stone-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Detail Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div>
                <h4 className="text-sm font-bold text-stone-900">
                  Audit Log Record: {selectedRecordForDetail.id}
                </h4>
                <p className="text-xs text-stone-500 font-mono">
                  Timestamp: {selectedRecordForDetail.timestamp}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-500">Client:</span>
                  <p className="font-semibold text-stone-900">{selectedRecordForDetail.client_name} ({selectedRecordForDetail.client_tier})</p>
                </div>
                <div>
                  <span className="text-stone-500">Invoice:</span>
                  <p className="font-semibold text-stone-900">
                    {selectedRecordForDetail.invoice_id} ({selectedRecordForDetail.days_overdue}d overdue)
                    {selectedRecordForDetail.amount_due && (
                      <span className="ml-1.5 font-mono text-emerald-800 font-bold">
                        • {selectedRecordForDetail.amount_due}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-stone-500">Category:</span>
                  <p className="font-mono font-bold text-stone-900">{selectedRecordForDetail.action_category}</p>
                </div>
                <div>
                  <span className="text-stone-500">Tool Executed:</span>
                  <p className="font-mono font-bold text-stone-900">{selectedRecordForDetail.tool_call.tool_name}()</p>
                </div>
                {selectedRecordForDetail.contact_phone && (
                  <div>
                    <span className="text-stone-500">Receiver WhatsApp:</span>
                    <p className="font-mono font-semibold text-emerald-800">{selectedRecordForDetail.contact_phone}</p>
                  </div>
                )}
                {selectedRecordForDetail.contact_email && (
                  <div>
                    <span className="text-stone-500">Receiver Email:</span>
                    <p className="font-mono text-stone-800">{selectedRecordForDetail.contact_email}</p>
                  </div>
                )}
                {selectedRecordForDetail.predictive_risk && (
                  <div className="col-span-2 p-2.5 rounded bg-white border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-medium">Predictive Recovery Likelihood</span>
                      <span className="font-bold text-stone-900 text-xs">
                        {selectedRecordForDetail.predictive_risk.recovery_likelihood}% Success Probability
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedRecordForDetail.predictive_risk.risk_level === 'LOW'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : selectedRecordForDetail.predictive_risk.risk_level === 'MODERATE'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {selectedRecordForDetail.predictive_risk.risk_level} RISK (Score: {selectedRecordForDetail.predictive_risk.risk_score}/100)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h5 className="font-semibold text-stone-800 mb-1">Decision Rationale:</h5>
                <p className="p-2.5 rounded bg-stone-50 border border-stone-200 text-stone-700 leading-relaxed">
                  {selectedRecordForDetail.decision_rationale}
                </p>
              </div>

              <div>
                <h5 className="font-semibold text-stone-800 mb-1">Exact Tool Parameters:</h5>
                <pre className="p-3 bg-stone-950 text-amber-300 rounded font-mono text-[11px] overflow-x-auto">
{JSON.stringify(selectedRecordForDetail.tool_call.parameters, null, 2)}
                </pre>
              </div>

              <div>
                <h5 className="font-semibold text-stone-800 mb-1">Stopping Rules Evaluation:</h5>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {Object.entries(selectedRecordForDetail.stopping_rules).map(([key, val]) => {
                    const ruleVal = val as { triggered: boolean; detail: string };
                    return (
                      <div key={key} className={`p-2 rounded border flex items-center justify-between ${
                        ruleVal.triggered ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}>
                        <span>{key.toUpperCase()}:</span>
                        <span>{ruleVal.triggered ? 'TRIGGERED (HALT)' : 'PASSED'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
              <button
                id="export-single-record-pdf-btn"
                onClick={() => handleExportSingleRecordPdf(selectedRecordForDetail)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                title="Download certified legal decision summary PDF for this event"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>Export Decision Certificate (PDF)</span>
              </button>

              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-1.5 rounded-md bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
