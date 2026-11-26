# Ledger

A multi-entity, multi-currency personal & business finance workspace built natively on [SpacePress](https://spacepress.dev) (`tp/app/` server pages + WordPress Interactivity API `"use client"` islands).

## Features

- **Multi-entity & multi-currency:** Track Personal, Dutch B.V. (BTW 21% + ledger account codes), and Turkish company (KDV 20% + TRY) finances under one normalized EUR base ledger.
- **Institutions, hierarchical accounts & cards:** Supports bunq (operating + virtual VAT pots), multiple Wise multi-currency accounts, HSBC Turkey (checking + credit cards with billing cycles and *taksit* installment schedules), and Interactive Brokers.
- **Lunch Money v2 ledger model:** Separate `reviewStatus` (`unreviewed` / `reviewed` / `flagged`) and `isPending`, `excludeFromBudget` / `excludeFromTotals`, atomic double-entry `transfers` (inter-account, FX conversion, card payment, inter-entity), `recurringItems`, `installmentPlans`, `trades`, `valuations`, and `fxRates`.
- **Unified internal & external reimbursements:** Track both out-of-pocket expenses for your own entities (e.g. Personal card → Dutch B.V., settled via an atomic `inter_entity` transfer + deductible business expense) and third-party employer/client reimbursements (e.g. Automattic Inc. via Ramp, tracked as **Owed to You (Receivables)** on the dashboard and settled against an incoming `reimbursement` deposit with exact multi-currency `fxVarianceMinor`).
- **Drop-anything native PDF, receipt & CSV inbox:** Drag-and-drop CSVs, PDFs, or receipt images into `InboxDropzone` (`uploadFile("inboxFiles", file)`). A background Action Scheduler job (`processIngestItem`) reads private files server-side via `inboxFiles.readText()` / `inboxFiles.readBase64()`, parses bunq/Wise/HSBC Turkey CSVs (including `2/6 TAKSIT` detection) offline, and extracts full native PDFs and receipt images via **Gemini** (`generateContent`), **Anthropic** (`/v1/messages` native `document`/`image`), or **OpenAI** (`/v1/responses` native `input_file`/`input_image`) using the 60s / 16 MiB job `fetch()` budget.
- **Row-level grants & revocable share links:** Invite accountants or collaborators scoped to a single legal entity (enforced directly in SQL via read-only `db.query` access rules) or issue date-windowed, counterparty-maskable capability links (`/share/<token>`).

## Quickstart

```bash
npm install
npm run dev
```

To expose on your local network:

```bash
npx typedpress dev --host 10.0.0.24
```

## AI Extraction Configuration (Optional)

When no API key is configured, CSV statements parse deterministically offline and uploaded PDFs/images create a manual review proposal. To enable native multimodal PDF & receipt extraction, set any one of these environment variables (and optionally pick `aiProvider` / `aiModel` in `financeSettings`):

- **Gemini (default, `gemini-2.5-flash`):** `GEMINI_API_KEY` (or `FINANCE_AI_API_KEY`)
- **Anthropic (`claude-sonnet-4-20250514`):** `ANTHROPIC_API_KEY` (or `FINANCE_AI_API_KEY` with `aiProvider = "anthropic"`)
- **OpenAI (`gpt-4.1-mini`):** `OPENAI_API_KEY` (or `FINANCE_AI_API_KEY` with `aiProvider = "openai"`)
