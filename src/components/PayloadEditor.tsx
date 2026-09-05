import React, { useState, useEffect } from 'react';
import { ClientPayload, ClientTier, ClientSentiment, PaymentHistoryRating } from '../types/recovery';
import { 
  Code2, 
  Sliders, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertCircle,
  MessageSquare,
  Mail,
  Building2,
  Send,
  ExternalLink,
  ShieldCheck,
  IndianRupee
} from 'lucide-react';
import { formatCurrency, SUPPORTED_CURRENCIES, formatIndianDenomination } from '../utils/currency';
import { PredictiveRiskIndicator } from './PredictiveRiskIndicator';
import { ContactDispatchCenter } from './ContactDispatchCenter';

interface PayloadEditorProps {
  payload: ClientPayload;
  onChangePayload: (payload: ClientPayload) => void;
  onResetPayload: () => void;
  onExecuteAgent: () => void;
  isExecuting: boolean;
}

export const PayloadEditor: React.FC<PayloadEditorProps> = ({
  payload,
  onChangePayload,
  onResetPayload,
  onExecuteAgent,
  isExecuting
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'json'>('quick');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setJsonText(JSON.stringify(payload, null, 2));
    setJsonError(null);
  }, [payload]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      onChangePayload(parsed);
      setJsonError(null);
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quick modifier helpers
  const updateDaysOverdue = (val: number) => {
    const updated = {
      ...payload,
      invoice: {
        ...payload.invoice,
        days_overdue: val
      }
    };
    onChangePayload(updated);
  };

  const updateDaysSinceContact = (val: number) => {
    const updated = {
      ...payload,
      history: {
        ...payload.history,
        days_since_last_contact: val
      }
    };
    onChangePayload(updated);
  };

  const setWhatsApp1630Preset = () => {
    onChangePayload({
      ...payload,
      invoice: {
        ...payload.invoice,
        days_overdue: 22
      },
      history: {
        ...payload.history,
        days_since_last_contact: Math.max(payload.history.days_since_last_contact, 5)
      },
      interaction_state: {
        ...payload.interaction_state,
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false
      }
    });
  };

  const setWhatsAppSuspensionPreset = () => {
    onChangePayload({
      ...payload,
      client_tier: 'Low-Tier',
      invoice: {
        ...payload.invoice,
        days_overdue: 42
      },
      history: {
        ...payload.history,
        days_since_last_contact: Math.max(payload.history.days_since_last_contact, 5)
      },
      interaction_state: {
        ...payload.interaction_state,
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false
      }
    });
  };

  const updateTier = (tier: ClientTier) => {
    onChangePayload({
      ...payload,
      client_tier: tier
    });
  };

  const updateSentiment = (sentiment: ClientSentiment) => {
    onChangePayload({
      ...payload,
      interaction_state: {
        ...payload.interaction_state,
        sentiment
      }
    });
  };

  const updateHistoryRating = (rating: PaymentHistoryRating) => {
    onChangePayload({
      ...payload,
      history: {
        ...payload.history,
        payment_history_rating: rating
      }
    });
  };

  const toggleDispute = () => {
    const cur = payload.interaction_state.dispute_status;
    onChangePayload({
      ...payload,
      interaction_state: {
        ...payload.interaction_state,
        dispute_status: !cur,
        dispute_details: !cur ? 'Client officially contested billing calculation.' : undefined
      }
    });
  };

  const toggleServiceIssue = () => {
    const cur = payload.interaction_state.service_issue_reported;
    onChangePayload({
      ...payload,
      interaction_state: {
        ...payload.interaction_state,
        service_issue_reported: !cur,
        service_issue_details: !cur ? 'Critical ticket open: Service SLA breach.' : undefined
      }
    });
  };

  const togglePromiseToPay = () => {
    const cur = payload.interaction_state.active_promise_to_pay?.active;
    if (cur) {
      onChangePayload({
        ...payload,
        interaction_state: {
          ...payload.interaction_state,
          active_promise_to_pay: null
        }
      });
    } else {
      onChangePayload({
        ...payload,
        interaction_state: {
          ...payload.interaction_state,
          active_promise_to_pay: {
            active: true,
            promised_date: '2026-09-15',
            promised_amount: payload.invoice.amount,
            notes: 'Client registered promise to pay for mid-month batch.'
          }
        }
      });
    }
  };

  const toggleFailedContacts = () => {
    const cur = payload.history.previous_contacts_failed;
    onChangePayload({
      ...payload,
      history: {
        ...payload.history,
        previous_contacts_failed: !cur,
        previous_contact_count: !cur ? Math.max(4, payload.history.previous_contact_count) : 1
      }
    });
  };

  const updateContactPhone = (val: string) => {
    onChangePayload({
      ...payload,
      contact_phone: val
    });
  };

  const updateContactEmail = (val: string) => {
    onChangePayload({
      ...payload,
      contact_email: val
    });
  };

  const updateClientName = (val: string) => {
    onChangePayload({
      ...payload,
      client_name: val
    });
  };

  const updateInvoiceAmount = (amt: number) => {
    const validAmt = isNaN(amt) ? 0 : Math.max(0, amt);
    onChangePayload({
      ...payload,
      invoice: {
        ...payload.invoice,
        amount: validAmt
      }
    });
  };

  const updateInvoiceCurrency = (curr: string) => {
    onChangePayload({
      ...payload,
      invoice: {
        ...payload.invoice,
        currency: curr
      }
    });
  };

  const applyCountryCode = (prefix: string) => {
    const raw = payload.contact_phone || '';
    const digitsOnly = raw.replace(/^\+\d+[\s-]*/, '').replace(/[^0-9]/g, '');
    if (digitsOnly) {
      updateContactPhone(`${prefix} ${digitsOnly}`);
    } else {
      updateContactPhone(`${prefix} `);
    }
  };

  // Validation checks
  const cleanPhoneDigits = (payload.contact_phone || '').replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhoneDigits.length >= 7;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((payload.contact_email || '').trim());

  // Determine current active outbound channel based on engine matrix & stopping rules
  const isRule1 = payload.history.days_since_last_contact < 3;
  const isRule2 = !!payload.interaction_state.active_promise_to_pay?.active;
  const isRule3 = payload.interaction_state.dispute_status || 
                  payload.interaction_state.sentiment === 'angry' || 
                  payload.interaction_state.service_issue_reported;
  const isRule4 = payload.invoice.days_overdue > 90 && payload.history.previous_contacts_failed;

  let activeChannelLabel = 'Email Dispatch (Gentle Reminder)';
  let activeChannelType: 'whatsapp' | 'email' | 'suppressed' | 'escalation' = 'email';

  if (isRule1) {
    activeChannelLabel = 'Suppressed (Rule 1 Cooldown)';
    activeChannelType = 'suppressed';
  } else if (isRule2) {
    activeChannelLabel = 'Frozen (Rule 2 Promise to Pay)';
    activeChannelType = 'suppressed';
  } else if (isRule3) {
    activeChannelLabel = 'Escalated (Rule 3 Account Mgr Ticket)';
    activeChannelType = 'escalation';
  } else if (isRule4) {
    activeChannelLabel = 'Escalated (Rule 4 Legal Demand)';
    activeChannelType = 'escalation';
  } else if (payload.invoice.days_overdue >= 16 && payload.invoice.days_overdue <= 30) {
    activeChannelLabel = 'WhatsApp (Firm Notice + Link)';
    activeChannelType = 'whatsapp';
  } else if (payload.invoice.days_overdue >= 31 && payload.invoice.days_overdue <= 60) {
    if (payload.client_tier === 'Low-Tier') {
      activeChannelLabel = 'WhatsApp (Service Cutoff Notice)';
      activeChannelType = 'whatsapp';
    } else {
      activeChannelLabel = 'Email (Installment Plan Offer)';
      activeChannelType = 'email';
    }
  } else if (payload.invoice.days_overdue > 60) {
    activeChannelLabel = 'Escalated (Pre-Legal Executive Arrears)';
    activeChannelType = 'escalation';
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-stone-200/80 p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('quick')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'quick' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Interactive Controls</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'json' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw JSON Payload</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onResetPayload}
            title="Reset to scenario defaults"
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            title="Copy JSON to clipboard"
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'quick' ? (
          <div className="space-y-4">
            {/* Dedicated Receiver Contact Endpoints Section */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-stone-900 text-white flex items-center justify-center">
                    <Send className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>Receiver Contact Details</span>
                      <span className="text-[10px] font-normal text-stone-500 font-mono">
                        (Dispatch Targets)
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Configure receiver's WhatsApp number and email address for automated recovery outreach.
                    </p>
                  </div>
                </div>

                {/* Live Outbound Channel Route Badge */}
                <div className="flex items-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                    activeChannelType === 'whatsapp'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-emerald-400/20'
                      : activeChannelType === 'email'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : activeChannelType === 'suppressed'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}>
                    {activeChannelType === 'whatsapp' && <MessageSquare className="w-3 h-3 text-emerald-700" />}
                    {activeChannelType === 'email' && <Mail className="w-3 h-3 text-blue-700" />}
                    {activeChannelType === 'suppressed' && <ShieldCheck className="w-3 h-3 text-amber-700" />}
                    {activeChannelType === 'escalation' && <AlertCircle className="w-3 h-3 text-rose-700" />}
                    <span className="truncate max-w-[220px]">{activeChannelLabel}</span>
                  </span>
                </div>
              </div>

              {/* Recipient inputs grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Receiver WhatsApp Number */}
                <div className={`p-3 rounded-lg border bg-white transition-all ${
                  activeChannelType === 'whatsapp' ? 'border-emerald-400 ring-1 ring-emerald-400/20 shadow-xs' : 'border-stone-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="receiver-whatsapp-input" className="text-xs font-semibold text-stone-800 flex items-center gap-1.5 cursor-pointer">
                      <span className="w-4 h-4 rounded bg-[#25D366] text-white flex items-center justify-center">
                        <MessageSquare className="w-2.5 h-2.5" />
                      </span>
                      <span>Receiver WhatsApp Number</span>
                    </label>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                      isPhoneValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {isPhoneValid ? '✓ E.164 Ready' : 'Enter with Country Code'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="receiver-whatsapp-input"
                      type="tel"
                      value={payload.contact_phone}
                      onChange={(e) => updateContactPhone(e.target.value)}
                      placeholder="+1 (555) 832-1155"
                      className="w-full text-xs font-mono font-medium rounded-md border border-stone-300 bg-stone-50/50 px-2.5 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Country Code Helper Chips & Test Button */}
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-stone-400 font-mono">Prefix:</span>
                      {[
                        { code: '+1', label: '+1 US' },
                        { code: '+44', label: '+44 UK' },
                        { code: '+91', label: '+91 IN' },
                        { code: '+49', label: '+49 DE' },
                        { code: '+65', label: '+65 SG' },
                      ].map(cc => (
                        <button
                          key={cc.code}
                          type="button"
                          onClick={() => applyCountryCode(cc.code)}
                          className="px-1.5 py-0.5 rounded bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 border border-stone-200 hover:border-emerald-300 transition-colors font-mono cursor-pointer"
                          title={`Prefix with ${cc.code}`}
                        >
                          {cc.label}
                        </button>
                      ))}
                    </div>

                    {isPhoneValid && (
                      <a
                        href={`https://wa.me/${cleanPhoneDigits}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#00a884] hover:text-[#06cf9c] font-semibold transition-colors"
                        title="Open direct WhatsApp chat with this recipient"
                      >
                        <span>Test wa.me</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Receiver Email Address */}
                <div className={`p-3 rounded-lg border bg-white transition-all ${
                  activeChannelType === 'email' ? 'border-blue-400 ring-1 ring-blue-400/20 shadow-xs' : 'border-stone-200'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="receiver-email-input" className="text-xs font-semibold text-stone-800 flex items-center gap-1.5 cursor-pointer">
                      <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center">
                        <Mail className="w-2.5 h-2.5" />
                      </span>
                      <span>Receiver Email Address</span>
                    </label>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                      isEmailValid ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-stone-100 text-stone-500'
                    }`}>
                      {isEmailValid ? '✓ Valid Format' : 'Enter Valid Email'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="receiver-email-input"
                      type="email"
                      value={payload.contact_email}
                      onChange={(e) => updateContactEmail(e.target.value)}
                      placeholder="finance@acmecorp.com"
                      className="w-full text-xs font-mono font-medium rounded-md border border-stone-300 bg-stone-50/50 px-2.5 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Mail test link */}
                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400">Target for 1–15d &amp; 31–60d High-Tier</span>
                    {isEmailValid && (
                      <a
                        href={`mailto:${payload.contact_email}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                        title="Send test email draft via default mail client"
                      >
                        <span>Quick mailto</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* LIVE AGENT SITUATION DISPATCH: ACTUALLY SEND MESSAGES & EMAILS */}
              <div className="pt-1">
                <ContactDispatchCenter
                  payload={payload}
                  onChangePayload={onChangePayload}
                  onRunAgentCycle={onExecuteAgent}
                />
              </div>

              {/* Recipient Corporate Entity / Name & Invoice Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="sm:col-span-1">
                  <label htmlFor="receiver-client-name-input" className="block text-[11px] font-semibold text-stone-700 mb-1 flex items-center gap-1 cursor-pointer">
                    <Building2 className="w-3 h-3 text-stone-500" />
                    <span>Receiver Entity / Client Name</span>
                  </label>
                  <input
                    id="receiver-client-name-input"
                    type="text"
                    value={payload.client_name}
                    onChange={(e) => updateClientName(e.target.value)}
                    placeholder="e.g. Apex Robotics Corp"
                    className="w-full text-xs rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-stone-900 font-medium"
                  />
                </div>

                {/* Invoice Details & Currency Control */}
                <div className="sm:col-span-2 p-3 rounded-lg bg-white border border-stone-200 text-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Invoice Financials & Currency</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                      <span>Ref: <strong className="text-stone-800">{payload.invoice.invoice_id}</strong></span>
                      <span>•</span>
                      <span>Due: {payload.invoice.due_date}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    {/* Currency Selector */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Currency
                      </label>
                      <select
                        id="invoice-currency-select"
                        value={payload.invoice.currency}
                        onChange={(e) => updateInvoiceCurrency(e.target.value)}
                        className="w-full text-xs rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-stone-800 font-medium focus:outline-none focus:border-stone-900 focus:bg-white"
                      >
                        {SUPPORTED_CURRENCIES.map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div className="sm:col-span-8">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-stone-600">
                          Amount Due
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-700">
                          {formatCurrency(payload.invoice.amount, payload.invoice.currency)}
                          {payload.invoice.currency === 'INR' && (
                            <span className="text-stone-400 font-normal ml-1">
                              ({formatIndianDenomination(payload.invoice.amount)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 font-semibold font-mono text-xs">
                          {payload.invoice.currency === 'INR' ? '₹' : payload.invoice.currency}
                        </span>
                        <input
                          id="invoice-amount-input"
                          type="number"
                          min="0"
                          step="1000"
                          value={payload.invoice.amount}
                          onChange={(e) => updateInvoiceAmount(parseFloat(e.target.value))}
                          placeholder="e.g. 285000"
                          className="w-full text-xs font-mono rounded-md border border-stone-200 bg-white pl-8 pr-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-stone-900 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset INR Amounts */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold tracking-wider mr-0.5">Quick INR:</span>
                    {[25000, 75000, 150000, 300000, 500000, 1000000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          updateInvoiceCurrency('INR');
                          updateInvoiceAmount(amt);
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          payload.invoice.amount === amt && payload.invoice.currency === 'INR'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {formatIndianDenomination(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Real-Time Predictive Risk Score & Likelihood Indicator */}
            <PredictiveRiskIndicator payload={payload} />

            {/* Core Numeric Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Days Overdue */}
              <div className="p-3 rounded-lg border border-stone-200 bg-white">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">Days Overdue</label>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                    payload.invoice.days_overdue >= 16 && payload.invoice.days_overdue <= 30
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : payload.invoice.days_overdue >= 31 && payload.invoice.days_overdue <= 60 && payload.client_tier === 'Low-Tier'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-stone-100 text-stone-800'
                  }`}>
                    {payload.invoice.days_overdue} days
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={payload.invoice.days_overdue}
                  onChange={(e) => updateDaysOverdue(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
                <div className="flex justify-between text-[10px] text-stone-600 mt-1 font-mono">
                  <span>1-15d (Gentle)</span>
                  <span className="font-semibold text-emerald-700">16-30d (WhatsApp)</span>
                  <span className={payload.client_tier === 'Low-Tier' ? 'font-semibold text-rose-700' : ''}>31-60d (Tier)</span>
                  <span>&gt;90d (Default)</span>
                </div>

                {/* Quick WhatsApp Preset Buttons */}
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between gap-1 text-[10px]">
                  <span className="text-stone-400 font-mono">WhatsApp:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={setWhatsApp1630Preset}
                      className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium transition-colors"
                      title="Set to 22 days (16-30d WhatsApp Reminder)"
                    >
                      22d WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={setWhatsAppSuspensionPreset}
                      className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-medium transition-colors"
                      title="Set to 42 days + Low-Tier (WhatsApp Suspension Warning)"
                    >
                      42d Low-Tier Suspension
                    </button>
                  </div>
                </div>
              </div>

              {/* Days Since Last Contact */}
              <div className="p-3 rounded-lg border border-stone-200 bg-white">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">Days Since Last Contact</label>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                    payload.history.days_since_last_contact < 3 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-stone-100 text-stone-800'
                  }`}>
                    {payload.history.days_since_last_contact} {payload.history.days_since_last_contact === 1 ? 'day' : 'days'}
                    {payload.history.days_since_last_contact < 3 ? ' (Rule 1 Halt)' : ''}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={payload.history.days_since_last_contact}
                  onChange={(e) => updateDaysSinceContact(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
                <div className="flex justify-between text-[10px] text-stone-600 mt-1 font-mono">
                  <span className="text-amber-700 font-semibold">0-2d: Rule 1 Skip</span>
                  <span>3+ days: Safe</span>
                </div>
              </div>
            </div>

            {/* Client Tier & Payment History */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Client Tier</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['High-Tier', 'Mid-Tier', 'Low-Tier'] as ClientTier[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateTier(t)}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        payload.client_tier === t
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">Payment History Rating</label>
                <select
                  value={payload.history.payment_history_rating}
                  onChange={(e) => updateHistoryRating(e.target.value as PaymentHistoryRating)}
                  className="w-full text-xs rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-stone-800 focus:outline-none focus:border-stone-900"
                >
                  <option value="spotless">Spotless (Courteous Tone)</option>
                  <option value="occasional_late">Occasional Late (Professional Tone)</option>
                  <option value="chronic_late">Chronic Late (Strict / Urgent Tone)</option>
                  <option value="new_client">New Client (Educational Tone)</option>
                </select>
              </div>
            </div>

            {/* Guardrail Condition Toggles */}
            <div className="border-t border-stone-100 pt-3">
              <label className="block text-xs font-semibold text-stone-700 mb-2">
                Stopping Rule & Escalation Guardrail Toggles
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Promise to pay toggle */}
                <button
                  type="button"
                  onClick={togglePromiseToPay}
                  className={`p-2 rounded-lg border text-left flex items-start justify-between transition-colors ${
                    payload.interaction_state.active_promise_to_pay?.active
                      ? 'border-amber-400 bg-amber-50/70 text-amber-900'
                      : 'border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${payload.interaction_state.active_promise_to_pay?.active ? 'bg-amber-500' : 'bg-stone-300'}`} />
                      Rule 2: Promise to Pay
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {payload.interaction_state.active_promise_to_pay?.active 
                        ? `Active until ${payload.interaction_state.active_promise_to_pay.promised_date}` 
                        : 'No promise registered'}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white border border-stone-200">
                    {payload.interaction_state.active_promise_to_pay?.active ? 'ENABLED' : 'OFF'}
                  </span>
                </button>

                {/* Dispute status toggle */}
                <button
                  type="button"
                  onClick={toggleDispute}
                  className={`p-2 rounded-lg border text-left flex items-start justify-between transition-colors ${
                    payload.interaction_state.dispute_status
                      ? 'border-rose-400 bg-rose-50/70 text-rose-900'
                      : 'border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${payload.interaction_state.dispute_status ? 'bg-rose-500' : 'bg-stone-300'}`} />
                      Rule 3: Active Dispute
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {payload.interaction_state.dispute_status ? 'Contested line item' : 'No active dispute'}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white border border-stone-200">
                    {payload.interaction_state.dispute_status ? 'DISPUTED' : 'CLEAR'}
                  </span>
                </button>

                {/* Angry Sentiment toggle */}
                <div className="p-2 rounded-lg border border-stone-200 bg-stone-50/50">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-semibold text-stone-700">Rule 3: Sentiment</div>
                    <span className="text-[10px] font-mono text-stone-500">Triggers if Angry</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['positive', 'neutral', 'frustrated', 'angry'] as ClientSentiment[]).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => updateSentiment(s)}
                        className={`text-[10px] py-1 rounded capitalize border transition-colors ${
                          payload.interaction_state.sentiment === s
                            ? s === 'angry'
                              ? 'bg-rose-600 text-white border-rose-600 font-bold'
                              : 'bg-stone-800 text-white border-stone-800'
                            : 'bg-white text-stone-600 border-stone-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Issue & Hard Default Failed Contacts */}
                <button
                  type="button"
                  onClick={toggleServiceIssue}
                  className={`p-2 rounded-lg border text-left flex items-start justify-between transition-colors ${
                    payload.interaction_state.service_issue_reported
                      ? 'border-rose-400 bg-rose-50/70 text-rose-900'
                      : 'border-stone-200 bg-stone-50/50 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${payload.interaction_state.service_issue_reported ? 'bg-rose-500' : 'bg-stone-300'}`} />
                      Rule 3: Service Outage / Issue
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {payload.interaction_state.service_issue_reported ? 'Open SLA / latency ticket' : 'No service issue'}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white border border-stone-200">
                    {payload.interaction_state.service_issue_reported ? 'FLAGGED' : 'CLEAR'}
                  </span>
                </button>
              </div>
            </div>

            {/* Hard default contacts failed toggle */}
            <div className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-stone-800">Rule 4 Condition: Prior Contacts Failed</span>
                <p className="text-[11px] text-stone-500">If days overdue &gt; 90 and contacts failed, escalates to Legal Review.</p>
              </div>
              <button
                type="button"
                onClick={toggleFailedContacts}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  payload.history.previous_contacts_failed
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-white text-stone-700 border-stone-200'
                }`}
              >
                {payload.history.previous_contacts_failed ? 'CONTACTS FAILED (YES)' : 'RESPONSIVE (NO)'}
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="text-xs text-stone-500 mb-2 font-mono flex items-center justify-between">
              <span>Edit raw invoice and interaction state payload:</span>
              {jsonError && (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {jsonError}
                </span>
              )}
            </div>
            <textarea
              value={jsonText}
              onChange={handleJsonChange}
              rows={16}
              className="w-full font-mono text-xs bg-stone-950 text-amber-300 p-3 rounded-lg border border-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none font-mono leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Action Execution Footer */}
      <div className="p-3 border-t border-stone-200 bg-stone-50/80 flex items-center justify-between">
        <div className="text-xs text-stone-500 font-mono">
          <span>Payload valid</span> • <span className="text-stone-700">{payload.client_tier} Client</span>
        </div>
        <button
          id="execute-cycle-btn"
          onClick={onExecuteAgent}
          disabled={isExecuting || !!jsonError}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-pulse' : ''}`} />
          {isExecuting ? 'Agent Evaluating...' : 'Execute Recovery Agent Cycle'}
        </button>
      </div>
    </div>
  );
};
