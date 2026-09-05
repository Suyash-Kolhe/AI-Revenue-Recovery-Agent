import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  Send, 
  ShieldCheck, 
  Phone, 
  MoreVertical, 
  CreditCard, 
  FileText, 
  MessageSquare,
  Sparkles,
  Layers,
  Code2
} from 'lucide-react';
import { ToolCallExecution } from '../types/recovery';

interface WhatsAppArtifactViewerProps {
  toolCall: ToolCallExecution;
}

export const WhatsAppArtifactViewer: React.FC<WhatsAppArtifactViewerProps> = ({ toolCall }) => {
  const [deliveryStatus, setDeliveryStatus] = useState<'sent' | 'delivered' | 'read'>('read');
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'api_payload' | 'template_meta'>('preview');

  const { tool_name, parameters, rendered_content } = toolCall;
  const isSuspensionWarning = tool_name === 'send_suspension_warning_whatsapp';
  
  const recipientPhone = parameters.recipient_phone || '+1 (555) 832-1155';
  const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
  const paymentLink = parameters.direct_payment_link || parameters.payment_link || rendered_content?.meta?.payment_link || '#';
  const rawBody = rendered_content?.body || '';

  // Generate WhatsApp Web deep link
  const waWebLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rawBody)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(rawBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Meta WhatsApp Cloud API (v18.0) payload representation
  const metaCloudApiPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
    type: 'template',
    template: {
      name: isSuspensionWarning ? 'b2b_service_suspension_warning_v1' : 'b2b_firm_overdue_payment_v2',
      language: {
        code: 'en_US'
      },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'text',
              text: parameters.invoice_id || 'INV-2026-105'
            }
          ]
        },
        {
          type: 'body',
          parameters: isSuspensionWarning
            ? [
                { type: 'text', text: parameters.client_name },
                { type: 'text', text: parameters.invoice_id },
                { type: 'text', text: parameters.amount_due },
                { type: 'text', text: String(parameters.days_overdue) },
                { type: 'text', text: parameters.service_cutoff_date },
                { type: 'text', text: paymentLink }
              ]
            : [
                { type: 'text', text: parameters.client_name },
                { type: 'text', text: parameters.invoice_id },
                { type: 'text', text: parameters.amount_due },
                { type: 'text', text: String(parameters.days_overdue) },
                { type: 'text', text: paymentLink }
              ]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: parameters.invoice_id || 'INV-2026-105'
            }
          ]
        }
      ]
    }
  };

  // Format WhatsApp message text with interactive bold/code highlighting
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Bold matcher (*text*)
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <div key={lIdx} className="min-h-[1.25rem]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <strong key={pIdx} className="font-bold text-stone-100">
                  {part.slice(1, -1)}
                </strong>
              );
            }
            if (part.startsWith('🔗 ') || part.startsWith('👉 ') || part.includes('http')) {
              const urlMatch = part.match(/(https?:\/\/[^\s]+)/);
              if (urlMatch) {
                const url = urlMatch[0];
                const prefix = part.slice(0, part.indexOf(url));
                const suffix = part.slice(part.indexOf(url) + url.length);
                return (
                  <span key={pIdx}>
                    {prefix}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 underline font-mono break-all inline-flex items-center gap-0.5"
                    >
                      {url}
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                    {suffix}
                  </span>
                );
              }
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="space-y-3">
      {/* WhatsApp Dispatch Banner */}
      <div className={`p-3 rounded-lg border flex items-center justify-between ${
        isSuspensionWarning 
          ? 'bg-rose-50 border-rose-300 text-rose-950'
          : 'bg-emerald-50 border-emerald-300 text-emerald-950'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${isSuspensionWarning ? 'bg-rose-600 text-white' : 'bg-[#25D366] text-white'}`}>
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-xs flex items-center gap-1.5">
              <span>{isSuspensionWarning ? 'WhatsApp Service Suspension Warning' : 'WhatsApp Firm Overdue Reminder'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/80 border border-stone-200">
                {isSuspensionWarning ? '31–60 DAYS (LOW-TIER)' : '16–30 DAYS OVERDUE'}
              </span>
            </div>
            <p className="text-[11px] opacity-80">
              {isSuspensionWarning 
                ? 'Strict 72-hour service cutoff notice dispatched to customer executive via verified WhatsApp Business.'
                : 'Firm overdue notice with direct instant clearing payment link dispatched via verified WhatsApp Business.'}
            </p>
          </div>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded border border-stone-200 text-[11px] font-medium">
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`px-2 py-1 rounded transition-colors ${
              activeSubTab === 'preview' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Live Chat
          </button>
          <button
            onClick={() => setActiveSubTab('api_payload')}
            className={`px-2 py-1 rounded transition-colors font-mono ${
              activeSubTab === 'api_payload' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Cloud API Payload
          </button>
          <button
            onClick={() => setActiveSubTab('template_meta')}
            className={`px-2 py-1 rounded transition-colors ${
              activeSubTab === 'template_meta' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Template Specs
          </button>
        </div>
      </div>

      {/* Main Tab View */}
      {activeSubTab === 'preview' && (
        <div className="max-w-md mx-auto">
          {/* Authentic WhatsApp Phone Container */}
          <div className="rounded-2xl overflow-hidden border border-stone-300 shadow-md bg-[#0b141a]">
            {/* WhatsApp Header Bar */}
            <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between text-white border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                    FC
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-[#1f2c34]"></span>
                </div>
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5 text-stone-100">
                    <span>FinanceCore Accounts</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]/20" />
                  </div>
                  <div className="text-[10px] text-stone-400">
                    Official Business Account • {recipientPhone}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-stone-400 text-xs">
                <Phone className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                <MoreVertical className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>

            {/* Chat Body Canvas */}
            <div className="p-4 space-y-3 bg-[#0b141a] bg-opacity-95 min-h-[340px] flex flex-col justify-between">
              <div className="space-y-3">
                {/* End-to-End Encryption Banner */}
                <div className="bg-[#182229] rounded-lg p-2 text-center text-[10px] text-stone-400 border border-stone-800/80 leading-relaxed shadow-2xs">
                  <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    End-to-end encrypted
                  </span>
                  <div>Messages are secured with TLS 1.3 encryption & ISO-27001 audit standards.</div>
                </div>

                {/* Message Bubble */}
                <div className="relative max-w-[95%] bg-[#005c4b] text-stone-100 rounded-lg rounded-tl-xs p-3.5 shadow-md border border-emerald-800/40">
                  {/* WhatsApp speech bubble tail */}
                  <div className="absolute top-0 -left-1.5 w-3 h-3 bg-[#005c4b] [clip-path:polygon(100%_0,0_0,100%_100%)]"></div>

                  {/* Header Badge */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-600/40 text-[11px]">
                    <span className="font-semibold text-emerald-200">
                      {isSuspensionWarning ? '🚨 NOTICE OF SUSPENSION' : '⚠️ URGENT REMITTANCE'}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-300/80">
                      Ref: {parameters.invoice_id}
                    </span>
                  </div>

                  {/* Content Body */}
                  <div className="text-xs leading-relaxed space-y-1">
                    {renderFormattedText(rawBody)}
                  </div>

                  {/* Interactive Buttons (Meta WhatsApp Business CTA templates) */}
                  <div className="mt-3 pt-2.5 border-t border-emerald-600/40 space-y-1.5">
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 px-3 rounded bg-[#00a884] hover:bg-[#029070] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Direct Payment Link ({parameters.amount_due || 'Settle Now'})</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-[11px] font-medium flex items-center justify-center gap-1 border border-emerald-700/50"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Invoice</span>
                      </a>
                      <a
                        href={waWebLink}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-2 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 text-[11px] font-medium flex items-center justify-center gap-1 border border-emerald-700/50"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Reply Advice</span>
                      </a>
                    </div>
                  </div>

                  {/* Timestamp & Status Ticks */}
                  <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-stone-300 font-mono">
                    <span>14:32</span>
                    {deliveryStatus === 'sent' && (
                      <span className="text-stone-400" title="Sent">✓</span>
                    )}
                    {deliveryStatus === 'delivered' && (
                      <span className="text-stone-300" title="Delivered">✓✓</span>
                    )}
                    {deliveryStatus === 'read' && (
                      <span className="text-[#53bdeb] font-bold" title="Read (Blue Ticks)">✓✓</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Simulation Controls */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
                <span>Delivery Status:</span>
                <div className="flex items-center gap-1 font-mono">
                  <button
                    onClick={() => setDeliveryStatus('sent')}
                    className={`px-1.5 py-0.5 rounded ${deliveryStatus === 'sent' ? 'bg-stone-700 text-white' : 'hover:bg-stone-800 text-stone-400'}`}
                  >
                    Sent (✓)
                  </button>
                  <button
                    onClick={() => setDeliveryStatus('delivered')}
                    className={`px-1.5 py-0.5 rounded ${deliveryStatus === 'delivered' ? 'bg-stone-700 text-white' : 'hover:bg-stone-800 text-stone-400'}`}
                  >
                    Delivered (✓✓)
                  </button>
                  <button
                    onClick={() => setDeliveryStatus('read')}
                    className={`px-1.5 py-0.5 rounded ${deliveryStatus === 'read' ? 'bg-[#53bdeb]/20 text-[#53bdeb] font-bold' : 'hover:bg-stone-800 text-stone-400'}`}
                  >
                    Read (✓✓ Blue)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <a
              href={waWebLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Test in WhatsApp Web</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium border border-stone-200 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Meta Cloud API JSON View */}
      {activeSubTab === 'api_payload' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="font-mono">POST https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages</span>
            <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              Meta WhatsApp Cloud API v18.0 Compliant
            </span>
          </div>

          <pre className="p-3.5 rounded-lg bg-stone-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-stone-800">
{JSON.stringify(metaCloudApiPayload, null, 2)}
          </pre>
        </div>
      )}

      {/* WhatsApp Template Specifications View */}
      {activeSubTab === 'template_meta' && (
        <div className="p-4 rounded-lg border border-stone-200 bg-stone-50 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-white border border-stone-200">
              <span className="text-stone-400 block text-[10px]">TEMPLATE NAME</span>
              <span className="font-bold text-stone-800">
                {isSuspensionWarning ? 'service_suspension_warning' : 'firm_overdue_payment'}
              </span>
            </div>
            <div className="p-2 rounded bg-white border border-stone-200">
              <span className="text-stone-400 block text-[10px]">CATEGORY</span>
              <span className="font-bold text-blue-700">TRANSACTIONAL</span>
            </div>
            <div className="p-2 rounded bg-white border border-stone-200">
              <span className="text-stone-400 block text-[10px]">LANGUAGE</span>
              <span className="font-bold text-stone-800">en_US</span>
            </div>
            <div className="p-2 rounded bg-white border border-stone-200">
              <span className="text-stone-400 block text-[10px]">QUALITY RATING</span>
              <span className="font-bold text-emerald-700">HIGH (GREEN)</span>
            </div>
          </div>

          <div className="p-3 rounded bg-white border border-stone-200 text-stone-700 space-y-1.5">
            <h5 className="font-semibold text-stone-900">Intervention Protocol Specification:</h5>
            <p className="leading-relaxed">
              {isSuspensionWarning ? (
                <>
                  Dispatched under <strong>Intervention Matrix: 31–60 Days Overdue (Low-Tier)</strong>. 
                  Warns customer of imminent platform and API token suspension unless reconciled within 72 hours. Includes dynamic cutoff timestamp and immediate payment clearing link.
                </>
              ) : (
                <>
                  Dispatched under <strong>Intervention Matrix: 16–30 Days Overdue</strong>. 
                  Escalates communication channel from email to WhatsApp with firm phrasing, payment link, and 48-hour deadline.
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
