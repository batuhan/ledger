# Ledger

A multi-entity, multi-currency personal & business finance workspace built natively on [SpacePress](https://spacepress.dev) (`tp/app/` server pages + WordPress Interactivity API `"use client"` islands).

## Features

- **Multi-entity & multi-currency:** Track Personal, Dutch B.V. (BTW 21% + ledger account codes), and Turkish company (KDV 20% + TRY) finances under one normalized EUR base ledger.
- **Institutions, hierarchical accounts & cards:** Supports bunq (operating + virtual VAT pots), multiple Wise multi-currency accounts, HSBC Turkey (checking + credit cards with billing cycles and *taksit* installment schedules), and Interactive Brokers.
- **Lunch Money v2 ledger model:** Separate `reviewStatus` (`unreviewed` / `reviewed` / `flagged`) and `isPending`, `excludeFromBudget` / `excludeFromTotals`, atomic double-entry `transfers` (inter-account, FX conversion, card payment, inter-entity), `recurringItems`, `installmentPlans`, `trades`, `valuations`, and `fxRates`.
- **Drop-anything AI & CSV inbox:** Drag-and-drop CSVs, PDFs, or receipt images into `InboxDropzone` (`uploadFile("inboxFiles", file)`). A background Action Scheduler job (`processIngestItem`) reads private files server-side via `inboxFiles.readText()` / `inboxFiles.readBase64()`, parses bunq/Wise/HSBC Turkey CSVs (including `2/6 TAKSIT` detection) out of the box, and optionally calls OpenAI (`FINANCE_AI_API_KEY`) using the 60s / 16 MiB job `fetch()` budget.
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

Optional: set `FINANCE_AI_API_KEY` in your runtime environment to enable LLM extraction on uploaded PDF statements and receipt images.
