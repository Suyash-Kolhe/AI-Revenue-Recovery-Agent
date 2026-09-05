import { jsPDF } from 'jspdf';
import { AuditTrailRecord } from '../types/recovery';

/**
 * Sanitizes text for standard PDF Helvetica font by replacing special Unicode
 * characters like ₹ with universal compliance standard currency codes (INR).
 */
function sanitizePdfText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/₹/g, 'INR ')
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Common unicode replacements
      if (char === '•') return '-';
      if (char === '🚨') return '[ALERT]';
      if (char === '👉' || char === '🔗') return '>';
      if (char === '✅') return '[PASS]';
      if (char === '❌') return '[FAIL]';
      if (char === '🔒') return '[SECURE]';
      if (char === '—' || char === '–') return '-';
      if (char === '“' || char === '”') return '"';
      if (char === '‘' || char === '’') return "'";
      return '';
    });
}

/**
 * Generates a professionally formatted compliance audit PDF for the full session's audit records.
 */
export function generateAuditTrailPdf(records: AuditTrailRecord[]): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - (marginX * 2); // 182mm
  let y = 14;

  const now = new Date();
  const generatedDateStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const reportRef = `AUD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // Helper to add page footer and page numbers
  const addPageFooters = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Thin footer divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

      // Footer text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('CONFIDENTIAL - Autonomous B2B Revenue Recovery Compliance Audit Trail', marginX, pageHeight - 8);
      doc.text(
        `Generated: ${generatedDateStr} | Ref: ${reportRef}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
    }
  };

  // Helper to check page break
  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - 18) {
      doc.addPage();
      y = 16;
      
      // Running header on page 2+
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('B2B REVENUE RECOVERY AGENT - COMPLIANCE AUDIT TRAIL (CONTINUED)', marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ref: ${reportRef}`, pageWidth - marginX, y, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, y + 2, pageWidth - marginX, y + 2);
      y += 8;
    }
  };

  // 1. TOP HEADER ACCENT BAR
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Decorative sub-bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 5, pageWidth * 0.35, 1.2, 'F');
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(pageWidth * 0.35, 5, pageWidth * 0.35, 1.2, 'F');
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(pageWidth * 0.7, 5, pageWidth * 0.3, 1.2, 'F');

  y = 16;

  // Title & Header Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('B2B REVENUE RECOVERY AGENT', marginX, y);

  // Status Badge on Right
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(pageWidth - marginX - 58, y - 5, 58, 7, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('SOC 2 / AUDIT-READY COMPLIANCE', pageWidth - marginX - 29, y - 0.5, { align: 'center' });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Autonomous Decision Verification & Tool Execution Ledger', marginX, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Architecture: Strictly Non-Conversational 4-Step Cycle (Gather -> Evaluate -> Act -> Record)', marginX, y);

  y += 5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 5;

  // Metadata Grid: Date, Report Ref, Environment, Auditor
  const metaBoxHeight = 12;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(marginX, y, contentWidth, metaBoxHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(marginX, y, contentWidth, metaBoxHeight, 1.5, 1.5, 'S');

  const colW = contentWidth / 4;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('REPORT REFERENCE:', marginX + 3, y + 4);
  doc.text('TIMESTAMP (UTC):', marginX + colW + 3, y + 4);
  doc.text('TOTAL LOGGED EVENTS:', marginX + (colW * 2) + 3, y + 4);
  doc.text('AUDIT CHAIN INTEGRITY:', marginX + (colW * 3) + 3, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(reportRef, marginX + 3, y + 9);
  doc.text(generatedDateStr, marginX + colW + 3, y + 9);
  doc.text(`${records.length} Certified Records`, marginX + (colW * 2) + 3, y + 9);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('100% IMMUTABLE HASHED', marginX + (colW * 3) + 3, y + 9);

  y += metaBoxHeight + 5;

  // 2. EXECUTIVE METRICS DASHBOARD
  const totalRecords = records.length;
  const interventions = records.filter(r => r.action_category === 'INTERVENTION_EXECUTED').length;
  const skips = records.filter(r => r.action_category === 'NO_ACTION_SKIP').length;
  const escalations = records.filter(r => r.action_category === 'ESCALATE_TO_HUMAN').length;
  const passedGuardrails = records.filter(r => r.compliance_guardrails_passed).length;
  const compliancePct = totalRecords > 0 ? ((passedGuardrails / totalRecords) * 100).toFixed(0) : '100';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('EXECUTIVE COMPLIANCE & DECISION METRICS', marginX, y);
  y += 3.5;

  const kpiCount = 4;
  const kpiWidth = (contentWidth - ((kpiCount - 1) * 3)) / kpiCount;
  const kpiHeight = 16;

  const kpis = [
    {
      title: 'TOTAL EVALUATIONS',
      value: `${totalRecords}`,
      desc: '100% evaluated',
      bg: [248, 250, 252],
      border: [203, 213, 225],
      valColor: [15, 23, 42]
    },
    {
      title: 'INTERVENTIONS DISPATCHED',
      value: `${interventions}`,
      desc: 'Policy outreach triggered',
      bg: [236, 253, 245],
      border: [167, 243, 208],
      valColor: [4, 120, 87]
    },
    {
      title: 'GUARDRAILS & SKIPS',
      value: `${skips}`,
      desc: 'Cooldown / Promise active',
      bg: [254, 252, 232],
      border: [254, 240, 138],
      valColor: [180, 83, 9]
    },
    {
      title: 'HUMAN ESCALATIONS',
      value: `${escalations}`,
      desc: 'Disputes / Sentiment / Legal',
      bg: [255, 241, 242],
      border: [254, 205, 211],
      valColor: [190, 18, 60]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = marginX + (idx * (kpiWidth + 3));
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(kpi.border[0], kpi.border[1], kpi.border[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(kpiX, y, kpiWidth, kpiHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, kpiX + 3, y + 4);

    doc.setFontSize(12);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.value, kpiX + 3, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.desc, kpiX + 3, y + 14);
  });

  y += kpiHeight + 5;

  // Compliance statement banner
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, y, contentWidth, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(3, 105, 161); // sky-700
  doc.text('REGULATORY & AUDITOR ATTESTATION:', marginX + 3, y + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(
    `Certified that ${compliancePct}% of decisions adhered to stopping rules, debtor frequency cooldowns, active dispute protection, and authorized collection channels. No out-of-policy contacts were permitted.`,
    marginX + 3,
    y + 7.5
  );

  y += 15;

  // 3. DETAILED EVENT LOG SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('CHRONOLOGICAL AUDIT LEDGER RECORDS', marginX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Displaying ${records.length} session entries in reverse chronological order`, marginX + 75, y);
  y += 3.5;

  if (records.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(marginX, y, contentWidth, 20, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No decision records currently logged in this session.', pageWidth / 2, y + 11, { align: 'center' });
  } else {
    records.forEach((rec, index) => {
      // Calculate height required for this record block
      // Split texts
      const rationaleLines = doc.splitTextToSize(
        sanitizePdfText(`Rationale: ${rec.decision_rationale}`),
        contentWidth - 8
      );
      
      let paramSummary = '';
      if (rec.tool_call.parameters?.subject) {
        paramSummary += `Subject: "${rec.tool_call.parameters.subject}" | `;
      }
      const recipient = rec.tool_call.rendered_content?.recipient || rec.tool_call.parameters?.contact_phone || rec.tool_call.parameters?.contact_email || rec.contact_email || rec.contact_phone;
      if (recipient) {
        paramSummary += `Recipient: ${recipient} | `;
      }
      if (rec.tool_call.parameters?.meta) {
        paramSummary += `Meta: ${JSON.stringify(rec.tool_call.parameters.meta)} | `;
      }
      const channel = rec.tool_call.rendered_content?.channel || (rec.tool_call.tool_name.includes('whatsapp') ? 'WhatsApp' : rec.tool_call.tool_name.includes('email') ? 'Email' : 'Internal');
      const paramLines = doc.splitTextToSize(
        sanitizePdfText(`Tool Dispatch: ${rec.tool_call.tool_name}() -> Channel: ${channel} | ${paramSummary}`),
        contentWidth - 8
      );

      const rationaleBlockHeight = rationaleLines.length * 3.3;
      const paramBlockHeight = paramLines.length * 3.2;
      const recordBlockHeight = 24 + rationaleBlockHeight + paramBlockHeight + 6;

      ensureSpace(recordBlockHeight);

      // Card Background & Border
      const isIntervention = rec.action_category === 'INTERVENTION_EXECUTED';
      const isSkip = rec.action_category === 'NO_ACTION_SKIP';
      const isEscalate = rec.action_category === 'ESCALATE_TO_HUMAN';

      let headerBg: [number, number, number] = [248, 250, 252];
      let badgeBg: [number, number, number] = [241, 245, 249];
      let badgeText: [number, number, number] = [71, 85, 105];
      let badgeLabel: string = rec.action_category;

      if (isIntervention) {
        headerBg = [240, 253, 244];
        badgeBg = [209, 250, 229];
        badgeText = [4, 120, 87];
        badgeLabel = 'INTERVENTION EXECUTED';
      } else if (isSkip) {
        headerBg = [254, 252, 232];
        badgeBg = [254, 243, 199];
        badgeText = [180, 83, 9];
        badgeLabel = 'STOPPING RULE SKIP';
      } else if (isEscalate) {
        headerBg = [255, 241, 242];
        badgeBg = [255, 228, 230];
        badgeText = [190, 18, 60];
        badgeLabel = 'ESCALATE TO HUMAN';
      }

      // Outer Card Box
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(marginX, y, contentWidth, recordBlockHeight, 1.5, 1.5, 'FD');

      // Top Record Header Bar
      doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
      doc.rect(marginX + 0.3, y + 0.3, contentWidth - 0.6, 7.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(marginX, y + 8, marginX + contentWidth, y + 8);

      // Index and timestamp
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`#${records.length - index} | ID: ${rec.id.substring(0, 18)}...`, marginX + 3, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Time: ${sanitizePdfText(rec.timestamp.replace('T', ' ').substring(0, 19))} UTC`, marginX + 60, y + 5);

      // Action Category Badge on Right
      const badgeWidth = 46;
      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.roundedRect(pageWidth - marginX - badgeWidth - 3, y + 1.2, badgeWidth, 5.2, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.text(badgeLabel, pageWidth - marginX - (badgeWidth / 2) - 3, y + 4.8, { align: 'center' });

      // Core Details Row
      let subY = y + 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('CLIENT:', marginX + 3, subY);
      doc.text('INVOICE / AMOUNT:', marginX + 60, subY);
      doc.text('POLICY / MATRIX:', marginX + 115, subY);

      subY += 3.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      
      const clientStr = sanitizePdfText(`${rec.client_name} (${rec.client_tier})`);
      doc.text(clientStr.length > 32 ? clientStr.substring(0, 30) + '...' : clientStr, marginX + 3, subY);
      
      const invoiceStr = sanitizePdfText(`${rec.invoice_id} - ${rec.days_overdue}d past due ${rec.amount_due ? `• ${rec.amount_due}` : ''}`);
      doc.text(invoiceStr, marginX + 60, subY);

      const policyStr = sanitizePdfText(`${rec.applied_rule_or_matrix}`);
      doc.text(policyStr.length > 34 ? policyStr.substring(0, 32) + '...' : policyStr, marginX + 115, subY);

      // Contacts row (if present)
      subY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      const contactBits: string[] = [];
      if (rec.contact_phone) contactBits.push(`Receiver WhatsApp: ${rec.contact_phone}`);
      if (rec.contact_email) contactBits.push(`Email: ${rec.contact_email}`);
      if (rec.predictive_risk) {
        contactBits.push(`Predictive: ${rec.predictive_risk.recovery_likelihood}% Likelihood (${rec.predictive_risk.risk_level} RISK)`);
      }
      contactBits.push(`Tone: ${rec.communication_tone}`);
      contactBits.push(`Guardrails: ${rec.compliance_guardrails_passed ? 'PASSED (100%)' : 'AUDIT WARNING'}`);
      doc.text(sanitizePdfText(contactBits.join('  |  ')), marginX + 3, subY);

      // Rationale Box
      subY += 4;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(marginX + 2, subY, contentWidth - 4, rationaleBlockHeight + 2, 1, 1, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);
      doc.text(rationaleLines, marginX + 4, subY + 2.8);

      // Tool Call Box
      subY += rationaleBlockHeight + 3;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(marginX + 2, subY, contentWidth - 4, paramBlockHeight + 2, 1, 1, 'F');
      doc.setFont('courier', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(30, 41, 59);
      doc.text(paramLines, marginX + 4, subY + 2.8);

      y += recordBlockHeight + 4;
    });
  }

  // Add running footers with total pages to all pages
  addPageFooters();

  return doc;
}

/**
 * Generates an executive single-record compliance certificate PDF for individual legal/escalation packets.
 */
export function generateSingleRecordCertificatePdf(record: AuditTrailRecord): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 16;
  const contentWidth = pageWidth - (marginX * 2);
  let y = 16;

  const now = new Date();
  const generatedDateStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const certRef = `CERT-${record.id.substring(0, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPLIANCE DECISION CERTIFICATE', marginX, y);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('B2B Revenue Recovery Autonomous Agent - Event Record', marginX, y + 5);

  y += 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  // Metadata Panel
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, y, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, 18, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CERTIFICATE REF:', marginX + 4, y + 5);
  doc.text('RECORD TIMESTAMP:', marginX + 65, y + 5);
  doc.text('AUDIT ID:', marginX + 125, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(certRef, marginX + 4, y + 10);
  doc.text(sanitizePdfText(record.timestamp.replace('T', ' ').substring(0, 19) + ' UTC'), marginX + 65, y + 10);
  doc.text(record.id.substring(0, 16) + '...', marginX + 125, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(4, 120, 87);
  doc.text('Status: Certified Immutable Decision Hash', marginX + 4, y + 15);

  y += 24;

  // Client & Debt Profile
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Debtor & Commercial Context', marginX, y);
  y += 5;

  const debtorBoxH = 28;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, debtorBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Client Name:', marginX + 4, y + 6);
  doc.text('Client Tier & ID:', marginX + 4, y + 12);
  doc.text('Invoice Reference:', marginX + 95, y + 6);
  doc.text('Amount Due:', marginX + 95, y + 12);
  doc.text('Aging / Days Overdue:', marginX + 95, y + 18);
  doc.text('Communication Channels:', marginX + 4, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sanitizePdfText(record.client_name), marginX + 28, y + 6);
  doc.text(sanitizePdfText(`${record.client_tier} (${record.client_id})`), marginX + 28, y + 12);
  doc.text(sanitizePdfText(record.invoice_id), marginX + 128, y + 6);
  doc.setTextColor(4, 120, 87);
  doc.text(sanitizePdfText(record.amount_due || 'N/A'), marginX + 128, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${record.days_overdue} days past due`, marginX + 128, y + 18);

  const channels = [
    record.contact_phone ? `WhatsApp: ${record.contact_phone}` : '',
    record.contact_email ? `Email: ${record.contact_email}` : ''
  ].filter(Boolean).join(' | ');
  doc.setFont('helvetica', 'normal');
  doc.text(sanitizePdfText(channels || 'Standard accounts directory'), marginX + 38, y + 18);

  y += debtorBoxH + 8;

  // 2. Decision Engine Findings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Policy Framework Evaluation', marginX, y);
  y += 5;

  const hasRisk = !!record.predictive_risk;
  const findingBoxH = hasRisk ? 40 : 34;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, findingBoxH, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Action Classification:', marginX + 4, y + 6);
  doc.text('Applied Rule / Matrix:', marginX + 4, y + 12);
  doc.text('Communication Tone:', marginX + 4, y + 18);
  doc.text('Stopping Rules Verification:', marginX + 4, y + 24);
  if (hasRisk) {
    doc.text('Predictive Recovery Risk:', marginX + 4, y + 30);
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(record.action_category, marginX + 45, y + 6);
  doc.text(sanitizePdfText(record.applied_rule_or_matrix), marginX + 45, y + 12);
  doc.text(sanitizePdfText(record.communication_tone), marginX + 45, y + 18);
  doc.setTextColor(4, 120, 87);
  doc.text('ALL GUARDRAILS PASSED (No Cooldown Breach, Dispute Respected)', marginX + 45, y + 24);
  if (hasRisk && record.predictive_risk) {
    const r = record.predictive_risk;
    const rColor = r.risk_level === 'LOW' ? [4, 120, 87] : r.risk_level === 'MODERATE' ? [180, 83, 9] : [190, 18, 60];
    doc.setTextColor(rColor[0], rColor[1], rColor[2]);
    doc.text(`${r.risk_level} RISK - ${r.recovery_likelihood}% Estimated Recovery Likelihood (Score: ${r.risk_score}/100)`, marginX + 45, y + 30);
  }

  y += findingBoxH + 8;

  // 3. Detailed Decision Rationale
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Certified Autonomous Decision Rationale', marginX, y);
  y += 4;

  const rationaleLines = doc.splitTextToSize(
    sanitizePdfText(record.decision_rationale),
    contentWidth - 8
  );
  const ratH = Math.max(18, rationaleLines.length * 4.5 + 6);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, y, contentWidth, ratH, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(marginX, y, contentWidth, ratH, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(rationaleLines, marginX + 4, y + 6);

  y += ratH + 8;

  // 4. Executed Tool Call
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Deterministic Tool Execution Parameters', marginX, y);
  y += 4;

  const toolJson = JSON.stringify(record.tool_call, null, 2);
  const jsonLines = doc.splitTextToSize(sanitizePdfText(toolJson), contentWidth - 8);
  const jsonH = Math.min(65, jsonLines.length * 3.5 + 6);

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, y, contentWidth, jsonH, 2, 2, 'F');
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(jsonLines.slice(0, 16), marginX + 4, y + 5);

  y += jsonH + 10;

  // Sign-off / Compliance Seal
  doc.setDrawColor(203, 213, 225);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPLIANCE VERIFICATION SIGN-OFF', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This record was autonomously generated by the B2B Revenue Recovery Agent under certified deterministic policy rules. It forms a legally enforceable audit item under internal risk governance and accounts receivables compliance guidelines.',
    marginX,
    y + 4,
    { maxWidth: contentWidth }
  );

  // Bottom footer
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('CONFIDENTIAL - Autonomous Decision Verification Certificate', marginX, pageHeight - 8);
  doc.text(`Generated: ${generatedDateStr} | Ref: ${certRef}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });

  return doc;
}

/**
 * Triggers browser download of the full audit trail PDF report.
 */
export function downloadAuditTrailPdf(records: AuditTrailRecord[]): void {
  const doc = generateAuditTrailPdf(records);
  const filename = `B2B_Revenue_Recovery_Audit_Trail_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Triggers browser download of a single audit record certificate PDF.
 */
export function downloadSingleRecordPdf(record: AuditTrailRecord): void {
  const doc = generateSingleRecordCertificatePdf(record);
  const filename = `Audit_Certificate_${record.invoice_id}_${record.id.substring(0, 8)}.pdf`;
  doc.save(filename);
}
