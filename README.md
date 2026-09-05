# Autonomous B2B Revenue Recovery Agent

A browser-based operations console for evaluating overdue B2B invoices, applying deterministic recovery policies, generating the next recommended action, and recording every decision in an auditable ledger.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Decision Outcomes](#decision-outcomes)
- [Built-in Scenarios](#built-in-scenarios)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Application Workflow](#application-workflow)
- [Project Structure](#project-structure)
- [Extending the Agent](#extending-the-agent)
- [Validation](#validation)
- [Important Limitations](#important-limitations)
- [License](#license)
- [References](#references)

> The application is designed as a **demonstration and decision-support interface**. It evaluates local scenario data in the browser; it does not send real emails or WhatsApp messages, collect payments, suspend services, or connect to a production accounts-receivable system.

## Overview

Revenue recovery requires a balance between timely collection and preservation of customer relationships. This project models that balance with explicit stopping rules, customer-tier intervention matrices, predictive recovery scoring, and structured audit records.

For each invoice payload, the recovery engine follows a gather–evaluate–act flow:

1. **Gather** invoice, customer, payment-history, contact-history, dispute, sentiment, and service-issue data.
2. **Evaluate** stopping rules, communication tone, intervention bracket, and predictive recovery risk.
3. **Act** by producing one deterministic tool-call result: skip and audit, escalate to a human, or generate a simulated recovery intervention.
4. **Record** the decision, rationale, rule evaluation, generated content, and compliance status in the audit ledger.

## Features

| Area | Included functionality |
|---|---|
| Scenario evaluation | Select from preset overdue-invoice scenarios and run an individual evaluation. |
| Payload editing | Adjust the active customer, invoice, history, and interaction-state payload before execution. |
| Stopping rules | Evaluate contact-frequency limits, active promises to pay, escalation signals, and hard-default conditions. |
| Recovery actions | Generate deterministic skip, human-escalation, gentle-email, firm-WhatsApp, installment-plan, or suspension-warning outputs. |
| Predictive risk | Calculate recovery likelihood, risk score, risk level, risk factors, and an aging-decay view. |
| Batch execution | Run all built-in scenarios and add their records to the audit ledger. |
| Auditability | Review structured decisions, action categories, applied rules, rationales, tool calls, and guardrail status. |
| PDF export | Download the complete audit trail or individual audit certificates as PDF files. |
| Policy reference | Open the in-app rules reference to review the configured decision framework. |

## Decision Outcomes

Every evaluation produces one of three action categories:

| Action category | Meaning |
|---|---|
| `NO_ACTION_SKIP` | The system stops automated outreach and records the reason. |
| `ESCALATE_TO_HUMAN` | The case requires an account manager, executive, legal, risk, or other human review. |
| `INTERVENTION_EXECUTED` | The policy allows a simulated automated recovery action to be prepared. |

The generated result includes the selected tool name, structured parameters, and—when applicable—rendered message content for Email, WhatsApp, an escalation ticket, or the compliance system.

## Built-in Scenarios

The preset matrix covers representative policy paths, including:

- A routine overdue invoice eligible for a gentle reminder.
- A contact-frequency stop condition.
- An active promise-to-pay condition.
- A disputed invoice requiring human handling.
- Frustrated or angry customer sentiment requiring escalation.
- A hard default with repeated failed contact attempts.
- Tier- and aging-based intervention paths, including installment-plan and suspension-warning proposals.

> The scenario data is fictional demonstration data. Payment URLs, contact information, and company names in the presets must not be treated as production records.

## Tech Stack

| Technology | Role |
|---|---|
| React 19 | User interface and application state. |
| TypeScript | Static typing for payloads, rules, results, and audit records. |
| Vite | Development server and production bundling. |
| Tailwind CSS | Utility-first styling through the Vite integration. |
| Lucide React | Interface icons. |
| Motion | UI animation support. |
| jsPDF and html2canvas | Browser-side audit-trail PDF generation. |
| Bun lockfile / npm-compatible scripts | Dependency installation and project commands. |

## Getting Started

### Requirements

- Node.js 18 or newer. Node.js 20+ is recommended.
- npm, Bun, or another package manager capable of installing the dependencies.
- A modern browser with JavaScript enabled.

### 1. Clone the repository

```bash
git clone https://github.com/Suyash-Kolhe/AI-Revenue-Recovery-Agent.git
cd AI-Revenue-Recovery-Agent
```

### 2. Install dependencies

Using npm:

```bash
npm install
```

Using Bun:

```bash
bun install
```

### 3. Configure environment variables when required

The repository includes an `.env.example` file with the following variables:

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Reserved for Gemini API configuration in environments that provide server-side AI access. |
| `APP_URL` | The hosted application URL used by supported hosting environments for self-referential links and callbacks. |

For a local copy, create an environment file only if your hosting or integration setup requires it:

```bash
cp .env.example .env
```

Do not commit real API keys or other secrets. The current recovery workflow is implemented as a local deterministic engine and does not require a Gemini key to run the core interface.

### 4. Start the development server



### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server on port 3000. |
| `npm run lint` | Run the TypeScript compiler in no-emit mode. |
| `npm run build` | Create an optimized production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run clean` | Remove generated build output and `server.js` if present. |

## Application Workflow

### Operations Management System view

The default page presents the active debtor context, preset scenario selector, editable payload, execution state, generated action, and quick access to the audit ledger. Selecting **Execute Agent** or **Re-Evaluate** runs the current payload through `RevenueRecoveryEngine`.

### Predictive Recovery view

The predictive page presents the calculated recovery likelihood and risk classification. It also provides an aging perspective that shows how the risk calculation changes as an invoice becomes further overdue.

### Audit Trail and Compliance Ledger

Each completed cycle creates an audit record containing the evaluated stopping rules, applied matrix or rule, decision rationale, communication tone, action category, generated tool call, predictive result, and compliance-guardrail status. The ledger can be cleared in the current browser session and exported as a PDF.

## Project Structure

```
.
├── public/                  # Static assets
├── src/
│   ├── agent/
│   │   ├── presets.ts       # Fictional scenario payloads
│   │   └── recoveryEngine.ts# Deterministic gather–evaluate–act engine
│   ├── components/          # UI sections and controls
│   ├── pages/               # Predictive and audit-oriented views
│   ├── types/               # TypeScript payload and result contracts
│   ├── utils/               # Currency, predictive-risk, and PDF helpers
│   ├── App.tsx              # Application shell and state orchestration
│   ├── index.css            # Global styles
│   └── main.tsx             # React entrypoint
├── .env.example             # Example environment configuration
├── index.html               # Vite document entrypoint
├── metadata.json            # Application metadata and capability declaration
├── package.json             # Scripts and dependencies
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```

## Extending the Agent

To add a new scenario, define a typed `ClientPayload` in `src/agent/presets.ts` and add it to `PRESET_SCENARIOS`. To change policy behavior, update the corresponding rule or matrix logic in `src/agent/recoveryEngine.ts`. To introduce a new action, extend the `ToolCallExecution` and `ActionCategory` contracts in `src/types/recovery.ts`, implement the action-generation branch, and update the interface components that render action results.

When connecting the project to a real collections platform, add a server-side integration layer rather than exposing credentials in the browser. Production integrations should also add authentication, authorization, idempotency, durable audit storage, retry handling, rate limiting, consent and contact-preference checks, message-delivery status, and a formal legal/compliance review.

## Validation

The current repository was validated with:



Both commands complete successfully. The production build may report a bundle-size warning because the application currently produces a large JavaScript chunk; this warning does not prevent the build from completing.

## Important Limitations

- The recovery engine uses deterministic local rules and fictional preset data.
- Generated communications are previews or artifacts inside the interface. They are not delivered to customers.
- The audit ledger is held in application state and is not a durable database.
- Clearing the ledger removes records from the current session.
- The configured environment variables support the surrounding hosting setup, but the core local workflow does not require an external AI or payment service.
- The application should not be used to make real collections decisions without domain, legal, privacy, security, and compliance revi

