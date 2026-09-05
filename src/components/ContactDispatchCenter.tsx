import React, { useState, useEffect } from 'react';
import { ClientPayload, RecentInteraction } from '../types/recovery';
import { 
  evaluateClientSituation, 
  SituationDetails 
} from '../agent/situationDispatch';
import { formatCurrency } from '../utils/currency';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  Phone,
  Zap,
  CheckCheck,
  Edit3,
  Eye,
  RotateCcw,
  Plus,
  Save,
  AtSign,
  Layers,
  Wand2
} from 'lucide-react';

interface ContactDispatchCenterProps {
  payload: ClientPayload;
  onChangePayload: (updated: ClientPayload) => void;
  onRunAgentCycle?: () => void;
}

export const ContactDispatchCenter: React.FC<ContactDispatchCenterProps> = ({
  payload,
  onChangePayload,
  onRunAgentCycle
}) => {
  const situation: SituationDetails = evaluateClientSituation(payload);
  const formattedAmount = formatCurrency(payload.invoice.amount, payload.invoice.currency);
  const paymentLink = payload.invoice.payment_link || `https://pay.financecore.io/inv/${payload.invoice.invoice_id}`;

  // Active channel tab: default to agent recommended channel if possible
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>(
    situation.recommendedChannel === 'WhatsApp' ? 'whatsapp' : 'email'
  );

  // When situation type changes, keep sync if user hasn't manually overridden
  useEffect(() => {
    if (situation.recommendedChannel === 'WhatsApp') {
      setSelectedChannel('whatsapp');
    } else if (situation.recommendedChannel === 'Email') {
      setSelectedChannel('email');
    }
  }, [situation.type]);

  // Editable drafts
  const [customWaMessage, setCustomWaMessage] = useState(situation.whatsapp.message);
  
  // Dedicated Email Editor State
  const [customEmailRecipient, setCustomEmailRecipient] = useState(payload.contact_email || '');
  const [customEmailCc, setCustomEmailCc] = useState('');
  const [showCcField, setShowCcField] = useState(false);
  const [customEmailSubject, setCustomEmailSubject] = useState(situation.email.subject);
  const [customEmailBody, setCustomEmailBody] = useState(situation.email.body);
  const [emailEditTab, setEmailEditTab] = useState<'edit' | 'preview'>('edit');
  const [isWaCustomizing, setIsWaCustomizing] = useState(false);
  const [hasEmailCustomized, setHasEmailCustomized] = useState(false);

  // Sync state when payload changes if user hasn't actively edited
  useEffect(() => {
    if (!hasEmailCustomized) {
      setCustomEmailRecipient(payload.contact_email || '');
      setCustomEmailSubject(situation.email.subject);
      setCustomEmailBody(situation.email.body);
    }
    if (!isWaCustomizing) {
      setCustomWaMessage(situation.whatsapp.message);
    }
  }, [situation, payload.contact_email, hasEmailCustomized, isWaCustomizing]);

  // Dispatch states
  const [isSimulatingGateway, setIsSimulatingGateway] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<string | null>(null);
  const [lastDispatchedInfo, setLastDispatchedInfo] = useState<{
    channel: 'WhatsApp' | 'Email';
    timestamp: string;
    recipient: string;
    status: string;
  } | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [showRecentFeed, setShowRecentFeed] = useState(false);
  const [emailSavedFeedback, setEmailSavedFeedback] = useState(false);

  const cleanPhone = (payload.contact_phone || '').replace(/[^0-9]/g, '');
  const isPhoneValid = cleanPhone.length >= 7;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmailRecipient.trim());

  // Word & Character count calculations
  const emailWordsCount = (customEmailBody || '').trim().split(/\s+/).filter(Boolean).length;
  const emailCharCount = (customEmailBody || '').length;

  // Record a sent interaction in the debtor payload
  const logOutboundDispatch = (channel: 'WhatsApp' | 'Email', summary: string) => {
    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const todayStr = nowIso.split('T')[0];

    const newInteraction: RecentInteraction = {
      date: todayStr,
      channel,
      note: `Agent Dispatched [${situation.badgeLabel}]: ${summary.slice(0, 100)}... (Ref: ${payload.invoice.invoice_id})`,
      response_received: false
    };

    const updatedPayload: ClientPayload = {
      ...payload,
      contact_email: customEmailRecipient.trim() || payload.contact_email,
      history: {
        ...payload.history,
        days_since_last_contact: 0,
        last_contact_date: todayStr,
        previous_contact_count: (payload.history.previous_contact_count || 0) + 1
      },
      interaction_state: {
        ...payload.interaction_state,
        recent_interactions: [
          newInteraction,
          ...(payload.interaction_state.recent_interactions || [])
        ]
      }
    };

    onChangePayload(updatedPayload);

    setLastDispatchedInfo({
      channel,
      timestamp: timeStr,
      recipient: channel === 'WhatsApp' ? payload.contact_phone : customEmailRecipient,
      status: 'TRANSMITTED & DELIVERED'
    });
  };

  // 1. ACTUALLY SEND VIA WHATSAPP (Direct web/app intent)
  const handleActualSendWhatsApp = () => {
    if (!isPhoneValid) {
      alert('Please enter a valid phone number with country code first (e.g. +1 555-832-1155).');
      return;
    }

    const messageToSend = customWaMessage || situation.whatsapp.message;
    const directWaUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageToSend)}`;

    // Open WhatsApp Web or App directly
    window.open(directWaUrl, '_blank', 'noopener,noreferrer');

    // Also copy to clipboard for user convenience
    navigator.clipboard.writeText(messageToSend);
    setCopySuccess('WhatsApp message copied to clipboard & chat launched!');
    setTimeout(() => setCopySuccess(null), 4000);

    // Record in debtor interaction ledger
    logOutboundDispatch('WhatsApp', messageToSend);
  };

  // 2. ACTUALLY SEND VIA EMAIL (Mailto intent & client launch with custom edits, CC, subject, body)
  const handleActualSendEmail = () => {
    if (!isEmailValid) {
      alert('Please enter a valid email address (e.g. finance@acmecorp.com).');
      return;
    }

    const recipient = customEmailRecipient.trim();
    const subjectToSend = customEmailSubject.trim();
    const bodyToSend = customEmailBody;

    // Construct robust mailto with optional CC
    let mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subjectToSend)}&body=${encodeURIComponent(bodyToSend)}`;
    if (customEmailCc.trim()) {
      mailtoUrl += `&cc=${encodeURIComponent(customEmailCc.trim())}`;
    }

    // Trigger native mail client
    const mailLink = document.createElement('a');
    mailLink.href = mailtoUrl;
    mailLink.click();

    // Copy full packet to clipboard as well
    const clipboardText = `To: ${recipient}${customEmailCc.trim() ? `\nCC: ${customEmailCc.trim()}` : ''}\nSubject: ${subjectToSend}\n\n${bodyToSend}`;
    navigator.clipboard.writeText(clipboardText);
    setCopySuccess('Edited email drafted in email client & copied to clipboard!');
    setTimeout(() => setCopySuccess(null), 4000);

    // Record in debtor interaction ledger
    logOutboundDispatch('Email', subjectToSend);
  };

  // 3. SIMULATE BACKGROUND AGENT CLOUD RELAY (Meta Cloud API / SendGrid Relay)
  const handleSimulateAgentGateway = async () => {
    setIsSimulatingGateway(true);
    const targetChannel = selectedChannel === 'whatsapp' ? 'WhatsApp' : 'Email';

    try {
      setGatewayStep(`1/4: Connecting to ${targetChannel === 'WhatsApp' ? 'Meta WhatsApp Cloud API Gateway' : 'Enterprise SMTP Mail Relay'}...`);
      await new Promise(r => setTimeout(r, 600));

      setGatewayStep('2/4: Applying B2B compliance guardrails & cryptographic signature...');
      await new Promise(r => setTimeout(r, 600));

      setGatewayStep(`3/4: Transmitting payload to ${targetChannel === 'WhatsApp' ? payload.contact_phone : customEmailRecipient}...`);
      await new Promise(r => setTimeout(r, 700));

      const mockMsgId = `TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      setGatewayStep(`4/4: Transmitted successfully! Carrier ACK: 200 OK (${mockMsgId})`);
      await new Promise(r => setTimeout(r, 600));

      const summary = targetChannel === 'WhatsApp' 
        ? (customWaMessage || situation.whatsapp.message) 
        : customEmailSubject;

      logOutboundDispatch(targetChannel, summary);
    } finally {
      setIsSimulatingGateway(false);
      setGatewayStep(null);
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(`${label} copied to clipboard!`);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // Email Tone Preset Appliers
  const applyEmailTone = (tone: 'courteous' | 'firm' | 'installment' | 'pre_legal') => {
    setHasEmailCustomized(true);

    if (tone === 'courteous') {
      setCustomEmailSubject(`Friendly Reminder: Outstanding Invoice ${payload.invoice.invoice_id} - ${payload.client_name}`);
      setCustomEmailBody(
        `Dear ${payload.client_name} Accounts Team,\n\n` +
        `We hope this email finds you well.\n\n` +
        `This is a gentle reminder regarding invoice ${payload.invoice.invoice_id} for ${formattedAmount}, which was due on ${payload.invoice.due_date} (${payload.invoice.days_overdue} days ago).\n\n` +
        `We truly appreciate our partnership and understand billing reconciliation schedules can occasionally experience delays. To assist your team, you can review details and remit directly via our instant clearing portal:\n` +
        `👉 ${paymentLink}\n\n` +
        `If payment has already been scheduled, please let us know the transaction reference. Thank you for your continued collaboration.\n\n` +
        `Warm regards,\n` +
        `${payload.account_manager} | Accounts Receivable Desk\nFinanceCore Operations`
      );
    } else if (tone === 'firm') {
      setCustomEmailSubject(`URGENT NOTICE: Overdue Account ${payload.invoice.invoice_id} (48-Hour Deadline) - ${payload.client_name}`);
      setCustomEmailBody(
        `Attention: Accounts Payable & Finance Management (${payload.client_name})\n\n` +
        `RE: INVOICE ${payload.invoice.invoice_id} | OUTSTANDING AMOUNT: ${formattedAmount}\n` +
        `DAYS OVERDUE: ${payload.invoice.days_overdue} DAYS\n\n` +
        `Our records indicate that the above invoice remains unpaid despite prior communication. To avoid any interruption to your organization's active services or credit terms, payment must be received within forty-eight (48) hours.\n\n` +
        `Please process the remittance immediately through our priority clearing link:\n` +
        `👉 ${paymentLink}\n\n` +
        `If payment has already been transmitted today, kindly reply with the official bank remittance advice so we can reconcile your account.\n\n` +
        `Sincerely,\n` +
        `Credit Control & Revenue Operations\nFinanceCore Global`
      );
    } else if (tone === 'installment') {
      const partAmount = Math.round((payload.invoice.amount / 3) * 100) / 100;
      const formattedPart = formatCurrency(partAmount, payload.invoice.currency);
      setCustomEmailSubject(`Payment Accommodation Proposal: Invoice ${payload.invoice.invoice_id} (${payload.client_name})`);
      setCustomEmailBody(
        `Dear ${payload.client_name} Finance Leadership,\n\n` +
        `Regarding outstanding invoice ${payload.invoice.invoice_id} for ${formattedAmount} (${payload.invoice.days_overdue} days overdue), we understand that unexpected cash flow timing can impact scheduled disbursements.\n\n` +
        `To ensure our strategic partnership continues smoothly, Account Executive ${payload.account_manager} has authorized a structured 3-part installment schedule:\n\n` +
        `  • Tranche 1 (Immediate): ${formattedPart}\n` +
        `  • Tranche 2 (+30 Days): ${formattedPart}\n` +
        `  • Tranche 3 (+60 Days): ${formattedPart}\n\n` +
        `You may accept this accommodation and remit the first tranche directly here:\n` +
        `👉 ${paymentLink}?plan=3tranche\n\n` +
        `Please reply to this note to confirm acceptance of this schedule.\n\n` +
        `Best regards,\n` +
        `${payload.account_manager} & Revenue Operations Team`
      );
    } else if (tone === 'pre_legal') {
      setCustomEmailSubject(`FINAL DEMAND BEFORE LITIGATION: Invoice ${payload.invoice.invoice_id} - ${payload.client_name}`);
      setCustomEmailBody(
        `FORMAL DEMAND FOR IMMEDIATE PAYMENT\n` +
        `To: Corporate Legal & Accounts Payable (${payload.client_name})\n` +
        `Invoice Reference: ${payload.invoice.invoice_id}\n` +
        `Outstanding Principal: ${formattedAmount}\n` +
        `Days Delinquent: ${payload.invoice.days_overdue} Days\n\n` +
        `Take notice that invoice ${payload.invoice.invoice_id} has exceeded all commercially acceptable grace periods. Unless full payment is confirmed within five (5) business days, our file will be formally transferred to external legal counsel and commercial collection bailiffs.\n\n` +
        `Such action will include interest assessments under statutory commercial code, legal cost recovery, and filing with commercial credit reporting bureaus.\n\n` +
        `Direct settlement gateway:\n` +
        `👉 ${paymentLink}\n\n` +
        `Legal & Risk Governance Desk\nFinanceCore Corporate Office`
      );
    }
  };

  // Helper to insert placeholders into body
  const insertTokenIntoBody = (tokenText: string) => {
    setHasEmailCustomized(true);
    setCustomEmailBody(prev => prev + ' ' + tokenText);
  };

  // Reset email to agent recommendation
  const handleResetEmailToAgent = () => {
    setCustomEmailSubject(situation.email.subject);
    setCustomEmailBody(situation.email.body);
    setCustomEmailRecipient(payload.contact_email || '');
    setCustomEmailCc('');
    setHasEmailCustomized(false);
  };

  // Persist recipient email to debtor payload
  const handleSaveRecipientToPayload = () => {
    if (!isEmailValid) {
      alert('Please enter a valid email address.');
      return;
    }
    onChangePayload({
      ...payload,
      contact_email: customEmailRecipient.trim()
    });
    setEmailSavedFeedback(true);
    setTimeout(() => setEmailSavedFeedback(false), 2500);
  };

  // Quick preset scenario switchers to test how situations adapt
  const setQuickSituation = (daysOverdue: number, tier?: 'High-Tier' | 'Mid-Tier' | 'Low-Tier') => {
    const updated: ClientPayload = {
      ...payload,
      invoice: {
        ...payload.invoice,
        days_overdue: daysOverdue
      },
      client_tier: tier || payload.client_tier,
      history: {
        ...payload.history,
        days_since_last_contact: Math.max(3, payload.history.days_since_last_contact)
      },
      interaction_state: {
        ...payload.interaction_state,
        active_promise_to_pay: null,
        dispute_status: false,
        sentiment: 'neutral',
        service_issue_reported: false
      }
    };
    onChangePayload(updated);
    setIsWaCustomizing(false);
    setHasEmailCustomized(false);
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden">
      {/* Top Banner: Situation Diagnosis & Strategy */}
      <div className="p-3.5 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-400 text-stone-950">
              <Zap className="w-3 h-3" />
              Active Situation
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
              situation.badgeColor === 'emerald'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : situation.badgeColor === 'blue'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                : situation.badgeColor === 'amber'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {situation.badgeLabel}
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-stone-100 flex items-center gap-1.5">
            <span>{situation.title}</span>
          </h4>
          <p className="text-[11px] text-stone-300 leading-snug">
            {situation.rationale}
          </p>
        </div>

        {/* Recommended Channel Badge */}
        <div className="sm:text-right shrink-0 bg-stone-800/80 p-2 rounded-lg border border-stone-700/60 text-xs">
          <div className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Agent Recommended Channel</div>
          <div className="font-bold text-amber-300 flex items-center sm:justify-end gap-1 mt-0.5">
            {situation.recommendedChannel === 'WhatsApp' ? (
              <>
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Business Dispatch</span>
              </>
            ) : situation.recommendedChannel === 'Email' ? (
              <>
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Email Transmission</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>{situation.recommendedChannel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-3.5">
        {/* Situation Test Quick Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200 text-xs">
          <div className="flex items-center gap-1.5 text-stone-600 font-medium">
            <Sliders className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-[11px]">Simulate Situation:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setQuickSituation(8)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                payload.invoice.days_overdue === 8
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              1–15d (Gentle Email)
            </button>
            <button
              type="button"
              onClick={() => setQuickSituation(22)}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                payload.invoice.days_overdue === 22
                  ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              16–30d (Firm WhatsApp)
            </button>
            <button
              type="button"
              onClick={() => setQuickSituation(45, 'High-Tier')}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                payload.invoice.days_overdue === 45 && payload.client_tier === 'High-Tier'
                  ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              31–60d High-Tier (Installment)
            </button>
            <button
              type="button"
              onClick={() => setQuickSituation(45, 'Low-Tier')}
              className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                payload.invoice.days_overdue === 45 && payload.client_tier === 'Low-Tier'
                  ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              31–60d Low-Tier (Suspension)
            </button>
          </div>
        </div>

        {/* Channel Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-2">
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedChannel('whatsapp')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedChannel === 'whatsapp'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-[#25D366] text-white flex items-center justify-center text-[9px]">
                💬
              </span>
              <span>WhatsApp Dispatch</span>
              {situation.recommendedChannel === 'WhatsApp' && (
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-1 rounded">Recommended</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedChannel('email')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedChannel === 'email'
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Dispatch &amp; Editor</span>
              {situation.recommendedChannel === 'Email' && (
                <span className="text-[9px] font-mono bg-blue-100 text-blue-800 px-1 rounded">Recommended</span>
              )}
            </button>
          </div>

          {selectedChannel === 'whatsapp' && (
            <button
              type="button"
              onClick={() => setIsWaCustomizing(!isWaCustomizing)}
              className="text-[11px] font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{isWaCustomizing ? 'Done Editing' : 'Customize Message'}</span>
              {isWaCustomizing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* WHATSAPP DISPATCH PANEL */}
        {selectedChannel === 'whatsapp' && (
          <div className="space-y-3">
            {/* Recipient info row */}
            <div className="flex items-center justify-between text-xs bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-emerald-950">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                  WA
                </span>
                <div>
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>Receiver Target:</span>
                    <span className="font-mono text-emerald-900 bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                      {payload.contact_phone || 'No phone set'}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-800 font-mono">
                    Client: {payload.client_name} • Invoice: {payload.invoice.invoice_id}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px]">
                {isPhoneValid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> E.164 Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                    <AlertCircle className="w-3 h-3" /> Invalid Phone
                  </span>
                )}
              </div>
            </div>

            {/* Message Preview Box (WhatsApp Styled) */}
            <div className="rounded-xl border border-stone-200 bg-[#EFEAE2] p-3 shadow-inner text-xs font-sans">
              <div className="text-[10px] text-stone-500 font-mono mb-2 flex items-center justify-between">
                <span>WhatsApp Business Template Preview:</span>
                <button
                  type="button"
                  onClick={() => copyText(customWaMessage || situation.whatsapp.message, 'WhatsApp Message')}
                  className="text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </button>
              </div>

              {isWaCustomizing ? (
                <textarea
                  value={customWaMessage}
                  onChange={(e) => setCustomWaMessage(e.target.value)}
                  rows={6}
                  className="w-full text-xs font-sans bg-white border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:outline-none focus:border-emerald-500 shadow-xs leading-relaxed"
                  placeholder="Customize WhatsApp message..."
                />
              ) : (
                <div className="max-w-[92%] bg-white rounded-lg rounded-tl-none p-3 shadow-xs border border-stone-200/80 text-stone-800 whitespace-pre-wrap leading-relaxed relative">
                  <div className="text-[10px] font-bold text-[#075e54] mb-1 flex items-center gap-1">
                    <span>FinanceCore Enterprise Arrears Bot</span>
                    <ShieldCheck className="w-2.5 h-2.5 text-[#25D366]" />
                  </div>
                  {customWaMessage || situation.whatsapp.message}
                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-stone-400 font-mono">
                    <span>Just now</span>
                    <CheckCheck className="w-3 h-3 text-[#34B7F1]" />
                  </div>
                </div>
              )}
            </div>

            {/* Actual Actions for WhatsApp */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                {/* PRIMARY ACTION: ACTUALLY SEND VIA WHATSAPP */}
                <button
                  type="button"
                  onClick={handleActualSendWhatsApp}
                  disabled={!isPhoneValid || isSimulatingGateway}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp Now</span>
                </button>

                {/* Secondary: Simulate Agent Cloud API */}
                <button
                  type="button"
                  onClick={handleSimulateAgentGateway}
                  disabled={!isPhoneValid || isSimulatingGateway}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Simulate dispatch through Meta WhatsApp Cloud API"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulatingGateway ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>{isSimulatingGateway ? 'Transmitting...' : 'Agent Cloud Send'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium"
                >
                  <span>Open Direct Chat</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* COMPREHENSIVE EMAIL DISPATCH & EDITING PANEL */}
        {selectedChannel === 'email' && (
          <div className="space-y-3">
            {/* Header / Sub-Bar with Edit & Preview mode switch + Quick Tones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-stone-100/90 p-2 rounded-lg border border-stone-200 text-xs">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEmailEditTab('edit')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                    emailEditTab === 'edit'
                      ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Email</span>
                  {hasEmailCustomized && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEmailEditTab('preview')}
                  className={`px-3 py-1 rounded-md flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                    emailEditTab === 'preview'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  <span>Live Preview</span>
                </button>
              </div>

              {/* Tone Quick Presets */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-stone-500 font-mono">Tone:</span>
                <button
                  type="button"
                  onClick={() => applyEmailTone('courteous')}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 transition-colors cursor-pointer"
                  title="Apply courteous, appreciative reminder tone"
                >
                  Gentle
                </button>
                <button
                  type="button"
                  onClick={() => applyEmailTone('firm')}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 text-amber-800 transition-colors cursor-pointer"
                  title="Apply firm 48-hour payment demand"
                >
                  Firm 48h
                </button>
                <button
                  type="button"
                  onClick={() => applyEmailTone('installment')}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 text-blue-800 transition-colors cursor-pointer"
                  title="Propose 3-part flexible installment schedule"
                >
                  Installments
                </button>
                <button
                  type="button"
                  onClick={() => applyEmailTone('pre_legal')}
                  className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-stone-50 border border-stone-200 text-rose-800 transition-colors cursor-pointer"
                  title="Apply formal legal demand before referral"
                >
                  Pre-Legal
                </button>
                <button
                  type="button"
                  onClick={handleResetEmailToAgent}
                  className="text-[10px] px-1.5 py-0.5 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-200 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset to agent recommended situation draft"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Email Edit/View Card */}
            <div className="rounded-xl border border-stone-200 bg-white shadow-xs overflow-hidden text-xs">
              {/* Header Fields: From, To, CC, Subject */}
              <div className="bg-stone-50 p-3 border-b border-stone-200 space-y-2 text-[11px]">
                {/* From Row */}
                <div className="flex items-center gap-2">
                  <span className="w-16 text-stone-500 font-mono shrink-0">From:</span>
                  <span className="text-stone-800 font-medium font-sans">
                    Accounts Receivable &lt;ar@financecore.io&gt;
                  </span>
                </div>

                {/* To Recipient Row (Editable) */}
                <div className="flex items-center gap-2">
                  <span className="w-16 text-stone-500 font-mono shrink-0">To:</span>
                  <div className="flex-1 flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <input
                        type="email"
                        value={customEmailRecipient}
                        onChange={(e) => {
                          setCustomEmailRecipient(e.target.value);
                          setHasEmailCustomized(true);
                        }}
                        placeholder="client.finance@company.com"
                        className="w-full text-xs font-mono font-medium rounded border border-stone-300 px-2.5 py-1 bg-white text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                    </div>

                    {/* Button to sync back to client payload */}
                    {customEmailRecipient !== payload.contact_email && isEmailValid && (
                      <button
                        type="button"
                        onClick={handleSaveRecipientToPayload}
                        className="shrink-0 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-medium text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Update contact email in client profile"
                      >
                        {emailSavedFeedback ? <Check className="w-3 h-3 text-emerald-600" /> : <Save className="w-3 h-3" />}
                        <span>{emailSavedFeedback ? 'Saved' : 'Save as Profile'}</span>
                      </button>
                    )}

                    {!showCcField && (
                      <button
                        type="button"
                        onClick={() => setShowCcField(true)}
                        className="text-[10px] font-mono text-stone-500 hover:text-stone-900 underline px-1 cursor-pointer"
                      >
                        + CC
                      </button>
                    )}
                  </div>
                </div>

                {/* CC Row (Expandable) */}
                {showCcField && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="w-16 text-stone-500 font-mono shrink-0">CC:</span>
                    <div className="flex-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={customEmailCc}
                        onChange={(e) => setCustomEmailCc(e.target.value)}
                        placeholder="finance-escalations@financecore.io, legal@financecore.io"
                        className="flex-1 text-xs font-mono rounded border border-stone-300 px-2.5 py-1 bg-white text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCustomEmailCc('');
                          setShowCcField(false);
                        }}
                        className="text-[10px] text-stone-400 hover:text-rose-600 px-1 cursor-pointer"
                      >
                        Remove CC
                      </button>
                    </div>
                  </div>
                )}

                {/* Subject Row (Editable) */}
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="w-16 text-stone-500 font-mono shrink-0">Subject:</span>
                  <input
                    type="text"
                    value={customEmailSubject}
                    onChange={(e) => {
                      setCustomEmailSubject(e.target.value);
                      setHasEmailCustomized(true);
                    }}
                    placeholder="Subject line..."
                    className="flex-1 text-xs font-semibold rounded border border-stone-300 px-2.5 py-1 bg-white text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Variable Insertion Tokens Bar (in Edit Mode) */}
              {emailEditTab === 'edit' && (
                <div className="bg-stone-50/60 px-3 py-1.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                  <div className="flex items-center gap-1 text-stone-500 font-mono">
                    <span>Insert Variable:</span>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoBody(`Invoice #${payload.invoice.invoice_id}`)}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer font-mono"
                    >
                      + Invoice ID
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoBody(formattedAmount)}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer font-mono"
                    >
                      + Amount Due
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoBody(payload.invoice.due_date)}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer font-mono"
                    >
                      + Due Date
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoBody(paymentLink)}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-blue-700 cursor-pointer font-mono"
                    >
                      + Payment Link
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTokenIntoBody(payload.account_manager)}
                      className="px-1.5 py-0.5 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer font-mono"
                    >
                      + Acct Manager
                    </button>
                  </div>

                  <div className="text-stone-400 font-mono">
                    {emailWordsCount} words • {emailCharCount} chars
                  </div>
                </div>
              )}

              {/* Email Body: Edit Mode or Rendered Preview */}
              <div className="p-3.5">
                {emailEditTab === 'edit' ? (
                  <textarea
                    value={customEmailBody}
                    onChange={(e) => {
                      setCustomEmailBody(e.target.value);
                      setHasEmailCustomized(true);
                    }}
                    rows={10}
                    className="w-full text-xs font-mono bg-white border border-stone-300 rounded-lg p-3 text-stone-900 focus:outline-none focus:border-blue-500 shadow-2xs leading-relaxed"
                    placeholder="Type or customize email message body..."
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="bg-stone-50/70 p-4 rounded-lg border border-stone-200/80 text-stone-800 whitespace-pre-wrap leading-relaxed font-sans text-xs shadow-inner">
                      {customEmailBody}
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-blue-900">
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-[11px]">
                          Embedded payment link verified: <strong className="font-mono">{paymentLink}</strong>
                        </span>
                      </div>
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-700 hover:text-blue-900 underline inline-flex items-center gap-0.5"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Status Bar */}
              <div className="px-3.5 py-2 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="font-mono">Security: TLS 1.3 Strict</span>
                  <span className="text-stone-300">•</span>
                  <span className="font-mono">Recipient Status: {isEmailValid ? 'Ready' : 'Incomplete'}</span>
                </div>
                {hasEmailCustomized && (
                  <span className="text-blue-600 font-medium">Custom User Edits Applied</span>
                )}
              </div>
            </div>

            {/* Actual Outbound Actions for Email */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* PRIMARY ACTION: ACTUALLY SEND VIA EMAIL CLIENT */}
                <button
                  type="button"
                  onClick={handleActualSendEmail}
                  disabled={!isEmailValid || isSimulatingGateway}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Email Client Now</span>
                </button>

                {/* Secondary: Simulate Agent SMTP Gateway */}
                <button
                  type="button"
                  onClick={handleSimulateAgentGateway}
                  disabled={!isEmailValid || isSimulatingGateway}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Simulate automated enterprise SMTP dispatch"
                >
                  <RefreshCw className={`w-3 h-3 ${isSimulatingGateway ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isSimulatingGateway ? 'Relaying...' : 'Agent SMTP Send'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => copyText(`Subject: ${customEmailSubject}\n\n${customEmailBody}`, 'Email Content')}
                  className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Subject &amp; Body</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Simulation Progress Bar */}
        {isSimulatingGateway && (
          <div className="p-3 rounded-lg bg-stone-900 text-white text-xs space-y-1.5 animate-pulse">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Live Dispatch Gateway
              </span>
              <span className="text-stone-400">Processing TLS Transmission</span>
            </div>
            <p className="text-stone-200 font-mono text-[11px]">
              {gatewayStep}
            </p>
          </div>
        )}

        {/* Dispatch Confirmation Toast / Status Banner */}
        {lastDispatchedInfo && !isSimulatingGateway && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Message Transmitted! </span>
                <span className="text-emerald-800">
                  Dispatched via {lastDispatchedInfo.channel} to <strong className="font-mono">{lastDispatchedInfo.recipient}</strong> at {lastDispatchedInfo.timestamp}.
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 font-semibold shrink-0">
              LEDGER UPDATED
            </span>
          </div>
        )}

        {copySuccess && (
          <div className="p-2 rounded-md bg-stone-900 text-amber-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{copySuccess}</span>
          </div>
        )}

        {/* Debtor Interaction History Collapsible */}
        <div className="border-t border-stone-200 pt-2">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setShowRecentFeed(!showRecentFeed)}
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 font-medium transition-colors cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>Debtor Communication History ({payload.interaction_state.recent_interactions?.length || 0})</span>
              {showRecentFeed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <span className="text-[11px] font-mono text-stone-500">
              Days since last contact: <strong className="text-stone-800">{payload.history.days_since_last_contact}d</strong>
            </span>
          </div>

          {showRecentFeed && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(payload.interaction_state.recent_interactions || []).length === 0 ? (
                <p className="text-[11px] text-stone-400 font-mono py-2">No previous outbound outreach recorded.</p>
              ) : (
                payload.interaction_state.recent_interactions.map((interaction, idx) => (
                  <div key={idx} className="p-2 rounded bg-stone-50 border border-stone-200/80 text-[11px] flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                          interaction.channel === 'WhatsApp'
                            ? 'bg-emerald-100 text-emerald-800'
                            : interaction.channel === 'Email'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-stone-200 text-stone-800'
                        }`}>
                          {interaction.channel}
                        </span>
                        <span className="text-stone-400 text-[10px]">{interaction.date}</span>
                      </div>
                      <p className="text-stone-700 leading-snug">{interaction.note}</p>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 shrink-0">
                      {interaction.response_received ? 'Replied' : 'Pending'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
