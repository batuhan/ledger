import { cron, db, HttpError, job, mutation, query } from "spacepress";
import {
  accounts,
  cards,
  categories,
  entries,
  financeMemos,
  fxRates,
  grants,
  inboxFiles,
  ingestItems,
  ingestProposals,
  installmentPlans,
  institutions,
  invitations,
  legalEntities,
  payees,
  recurringItems,
  reimbursementClaims,
  reimbursementLines,
  securities,
  shareLinks,
  trades,
  transfers,
  valuations,
} from "./schema";
import {
  computePosition,
  convertToBaseMinor,
  parseDecimalToMicros,
  parseDecimalToMinor,
  parseStatementCsv,
  slugify,
  stripMarkdownJsonFences,
  type AssetClass,
  type Currency,
  type PayerKind,
  type TradeType,
} from "./lib/money";

type EntryKind =
  | "expense"
  | "income"
  | "transfer"
  | "fx_conversion"
  | "card_payment"
  | "inter_entity"
  | "reimbursement"
  | "fee"
  | "tax"
  | "investment";
type TransferKind = "same_currency" | "fx_conversion" | "card_payment" | "inter_entity" | "broker_funding";

// ---------------------------------------------------------------------------
// FX lookup helper
// ---------------------------------------------------------------------------

async function lookupRateMicros(fromCurrency: Currency, toCurrency: Currency): Promise<number> {
  if (fromCurrency === toCurrency) return 1_000_000;
  const direct = await db.query.fxRates.findFirst({
    where: { fromCurrency, toCurrency },
    orderBy: { rateDate: "desc" },
  });
  if (direct) return direct.rateMicros;
  const inverse = await db.query.fxRates.findFirst({
    where: { fromCurrency: toCurrency, toCurrency: fromCurrency },
    orderBy: { rateDate: "desc" },
  });
  if (inverse && inverse.rateMicros > 0) {
    return Math.round((1_000_000 * 1_000_000) / inverse.rateMicros);
  }
  // Sensible fallback defaults when no FX table rows exist yet.
  if (fromCurrency === "TRY" && toCurrency === "EUR") return 26_500;
  if (fromCurrency === "USD" && toCurrency === "EUR") return 920_000;
  if (fromCurrency === "GBP" && toCurrency === "EUR") return 1_180_000;
  if (fromCurrency === "CHF" && toCurrency === "EUR") return 1_060_000;
  return 1_000_000;
}

// ---------------------------------------------------------------------------
// Background AI & CSV Ingestion Job (PR #615: FileBucket reads + 60s/16 MiB fetch)
// ---------------------------------------------------------------------------

function parseCurrency(raw: string | undefined, fallback: Currency): Currency {
  if (raw === "EUR") return "EUR";
  if (raw === "TRY") return "TRY";
  if (raw === "USD") return "USD";
  if (raw === "GBP") return "GBP";
  if (raw === "CHF") return "CHF";
  return fallback;
}

function parseProposalKind(raw: string | undefined): "expense" | "income" | "transfer" | "fee" {
  if (raw === "income") return "income";
  if (raw === "transfer") return "transfer";
  if (raw === "fee") return "fee";
  return "expense";
}

type ExtractedRow = {
  postedOn?: string;
  description?: string;
  merchant?: string;
  amountMinor?: number;
  currency?: string;
  entryKind?: string;
  installmentCount?: number | null;
};

type ExtractedDocument = {
  institution?: string;
  currency?: string;
  rows?: ExtractedRow[];
};

export const processIngestItem = job({ retries: 2 }, async ({ ingestItemId }: { ingestItemId: number }) => {
  const item = await db.query.ingestItems.findFirst({ where: { id: ingestItemId } });
  if (!item) return;

  await db.update(ingestItems).set({ ingestState: "processing", errorMessage: null }).where({ id: ingestItemId });

  const fileId = item.fileId;
  if (fileId === null) {
    await db
      .update(ingestItems)
      .set({ ingestState: "failed", errorMessage: "No file attached to this inbox item." })
      .where({ id: ingestItemId });
    return;
  }

  const meta = await inboxFiles.get(fileId);
  if (!meta) {
    await db
      .update(ingestItems)
      .set({ ingestState: "failed", errorMessage: `Private file #${fileId} was not found.` })
      .where({ id: ingestItemId });
    return;
  }

  const settings = await db.globals.financeSettings.get();
  const defaultAccount = item.accountId
    ? await db.query.accounts.findFirst({ where: { id: item.accountId } })
    : await db.query.accounts.findFirst({ orderBy: { id: "asc" } });
  const defaultEntityId = item.entityId ?? defaultAccount?.entityId ?? null;
  const fallbackCurrency = (defaultAccount?.currency ?? settings.baseCurrency) as Currency;

  const isTextLike = meta.mime === "text/csv" || meta.mime === "text/plain" || meta.mime === "application/json";

  if (isTextLike) {
    const rawText = await inboxFiles.readText(fileId);
    const parsed = parseStatementCsv(rawText, fallbackCurrency);
    let count = 0;
    for (const row of parsed.rows) {
      await db.insert(ingestProposals).values({
        ingestItemId: item.id,
        targetKind: row.installmentCount ? "installment" : "entry",
        postedOn: row.postedOn,
        description: row.description,
        merchantRaw: row.merchantRaw,
        amountMinor: row.amountMinor,
        currency: row.currency as Currency,
        suggestedEntityId: defaultEntityId,
        suggestedAccountId: defaultAccount?.id ?? null,
        entryKind: row.entryKind,
        installmentCount: row.installmentCount,
        confidenceBps: row.confidenceBps,
        status: "pending",
      });
      count += 1;
    }

    await db
      .update(ingestItems)
      .set({
        ingestState: count > 0 ? "needs_review" : "failed",
        detectedInstitution: parsed.detectedInstitution,
        detectedCurrency: parsed.detectedCurrency as Currency,
        proposalCount: count,
        errorMessage: count === 0 ? "No parseable rows were found in the uploaded CSV." : null,
      })
      .where({ id: item.id });
    return;
  }

  // Binary document (PDF statement or receipt image): read full base64 from private storage.
  // Supports native PDF + image multimodal extraction via Gemini, Anthropic, or OpenAI using
  // the background job's 60s / 16 MiB fetch() budget.
  const b64 = await inboxFiles.readBase64(fileId);
  const geminiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  const anthropicKey = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  const openaiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  const genericKey = (process.env.FINANCE_AI_API_KEY ?? "").trim();

  let activeProvider: "gemini" | "anthropic" | "openai" | null = null;
  let activeKey = "";
  if (settings.aiProvider === "gemini" && (geminiKey !== "" || genericKey !== "")) {
    activeProvider = "gemini";
    activeKey = geminiKey !== "" ? geminiKey : genericKey;
  } else if (settings.aiProvider === "anthropic" && (anthropicKey !== "" || genericKey !== "")) {
    activeProvider = "anthropic";
    activeKey = anthropicKey !== "" ? anthropicKey : genericKey;
  } else if (settings.aiProvider === "openai" && (openaiKey !== "" || genericKey !== "")) {
    activeProvider = "openai";
    activeKey = openaiKey !== "" ? openaiKey : genericKey;
  } else if (geminiKey !== "") {
    activeProvider = "gemini";
    activeKey = geminiKey;
  } else if (anthropicKey !== "") {
    activeProvider = "anthropic";
    activeKey = anthropicKey;
  } else if (openaiKey !== "") {
    activeProvider = "openai";
    activeKey = openaiKey;
  }

  if (activeProvider !== null && activeKey !== "") {
    const prompt =
      "Extract all financial transactions from this bank statement, credit card PDF, invoice, or receipt. " +
      "Use negative integer minor units for expenses/outflows (e.g. -1250 for -12.50) and positive for inflows/refunds. " +
      "Detect Turkish installment plans like '2/6 TAKSIT' into installmentCount. " +
      'Respond ONLY with strict JSON matching: {"institution":"string","currency":"EUR|TRY|USD|GBP|CHF","rows":[{"postedOn":"YYYY-MM-DD","description":"string","merchant":"string","amountMinor":-1250,"currency":"EUR","entryKind":"expense|income|transfer|fee","installmentCount":null}]}';

    const configuredModel = settings.aiModel.trim();
    const isPdf = meta.mime === "application/pdf";
    let rawModelText = "";

    if (activeProvider === "gemini") {
      const model =
        settings.aiProvider === "gemini" && configuredModel !== "" ? configuredModel : "gemini-2.5-flash";
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "x-goog-api-key": activeKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: meta.mime, data: b64 } },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );
      if (res.ok) {
        const payload = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        rawModelText = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
    } else if (activeProvider === "anthropic") {
      const model =
        settings.aiProvider === "anthropic" && configuredModel !== "" ? configuredModel : "claude-sonnet-4-20250514";
      const docPart = isPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
        : { type: "image", source: { type: "base64", media_type: meta.mime, data: b64 } };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": activeKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: "You extract structured accounting ledger rows from statements, invoices, and receipts. Output strict JSON only.",
          messages: [{ role: "user", content: [docPart, { type: "text", text: prompt }] }],
        }),
      });
      if (res.ok) {
        const payload = (await res.json()) as {
          content?: Array<{ type?: string; text?: string }>;
        };
        const textBlock = payload.content?.find((b) => b.type === "text");
        rawModelText = textBlock?.text ?? "";
      }
    } else {
      const model =
        settings.aiProvider === "openai" && configuredModel !== "" ? configuredModel : "gpt-4.1-mini";
      const filePart = isPdf
        ? { type: "input_file", filename: meta.filename, file_data: `data:application/pdf;base64,${b64}` }
        : { type: "input_image", image_url: `data:${meta.mime};base64,${b64}` };
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${activeKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          text: { format: { type: "json_object" } },
          input: [{ role: "user", content: [filePart, { type: "input_text", text: prompt }] }],
        }),
      });
      if (res.ok) {
        const payload = (await res.json()) as {
          output_text?: string;
          output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
        };
        const fallbackBlock = payload.output?.[0]?.content?.find((c) => c.type === "output_text");
        rawModelText = payload.output_text ?? fallbackBlock?.text ?? "";
      }
    }

    if (rawModelText.trim() !== "") {
      const rawJson = stripMarkdownJsonFences(rawModelText);
      let extracted: ExtractedDocument = {};
      try {
        extracted = JSON.parse(rawJson) as ExtractedDocument;
      } catch {
        extracted = {};
      }
      const rows = extracted.rows ?? [];
      const detectedCurrency: Currency = parseCurrency(extracted.currency, fallbackCurrency);
      let count = 0;
      for (const r of rows) {
        const amt = typeof r.amountMinor === "number" ? Math.round(r.amountMinor) : 0;
        if (amt === 0) continue;
        const ccy: Currency = parseCurrency(r.currency, detectedCurrency);
        const kind = parseProposalKind(r.entryKind);
        const rawPosted = r.postedOn ?? "";
        const postedOn = /^\d{4}-\d{2}-\d{2}$/.test(rawPosted) ? rawPosted : new Date().toISOString().slice(0, 10);
        const inst = typeof r.installmentCount === "number" && r.installmentCount >= 2 ? r.installmentCount : null;
        await db.insert(ingestProposals).values({
          ingestItemId: item.id,
          targetKind: inst !== null ? "installment" : "entry",
          postedOn,
          description: (r.description ?? meta.filename).slice(0, 240),
          merchantRaw: (r.merchant ?? r.description ?? meta.filename).slice(0, 120),
          amountMinor: amt,
          currency: ccy,
          suggestedEntityId: defaultEntityId,
          suggestedAccountId: defaultAccount?.id ?? null,
          entryKind: kind,
          installmentCount: inst,
          confidenceBps: 8900,
          status: "pending",
          rawJson,
        });
        count += 1;
      }
      if (count > 0) {
        await db
          .update(ingestItems)
          .set({
            ingestState: "needs_review",
            detectedInstitution: (extracted.institution ?? `AI (${activeProvider})`).slice(0, 80),
            detectedCurrency,
            proposalCount: count,
          })
          .where({ id: item.id });
        return;
      }
    }
  }

  // Offline / no-API-key fallback: create a single reviewable proposal carrying the uploaded file metadata.
  await db.insert(ingestProposals).values({
    ingestItemId: item.id,
    targetKind: "entry",
    postedOn: new Date().toISOString().slice(0, 10),
    description: `Review document: ${meta.filename}`,
    merchantRaw: meta.filename.slice(0, 120),
    amountMinor: -1000,
    currency: fallbackCurrency,
    suggestedEntityId: defaultEntityId,
    suggestedAccountId: defaultAccount?.id ?? null,
    entryKind: "expense",
    confidenceBps: 5000,
    status: "pending",
    rawJson: JSON.stringify({ filename: meta.filename, mime: meta.mime, size: meta.size, base64Bytes: b64.length }),
  });

  await db
    .update(ingestItems)
    .set({
      ingestState: "needs_review",
      detectedInstitution: meta.mime === "application/pdf" ? "PDF Document" : "Receipt Image",
      detectedCurrency: fallbackCurrency,
      proposalCount: 1,
    })
    .where({ id: item.id });
});

// Daily check: advance nextDueOn for overdue auto-pay recurring items.
export const advanceRecurringSchedules = cron("0 7 * * *", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const active = await db.query.recurringItems.findMany({ where: { scheduleState: "active" }, limit: 200 });
  for (const item of active) {
    if (item.nextDueOn < today && item.autoPay) {
      const base = new Date(`${item.nextDueOn}T00:00:00Z`);
      const nextMs =
        item.cadence === "weekly"
          ? base.getTime() + 7 * 86_400_000
          : item.cadence === "monthly"
            ? base.getTime() + 30 * 86_400_000
            : item.cadence === "quarterly"
              ? base.getTime() + 90 * 86_400_000
              : base.getTime() + 365 * 86_400_000;
      await db
        .update(recurringItems)
        .set({ nextDueOn: new Date(nextMs).toISOString().slice(0, 10) })
        .where({ id: item.id });
    }
  }
});

// ---------------------------------------------------------------------------
// Inbox & Proposal Mutations
// ---------------------------------------------------------------------------

export const registerUpload = mutation(
  { access: "authenticated" },
  async ({
    fileId,
    filename,
    mime,
    entityId,
    accountId,
  }: {
    fileId: number;
    filename: string;
    mime?: string;
    entityId?: number;
    accountId?: number;
  }) => {
    if (!Number.isInteger(fileId) || fileId <= 0) {
      throw new HttpError(422, "invalid_input", "fileId must be a positive integer", "/fileId");
    }
    const cleanName = filename.trim() || `upload-${fileId}`;
    const m = (mime ?? "").toLowerCase();
    const sourceKind =
      m === "text/csv" || m === "text/plain"
        ? "bank_csv"
        : m === "application/pdf"
          ? "credit_card_pdf"
          : m.startsWith("image/")
            ? "receipt_image"
            : "other";
    const slugVal = `${slugify(cleanName)}-${String(Date.now())}`;
    const [created] = await db
      .insert(ingestItems)
      .values({
        title: cleanName,
        slug: slugVal,
        fileId,
        entityId: entityId && entityId > 0 ? entityId : null,
        accountId: accountId && accountId > 0 ? accountId : null,
        sourceKind,
        ingestState: "uploaded",
        proposalCount: 0,
      })
      .returning();
    if (!created) throw new HttpError(500, "internal", "Could not create inbox item.");
    await processIngestItem.enqueue({ ingestItemId: created.id }, { key: `ingest-${created.id}` });
    return { id: created.id, slug: created.slug, title: created.title };
  },
);

async function applyOneProposal(proposalId: number): Promise<number> {
  const prop = await db.query.ingestProposals.findFirst({ where: { id: proposalId } });
  if (!prop) throw new HttpError(404, "not_found", `Proposal ${proposalId} not found.`);
  if (prop.status === "applied" && prop.appliedEntryId) return prop.appliedEntryId;

  const account = prop.suggestedAccountId
    ? await db.query.accounts.findFirst({ where: { id: prop.suggestedAccountId } })
    : await db.query.accounts.findFirst({ orderBy: { id: "asc" } });
  if (!account) {
    throw new HttpError(422, "missing_account", "Create or seed at least one account before applying proposals.");
  }

  const settings = await db.globals.financeSettings.get();
  const rateMicros = await lookupRateMicros(prop.currency, settings.baseCurrency);
  const baseAmountMinor = convertToBaseMinor(prop.amountMinor, rateMicros);

  let installmentPlanId: number | null = null;
  const instCount = prop.installmentCount;
  if (prop.targetKind === "installment" && instCount !== null && instCount >= 2) {
    const monthlyMinor = Math.round(Math.abs(prop.amountMinor) / instCount);
    const [plan] = await db
      .insert(installmentPlans)
      .values({
        entityId: prop.suggestedEntityId ?? account.entityId,
        accountId: account.id,
        categoryId: prop.suggestedCategoryId,
        merchant: prop.merchantRaw ?? prop.description,
        totalMinor: Math.abs(prop.amountMinor),
        currency: prop.currency,
        totalInstallments: instCount,
        paidInstallments: 1,
        monthlyMinor,
        startedOn: prop.postedOn,
        status: "active",
      })
      .returning();
    if (plan) installmentPlanId = plan.id;
  }

  const [entry] = await db
    .insert(entries)
    .values({
      entityId: prop.suggestedEntityId ?? account.entityId,
      accountId: account.id,
      categoryId: prop.suggestedCategoryId,
      installmentPlanId,
      postedOn: prop.postedOn,
      description: prop.description,
      merchantRaw: prop.merchantRaw,
      amountMinor: prop.amountMinor,
      currency: prop.currency,
      baseAmountMinor,
      fxRateMicros: rateMicros,
      entryKind: prop.entryKind,
      isPending: false,
      reviewStatus: "reviewed",
      excludeFromBudget: prop.entryKind === "transfer" || prop.entryKind === "fx_conversion",
      excludeFromTotals: prop.entryKind === "transfer" || prop.entryKind === "fx_conversion",
    })
    .returning();
  if (!entry) throw new HttpError(500, "internal", "Could not create ledger entry.");

  await db
    .update(accounts)
    .set({ balanceMinor: account.balanceMinor + prop.amountMinor })
    .where({ id: account.id });

  await db
    .update(ingestProposals)
    .set({ status: "applied", appliedEntryId: entry.id })
    .where({ id: prop.id });

  // If all proposals on this ingest item are resolved, mark the item applied.
  const remaining = await db.query.ingestProposals.findFirst({
    where: { ingestItemId: prop.ingestItemId, status: "pending" },
  });
  if (!remaining) {
    await db.update(ingestItems).set({ ingestState: "applied" }).where({ id: prop.ingestItemId });
  }
  return entry.id;
}

export const approveProposal = mutation({ access: "editor" }, async ({ proposalId }: { proposalId: number }) => {
  if (!Number.isInteger(proposalId)) throw new HttpError(422, "invalid_input", "proposalId must be an integer");
  const entryId = await applyOneProposal(proposalId);
  return { proposalId, entryId, status: "applied" };
});

export const rejectProposal = mutation({ access: "editor" }, async ({ proposalId }: { proposalId: number }) => {
  if (!Number.isInteger(proposalId)) throw new HttpError(422, "invalid_input", "proposalId must be an integer");
  const prop = await db.query.ingestProposals.findFirst({ where: { id: proposalId } });
  if (!prop) throw new HttpError(404, "not_found", `Proposal ${proposalId} not found.`);
  await db.update(ingestProposals).set({ status: "rejected" }).where({ id: proposalId });
  const remaining = await db.query.ingestProposals.findFirst({
    where: { ingestItemId: prop.ingestItemId, status: "pending" },
  });
  if (!remaining) {
    await db.update(ingestItems).set({ ingestState: "applied" }).where({ id: prop.ingestItemId });
  }
  return { proposalId, status: "rejected" };
});

export const applyAllProposals = mutation({ access: "editor" }, async ({ ingestItemId }: { ingestItemId: number }) => {
  if (!Number.isInteger(ingestItemId)) throw new HttpError(422, "invalid_input", "ingestItemId must be an integer");
  const pending = await db.query.ingestProposals.findMany({
    where: { ingestItemId, status: "pending" },
    limit: 500,
  });
  let applied = 0;
  for (const p of pending) {
    await applyOneProposal(p.id);
    applied += 1;
  }
  await db.update(ingestItems).set({ ingestState: "applied" }).where({ id: ingestItemId });
  return { ingestItemId, applied };
});

// ---------------------------------------------------------------------------
// Ledger & Transfer Mutations
// ---------------------------------------------------------------------------

export const recordEntry = mutation(
  { access: "editor" },
  async ({
    accountId,
    categoryId,
    postedOn,
    description,
    amount,
    entryKind,
    isPending,
    notes,
  }: {
    accountId: string | number;
    categoryId?: string | number;
    postedOn: string;
    description: string;
    amount: string;
    entryKind?: EntryKind;
    isPending?: string | boolean;
    notes?: string;
  }) => {
    const acctNum = Number(accountId);
    if (!Number.isInteger(acctNum) || acctNum <= 0) {
      throw new HttpError(422, "invalid_input", "Select a valid account.", "/accountId");
    }
    const account = await db.query.accounts.findFirst({ where: { id: acctNum } });
    if (!account) throw new HttpError(404, "not_found", "Account not found.");
    const amountMinor = parseDecimalToMinor(amount);
    if (amountMinor === null || amountMinor === 0) {
      throw new HttpError(422, "invalid_input", "Enter a non-zero amount (use negative for expenses).", "/amount");
    }
    const cleanDesc = description.trim();
    if (cleanDesc === "") throw new HttpError(422, "invalid_input", "Description is required.", "/description");
    const catNum = categoryId ? Number(categoryId) : 0;
    const cat = Number.isInteger(catNum) && catNum > 0
      ? await db.query.categories.findFirst({ where: { id: catNum } })
      : null;

    const settings = await db.globals.financeSettings.get();
    const rateMicros = await lookupRateMicros(account.currency, settings.baseCurrency);
    const baseAmountMinor = convertToBaseMinor(amountMinor, rateMicros);
    const kind = entryKind ?? (amountMinor > 0 ? "income" : "expense");
    const pendingBool = isPending === true || isPending === "true" || isPending === "on" || isPending === "1";
    const vatAmountMinor =
      cat && cat.vatRateBps > 0 ? Math.round((Math.abs(amountMinor) * cat.vatRateBps) / (10_000 + cat.vatRateBps)) : null;

    const [created] = await db
      .insert(entries)
      .values({
        entityId: account.entityId,
        accountId: account.id,
        categoryId: cat?.id ?? null,
        postedOn: /^\d{4}-\d{2}-\d{2}$/.test(postedOn) ? postedOn : new Date().toISOString().slice(0, 10),
        description: cleanDesc,
        merchantRaw: cleanDesc.slice(0, 120),
        amountMinor,
        currency: account.currency,
        baseAmountMinor,
        fxRateMicros: rateMicros,
        entryKind: kind,
        isPending: pendingBool,
        reviewStatus: "reviewed",
        excludeFromBudget: Boolean(cat?.excludeFromBudget) || kind === "transfer" || kind === "fx_conversion",
        excludeFromTotals: Boolean(cat?.excludeFromTotals) || kind === "transfer" || kind === "fx_conversion",
        vatAmountMinor,
        notes: notes?.trim() || null,
      })
      .returning();
    if (!created) throw new HttpError(500, "internal", "Could not save entry.");

    await db
      .update(accounts)
      .set({ balanceMinor: account.balanceMinor + amountMinor })
      .where({ id: account.id });

    return { id: created.id };
  },
);

export const recordTransfer = mutation(
  { access: "editor" },
  async ({
    fromAccountId,
    toAccountId,
    fromAmount,
    toAmount,
    feeAmount,
    executedOn,
    transferKind,
    reference,
  }: {
    fromAccountId: string | number;
    toAccountId: string | number;
    fromAmount: string;
    toAmount?: string;
    feeAmount?: string;
    executedOn: string;
    transferKind?: TransferKind;
    reference?: string;
  }) => {
    const fromId = Number(fromAccountId);
    const toId = Number(toAccountId);
    if (!Number.isInteger(fromId) || !Number.isInteger(toId) || fromId === toId) {
      throw new HttpError(422, "invalid_input", "Choose two different accounts.");
    }
    const fromAcc = await db.query.accounts.findFirst({ where: { id: fromId } });
    const toAcc = await db.query.accounts.findFirst({ where: { id: toId } });
    if (!fromAcc || !toAcc) throw new HttpError(404, "not_found", "Source or destination account not found.");

    const fromMinorRaw = parseDecimalToMinor(fromAmount);
    if (fromMinorRaw === null || fromMinorRaw === 0) {
      throw new HttpError(422, "invalid_input", "Enter a positive source amount.", "/fromAmount");
    }
    const fromMinor = Math.abs(fromMinorRaw);
    const toMinorParsed = toAmount && toAmount.trim() !== "" ? parseDecimalToMinor(toAmount) : fromMinor;
    const toMinor = Math.abs(toMinorParsed ?? fromMinor);
    const feeMinor = feeAmount && feeAmount.trim() !== "" ? Math.abs(parseDecimalToMinor(feeAmount) ?? 0) : 0;
    const fxRateMicros = fromMinor > 0 ? Math.round((toMinor * 1_000_000) / fromMinor) : 1_000_000;
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(executedOn) ? executedOn : new Date().toISOString().slice(0, 10);

    const inferredKind: TransferKind =
      fromAcc.entityId !== toAcc.entityId
        ? "inter_entity"
        : fromAcc.currency !== toAcc.currency
          ? "fx_conversion"
          : toAcc.accountType === "credit_card"
            ? "card_payment"
            : "same_currency";
    const resolvedKind = transferKind ?? inferredKind;

    const [transfer] = await db
      .insert(transfers)
      .values({
        transferKind: resolvedKind,
        fromAccountId: fromAcc.id,
        toAccountId: toAcc.id,
        fromAmountMinor: fromMinor,
        fromCurrency: fromAcc.currency,
        toAmountMinor: toMinor,
        toCurrency: toAcc.currency,
        feeMinor,
        fxRateMicros,
        executedOn: isoDate,
        reference: reference?.trim() || null,
      })
      .returning();
    if (!transfer) throw new HttpError(500, "internal", "Could not create transfer.");

    const settings = await db.globals.financeSettings.get();
    const fromBaseRate = await lookupRateMicros(fromAcc.currency, settings.baseCurrency);
    const toBaseRate = await lookupRateMicros(toAcc.currency, settings.baseCurrency);
    const entryKind =
      resolvedKind === "fx_conversion"
        ? "fx_conversion"
        : resolvedKind === "card_payment"
          ? "card_payment"
          : resolvedKind === "inter_entity"
            ? "inter_entity"
            : "transfer";

    await db.insert(entries).values({
      entityId: fromAcc.entityId,
      accountId: fromAcc.id,
      transferId: transfer.id,
      postedOn: isoDate,
      description: `Transfer to ${toAcc.name}`,
      amountMinor: -(fromMinor + feeMinor),
      currency: fromAcc.currency,
      baseAmountMinor: convertToBaseMinor(-(fromMinor + feeMinor), fromBaseRate),
      fxRateMicros: fromBaseRate,
      entryKind,
      reviewStatus: "reviewed",
      excludeFromBudget: true,
      excludeFromTotals: true,
      notes: reference?.trim() || null,
    });
    await db.insert(entries).values({
      entityId: toAcc.entityId,
      accountId: toAcc.id,
      transferId: transfer.id,
      postedOn: isoDate,
      description: `Transfer from ${fromAcc.name}`,
      amountMinor: toMinor,
      currency: toAcc.currency,
      baseAmountMinor: convertToBaseMinor(toMinor, toBaseRate),
      fxRateMicros: toBaseRate,
      entryKind,
      reviewStatus: "reviewed",
      excludeFromBudget: true,
      excludeFromTotals: true,
      notes: reference?.trim() || null,
    });

    await db
      .update(accounts)
      .set({ balanceMinor: fromAcc.balanceMinor - fromMinor - feeMinor })
      .where({ id: fromAcc.id });
    await db
      .update(accounts)
      .set({ balanceMinor: toAcc.balanceMinor + toMinor })
      .where({ id: toAcc.id });

    return { id: transfer.id, kind: resolvedKind };
  },
);

export const setReviewStatus = mutation(
  { access: "editor" },
  async ({
    entryId,
    reviewStatus,
    excludeFromBudget,
    excludeFromTotals,
    categoryId,
  }: {
    entryId: number;
    reviewStatus?: "unreviewed" | "reviewed" | "flagged";
    excludeFromBudget?: boolean;
    excludeFromTotals?: boolean;
    categoryId?: number | null;
  }) => {
    if (!Number.isInteger(entryId)) throw new HttpError(422, "invalid_input", "entryId must be an integer");
    const existing = await db.query.entries.findFirst({ where: { id: entryId } });
    if (!existing) throw new HttpError(404, "not_found", `Entry ${entryId} not found.`);
    const [updated] = await db
      .update(entries)
      .set({
        reviewStatus: reviewStatus ?? existing.reviewStatus,
        excludeFromBudget: excludeFromBudget ?? existing.excludeFromBudget,
        excludeFromTotals: excludeFromTotals ?? existing.excludeFromTotals,
        categoryId: categoryId === undefined ? existing.categoryId : categoryId,
      })
      .where({ id: entryId })
      .returning();
    if (!updated) throw new HttpError(404, "not_found", `Entry ${entryId} not found.`);
    return {
      id: updated.id,
      reviewStatus: updated.reviewStatus,
      excludeFromBudget: updated.excludeFromBudget,
      excludeFromTotals: updated.excludeFromTotals,
    };
  },
);

// ---------------------------------------------------------------------------
// Unified Internal & External Reimbursements Mutations
// ---------------------------------------------------------------------------

export const createReimbursementClaim = mutation(
  { access: "editor" },
  async ({
    title,
    payerKind,
    businessEntityId,
    counterpartyPayeeId,
    newCounterpartyName,
    reimburseToAccountId,
    currency,
    externalRef,
    notes,
  }: {
    title: string;
    payerKind?: PayerKind;
    businessEntityId?: string | number;
    counterpartyPayeeId?: string | number;
    newCounterpartyName?: string;
    reimburseToAccountId?: string | number;
    currency?: Currency;
    externalRef?: string;
    notes?: string;
  }) => {
    const cleanTitle = title.trim();
    if (cleanTitle === "") {
      throw new HttpError(422, "invalid_input", "Claim title is required.", "/title");
    }
    const kind: PayerKind = payerKind === "internal_entity" ? "internal_entity" : "external_counterparty";
    const settings = await db.globals.financeSettings.get();
    const resolvedCurrency: Currency = currency ?? settings.baseCurrency;

    let resolvedEntityId: number | null = null;
    let resolvedPayeeId: number | null = null;

    if (kind === "internal_entity") {
      const entNum = businessEntityId ? Number(businessEntityId) : 0;
      if (!Number.isInteger(entNum) || entNum <= 0) {
        throw new HttpError(422, "invalid_input", "Select the internal legal entity paying this reimbursement.", "/businessEntityId");
      }
      const entity = await db.query.legalEntities.findFirst({ where: { id: entNum } });
      if (!entity) throw new HttpError(404, "not_found", "Business entity not found.");
      resolvedEntityId = entity.id;
    } else {
      const payeeNum = counterpartyPayeeId ? Number(counterpartyPayeeId) : 0;
      const cleanNewName = (newCounterpartyName ?? "").trim();
      if (cleanNewName !== "") {
        const slugVal = slugify(cleanNewName);
        const existingPayee = await db.query.payees.findFirst({ where: { slug: slugVal } });
        if (existingPayee) {
          resolvedPayeeId = existingPayee.id;
        } else {
          const [createdPayee] = await db
            .insert(payees)
            .values({ name: cleanNewName, slug: slugVal })
            .returning();
          if (createdPayee) resolvedPayeeId = createdPayee.id;
        }
      } else if (Number.isInteger(payeeNum) && payeeNum > 0) {
        const payee = await db.query.payees.findFirst({ where: { id: payeeNum } });
        if (!payee) throw new HttpError(404, "not_found", "Counterparty payee not found.");
        resolvedPayeeId = payee.id;
      } else {
        throw new HttpError(
          422,
          "invalid_input",
          "Select an external payer (e.g. Automattic Inc.) or enter a new counterparty name.",
          "/counterpartyPayeeId",
        );
      }
    }

    const toAccNum = reimburseToAccountId ? Number(reimburseToAccountId) : 0;
    const resolvedToAccId = Number.isInteger(toAccNum) && toAccNum > 0 ? toAccNum : null;

    const [created] = await db
      .insert(reimbursementClaims)
      .values({
        title: cleanTitle,
        payerKind: kind,
        businessEntityId: resolvedEntityId,
        counterpartyPayeeId: resolvedPayeeId,
        reimburseToAccountId: resolvedToAccId,
        claimState: "draft",
        currency: resolvedCurrency,
        totalMinor: 0,
        fxVarianceMinor: 0,
        externalRef: externalRef?.trim() || null,
        notes: notes?.trim() || null,
      })
      .returning();
    if (!created) throw new HttpError(500, "internal", "Could not create reimbursement claim.");
    return { id: created.id, payerKind: created.payerKind };
  },
);

export const addReimbursementLine = mutation(
  { access: "editor" },
  async ({
    claimId,
    sourceEntryId,
    splitPercent,
    businessCategoryId,
    notes,
  }: {
    claimId: string | number;
    sourceEntryId: string | number;
    splitPercent?: string | number;
    businessCategoryId?: string | number;
    notes?: string;
  }) => {
    const cid = Number(claimId);
    const eid = Number(sourceEntryId);
    if (!Number.isInteger(cid) || cid <= 0) throw new HttpError(422, "invalid_input", "Invalid claimId.");
    if (!Number.isInteger(eid) || eid <= 0) throw new HttpError(422, "invalid_input", "Select a source expense entry.");

    const claim = await db.query.reimbursementClaims.findFirst({ where: { id: cid } });
    if (!claim) throw new HttpError(404, "not_found", `Claim #${cid} not found.`);
    if (claim.claimState === "paid") {
      throw new HttpError(409, "already_paid", "Cannot add lines to a claim that has already been settled.");
    }
    const entry = await db.query.entries.findFirst({ where: { id: eid } });
    if (!entry) throw new HttpError(404, "not_found", `Source entry #${eid} not found.`);

    const pctRaw = splitPercent !== undefined && String(splitPercent).trim() !== "" ? Number(splitPercent) : 100;
    const pct = Number.isFinite(pctRaw) && pctRaw > 0 && pctRaw <= 100 ? pctRaw : 100;
    const splitBps = Math.max(1, Math.min(10_000, Math.round(pct * 100)));

    const reimbursableMinor = Math.round((Math.abs(entry.amountMinor) * splitBps) / 10_000);
    if (reimbursableMinor <= 0) {
      throw new HttpError(422, "invalid_input", "Reimbursable amount must be greater than zero.");
    }

    const settings = await db.globals.financeSettings.get();
    const rateToBase = await lookupRateMicros(entry.currency, settings.baseCurrency);
    const baseMinor = convertToBaseMinor(reimbursableMinor, rateToBase);

    const catNum = businessCategoryId ? Number(businessCategoryId) : 0;
    const resolvedCatId = Number.isInteger(catNum) && catNum > 0 ? catNum : null;

    const [line] = await db
      .insert(reimbursementLines)
      .values({
        claimId: claim.id,
        sourceEntryId: entry.id,
        businessCategoryId: resolvedCatId,
        splitBps,
        reimbursableMinor,
        currency: entry.currency,
        baseMinor,
        receiptFileId: entry.receiptFileId,
        notes: notes?.trim() || null,
      })
      .returning();
    if (!line) throw new HttpError(500, "internal", "Could not add reimbursement line.");

    // Exclude 100% reimbursed personal out-of-pocket expenses from personal budget metrics.
    if (splitBps === 10_000 && !entry.excludeFromBudget) {
      await db.update(entries).set({ excludeFromBudget: true }).where({ id: entry.id });
    }

    // Recompute claim total in claim.currency across all lines.
    const allLines = await db.query.reimbursementLines.findMany({ where: { claimId: claim.id }, limit: 200 });
    let totalMinor = 0;
    for (const l of allLines) {
      const rateToClaim = await lookupRateMicros(l.currency, claim.currency);
      totalMinor += convertToBaseMinor(l.reimbursableMinor, rateToClaim);
    }
    await db.update(reimbursementClaims).set({ totalMinor }).where({ id: claim.id });

    return { id: line.id, claimId: claim.id, totalMinor };
  },
);

export const updateReimbursementState = mutation(
  { access: "editor" },
  async ({
    claimId,
    claimState,
  }: {
    claimId: number;
    claimState: "draft" | "submitted" | "approved" | "rejected";
  }) => {
    if (!Number.isInteger(claimId) || claimId <= 0) {
      throw new HttpError(422, "invalid_input", "claimId must be a positive integer.");
    }
    const claim = await db.query.reimbursementClaims.findFirst({ where: { id: claimId } });
    if (!claim) throw new HttpError(404, "not_found", `Claim #${claimId} not found.`);
    if (claim.claimState === "paid") {
      throw new HttpError(409, "already_paid", "Settled reimbursement claims cannot change workflow state.");
    }
    const today = new Date().toISOString().slice(0, 10);
    const submittedOn = claimState === "submitted" && claim.submittedOn === null ? today : claim.submittedOn;
    await db
      .update(reimbursementClaims)
      .set({ claimState, submittedOn })
      .where({ id: claim.id });
    return { id: claim.id, claimState };
  },
);

export const settleReimbursementClaim = mutation(
  { access: "editor" },
  async ({
    claimId,
    paidOn,
    fromBusinessAccountId,
    toAccountId,
    payoutAmount,
    existingPayoutEntryId,
    reference,
  }: {
    claimId: string | number;
    paidOn?: string;
    fromBusinessAccountId?: string | number;
    toAccountId?: string | number;
    payoutAmount?: string;
    existingPayoutEntryId?: string | number;
    reference?: string;
  }): Promise<{
    id: number;
    claimState: string;
    payoutTransferId: number | null;
    payoutEntryId: number | null;
    reimbursedBaseMinor: number;
    fxVarianceMinor: number;
  }> => {
    const cid = Number(claimId);
    if (!Number.isInteger(cid) || cid <= 0) throw new HttpError(422, "invalid_input", "Invalid claimId.");
    const claim = await db.query.reimbursementClaims.findFirst({ where: { id: cid } });
    if (!claim) throw new HttpError(404, "not_found", `Claim #${cid} not found.`);
    if (claim.claimState === "paid") {
      throw new HttpError(409, "already_paid", "This claim has already been settled.");
    }

    const lines = await db.query.reimbursementLines.findMany({ where: { claimId: claim.id }, limit: 200 });
    if (lines.length === 0) {
      throw new HttpError(422, "empty_claim", "Attach at least one expense line before settling this claim.");
    }

    const settings = await db.globals.financeSettings.get();
    const paidOnStr = (paidOn ?? "").trim();
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(paidOnStr) ? paidOnStr : new Date().toISOString().slice(0, 10);
    const cleanRef = reference?.trim() || claim.externalRef || `REIMB-${claim.id}`;
    const payoutAmountStr = (payoutAmount ?? "").trim();

    let claimedBaseMinor = 0;
    for (const l of lines) {
      claimedBaseMinor += l.baseMinor;
    }

    const toAccNum = toAccountId ? Number(toAccountId) : (claim.reimburseToAccountId ?? 0);

    if (claim.payerKind === "internal_entity") {
      const businessEntityId = claim.businessEntityId;
      if (businessEntityId === null) {
        throw new HttpError(422, "missing_entity", "Internal reimbursement claim is missing a business entity.");
      }
      const fromAccNum = fromBusinessAccountId ? Number(fromBusinessAccountId) : 0;
      if (!Number.isInteger(fromAccNum) || fromAccNum <= 0) {
        throw new HttpError(422, "invalid_input", "Select the business bank account paying this claim.", "/fromBusinessAccountId");
      }
      if (!Number.isInteger(toAccNum) || toAccNum <= 0) {
        throw new HttpError(422, "invalid_input", "Select the personal account receiving the payout.", "/toAccountId");
      }
      const fromAcc = await db.query.accounts.findFirst({ where: { id: fromAccNum } });
      const toAcc = await db.query.accounts.findFirst({ where: { id: toAccNum } });
      if (!fromAcc || !toAcc) throw new HttpError(404, "not_found", "Payout source or destination account not found.");
      if (fromAcc.id === toAcc.id) {
        throw new HttpError(422, "invalid_input", "Business paying account and personal receiving account must differ.");
      }

      const defaultToRate = await lookupRateMicros(claim.currency, toAcc.currency);
      const parsedPayout = payoutAmountStr !== "" ? parseDecimalToMinor(payoutAmountStr) : null;
      const payoutToMinor =
        parsedPayout !== null && parsedPayout !== 0
          ? Math.abs(parsedPayout)
          : convertToBaseMinor(claim.totalMinor, defaultToRate);
      const toToFromRate = await lookupRateMicros(toAcc.currency, fromAcc.currency);
      const payoutFromMinor = convertToBaseMinor(payoutToMinor, toToFromRate);
      const transferFxRateMicros =
        payoutFromMinor > 0 ? Math.round((payoutToMinor * 1_000_000) / payoutFromMinor) : 1_000_000;

      // 1. Book deductible business expense entries for each line on the business entity (without double-subtracting cash).
      for (const l of lines) {
        const src = await db.query.entries.findFirst({ where: { id: l.sourceEntryId } });
        const bizCat = l.businessCategoryId
          ? await db.query.categories.findFirst({ where: { id: l.businessCategoryId } })
          : null;
        const rateToFrom = await lookupRateMicros(l.currency, fromAcc.currency);
        const lineFromMinor = convertToBaseMinor(l.reimbursableMinor, rateToFrom);
        const vatAmountMinor =
          bizCat && bizCat.vatRateBps > 0
            ? Math.round((lineFromMinor * bizCat.vatRateBps) / (10_000 + bizCat.vatRateBps))
            : null;
        await db.insert(entries).values({
          entityId: businessEntityId,
          accountId: fromAcc.id,
          categoryId: bizCat?.id ?? null,
          postedOn: isoDate,
          description: `Reimbursed: ${src?.description ?? claim.title}`,
          merchantRaw: src?.merchantRaw ?? claim.title.slice(0, 120),
          amountMinor: -lineFromMinor,
          currency: fromAcc.currency,
          baseAmountMinor: -l.baseMinor,
          fxRateMicros: await lookupRateMicros(fromAcc.currency, settings.baseCurrency),
          entryKind: "expense",
          reviewStatus: "reviewed",
          excludeFromBudget: false,
          excludeFromTotals: true,
          vatAmountMinor,
          receiptFileId: l.receiptFileId,
          tagsJson: ["reimbursed-internal"],
          externalRef: cleanRef,
          notes: `Internal reimbursement claim #${claim.id} (from personal entry #${l.sourceEntryId})`,
        });
      }

      // 2. Create atomic inter-entity transfer and move account balances.
      const [transfer] = await db
        .insert(transfers)
        .values({
          transferKind: "inter_entity",
          fromAccountId: fromAcc.id,
          toAccountId: toAcc.id,
          fromAmountMinor: payoutFromMinor,
          fromCurrency: fromAcc.currency,
          toAmountMinor: payoutToMinor,
          toCurrency: toAcc.currency,
          feeMinor: 0,
          fxRateMicros: transferFxRateMicros,
          executedOn: isoDate,
          reference: cleanRef,
          notes: `Reimbursement settlement for claim #${claim.id}: ${claim.title}`,
        })
        .returning();
      if (!transfer) throw new HttpError(500, "internal", "Could not create reimbursement transfer.");

      const fromBaseRate = await lookupRateMicros(fromAcc.currency, settings.baseCurrency);
      const toBaseRate = await lookupRateMicros(toAcc.currency, settings.baseCurrency);
      const reimbursedBaseMinor = convertToBaseMinor(payoutToMinor, toBaseRate);
      const fxVarianceMinor = reimbursedBaseMinor - claimedBaseMinor;

      await db.insert(entries).values({
        entityId: fromAcc.entityId,
        accountId: fromAcc.id,
        transferId: transfer.id,
        postedOn: isoDate,
        description: `Reimbursement transfer to ${toAcc.name}`,
        amountMinor: -payoutFromMinor,
        currency: fromAcc.currency,
        baseAmountMinor: convertToBaseMinor(-payoutFromMinor, fromBaseRate),
        fxRateMicros: fromBaseRate,
        entryKind: "inter_entity",
        reviewStatus: "reviewed",
        excludeFromBudget: true,
        excludeFromTotals: true,
        externalRef: cleanRef,
      });
      await db.insert(entries).values({
        entityId: toAcc.entityId,
        accountId: toAcc.id,
        transferId: transfer.id,
        postedOn: isoDate,
        description: `Reimbursement from ${fromAcc.name}`,
        amountMinor: payoutToMinor,
        currency: toAcc.currency,
        baseAmountMinor: reimbursedBaseMinor,
        fxRateMicros: toBaseRate,
        entryKind: "inter_entity",
        reviewStatus: "reviewed",
        excludeFromBudget: true,
        excludeFromTotals: true,
        externalRef: cleanRef,
      });

      await db.update(accounts).set({ balanceMinor: fromAcc.balanceMinor - payoutFromMinor }).where({ id: fromAcc.id });
      await db.update(accounts).set({ balanceMinor: toAcc.balanceMinor + payoutToMinor }).where({ id: toAcc.id });

      await db
        .update(reimbursementClaims)
        .set({
          claimState: "paid",
          paidOn: isoDate,
          payoutTransferId: transfer.id,
          reimburseToAccountId: toAcc.id,
          reimbursedBaseMinor,
          fxVarianceMinor,
        })
        .where({ id: claim.id });

      return {
        id: claim.id,
        claimState: "paid",
        payoutTransferId: transfer.id,
        payoutEntryId: null,
        reimbursedBaseMinor,
        fxVarianceMinor,
      };
    }

    // External counterparty reimbursement (e.g., Automattic Inc., clients, conferences):
    // Link an existing incoming deposit OR create a new positive reimbursement deposit entry.
    const existingEntryNum = existingPayoutEntryId ? Number(existingPayoutEntryId) : 0;
    let payoutEntryId = 0;
    let reimbursedBaseMinor = 0;
    let settledAccountId = claim.reimburseToAccountId;

    if (Number.isInteger(existingEntryNum) && existingEntryNum > 0) {
      const deposit = await db.query.entries.findFirst({ where: { id: existingEntryNum } });
      if (!deposit) throw new HttpError(404, "not_found", `Deposit entry #${existingEntryNum} not found.`);
      if (deposit.amountMinor <= 0) {
        throw new HttpError(422, "invalid_input", "Linked payout deposit must be a positive inflow entry.");
      }
      await db
        .update(entries)
        .set({
          entryKind: "reimbursement",
          excludeFromBudget: true,
          payeeId: claim.counterpartyPayeeId ?? deposit.payeeId,
        })
        .where({ id: deposit.id });
      payoutEntryId = deposit.id;
      reimbursedBaseMinor = deposit.baseAmountMinor;
      settledAccountId = deposit.accountId;
    } else {
      if (!Number.isInteger(toAccNum) || toAccNum <= 0) {
        throw new HttpError(422, "invalid_input", "Select the bank account where the reimbursement deposit landed.", "/toAccountId");
      }
      const toAcc = await db.query.accounts.findFirst({ where: { id: toAccNum } });
      if (!toAcc) throw new HttpError(404, "not_found", "Destination account not found.");

      const defaultToRate = await lookupRateMicros(claim.currency, toAcc.currency);
      const parsedPayout = payoutAmountStr !== "" ? parseDecimalToMinor(payoutAmountStr) : null;
      const payoutToMinor =
        parsedPayout !== null && parsedPayout !== 0
          ? Math.abs(parsedPayout)
          : convertToBaseMinor(claim.totalMinor, defaultToRate);
      const toBaseRate = await lookupRateMicros(toAcc.currency, settings.baseCurrency);
      reimbursedBaseMinor = convertToBaseMinor(payoutToMinor, toBaseRate);

      const payee = claim.counterpartyPayeeId
        ? await db.query.payees.findFirst({ where: { id: claim.counterpartyPayeeId } })
        : null;
      const [deposit] = await db
        .insert(entries)
        .values({
          entityId: toAcc.entityId,
          accountId: toAcc.id,
          payeeId: claim.counterpartyPayeeId,
          postedOn: isoDate,
          description: `Reimbursement payout: ${claim.title}`,
          merchantRaw: (payee?.name ?? "External Reimbursement").slice(0, 120),
          amountMinor: payoutToMinor,
          currency: toAcc.currency,
          baseAmountMinor: reimbursedBaseMinor,
          fxRateMicros: toBaseRate,
          entryKind: "reimbursement",
          reviewStatus: "reviewed",
          excludeFromBudget: true,
          excludeFromTotals: false,
          tagsJson: ["reimbursement"],
          externalRef: cleanRef,
          notes: `Settled external reimbursement claim #${claim.id}`,
        })
        .returning();
      if (!deposit) throw new HttpError(500, "internal", "Could not create reimbursement deposit entry.");
      await db.update(accounts).set({ balanceMinor: toAcc.balanceMinor + payoutToMinor }).where({ id: toAcc.id });
      payoutEntryId = deposit.id;
      settledAccountId = toAcc.id;
    }

    const fxVarianceMinor = reimbursedBaseMinor - claimedBaseMinor;
    await db
      .update(reimbursementClaims)
      .set({
        claimState: "paid",
        paidOn: isoDate,
        payoutEntryId,
        reimburseToAccountId: settledAccountId,
        reimbursedBaseMinor,
        fxVarianceMinor,
      })
      .where({ id: claim.id });

    return {
      id: claim.id,
      claimState: "paid",
      payoutTransferId: null,
      payoutEntryId,
      reimbursedBaseMinor,
      fxVarianceMinor,
    };
  },
);

// ---------------------------------------------------------------------------
// Portfolio, Stocks & Holdings Mutations
// ---------------------------------------------------------------------------

export const createSecurity = mutation(
  { access: "editor" },
  async ({
    ticker,
    name,
    assetClass,
    currency,
    exchange,
    isin,
    unitLabel,
    lastPrice,
    initialQuantity,
    initialAvgPrice,
    initialTradeType,
    accountId,
    executedOn,
    notes,
  }: {
    ticker: string;
    name: string;
    assetClass?: AssetClass;
    currency?: Currency;
    exchange?: string;
    isin?: string;
    unitLabel?: string;
    lastPrice?: string;
    initialQuantity?: string;
    initialAvgPrice?: string;
    initialTradeType?: "buy" | "vest_grant" | "transfer_in";
    accountId?: string | number;
    executedOn?: string;
    notes?: string;
  }) => {
    const cleanTicker = ticker.trim().toUpperCase();
    const cleanName = name.trim();
    if (cleanTicker === "") throw new HttpError(422, "invalid_input", "Ticker / symbol is required.", "/ticker");
    if (cleanName === "") throw new HttpError(422, "invalid_input", "Asset name is required.", "/name");

    const settings = await db.globals.financeSettings.get();
    const resolvedCurrency: Currency = currency ?? "USD";
    const resolvedClass: AssetClass = assetClass ?? "stock";

    const cleanUnit = (unitLabel ?? "").trim() || (resolvedClass === "crypto" ? cleanTicker : "shares");
    const priceStr = (lastPrice ?? "").trim();
    const parsedPrice = priceStr !== "" ? parseDecimalToMinor(priceStr) : 0;
    const lastPriceMinor = Math.max(0, parsedPrice ?? 0);
    const today = new Date().toISOString().slice(0, 10);

    const baseSlug = slugify(cleanTicker);
    const existingSlug = await db.query.securities.findFirst({ where: { slug: baseSlug } });
    const slugVal = existingSlug ? `${baseSlug}-${String(Date.now())}` : baseSlug;

    const [created] = await db
      .insert(securities)
      .values({
        name: cleanName,
        slug: slugVal,
        ticker: cleanTicker.slice(0, 24),
        isin: (isin ?? "").trim().slice(0, 24) || null,
        exchange: (exchange ?? "").trim().toUpperCase().slice(0, 32) || null,
        unitLabel: cleanUnit.slice(0, 24),
        assetClass: resolvedClass,
        currency: resolvedCurrency,
        lastPriceMinor,
        lastPricedOn: lastPriceMinor > 0 ? today : null,
        notes: notes?.trim() || null,
      })
      .returning();
    if (!created) throw new HttpError(500, "internal", "Could not create security.");

    // Optional initial holding lot recorded inline in the same action.
    const qtyStr = (initialQuantity ?? "").trim();
    const qtyMicros = qtyStr !== "" ? parseDecimalToMicros(qtyStr) : null;
    let initialTradeId: number | null = null;
    if (qtyMicros !== null && qtyMicros > 0) {
      const acctNum = accountId ? Number(accountId) : 0;
      const acct =
        Number.isInteger(acctNum) && acctNum > 0
          ? await db.query.accounts.findFirst({ where: { id: acctNum } })
          : await db.query.accounts.findFirst({ where: { accountType: "brokerage" } }) ??
            (await db.query.accounts.findFirst({ orderBy: { id: "asc" } }));
      if (!acct) {
        throw new HttpError(422, "missing_account", "Create at least one account before recording an initial holding.");
      }
      const avgStr = (initialAvgPrice ?? "").trim();
      const parsedAvg = avgStr !== "" ? parseDecimalToMinor(avgStr) : lastPriceMinor;
      const unitCostMinor = Math.max(0, parsedAvg ?? lastPriceMinor);
      const nativeTotalMinor = Math.round((qtyMicros * unitCostMinor) / 1_000_000);
      const rateToBase = await lookupRateMicros(resolvedCurrency, settings.baseCurrency);
      const baseTotalMinor = convertToBaseMinor(nativeTotalMinor, rateToBase);
      const execStr = (executedOn ?? "").trim();
      const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(execStr) ? execStr : today;
      const tType: TradeType = initialTradeType ?? "buy";

      const [lot] = await db
        .insert(trades)
        .values({
          entityId: acct.entityId,
          accountId: acct.id,
          securityId: created.id,
          tradeType: tType,
          executedOn: isoDate,
          quantityMicros: qtyMicros,
          priceMinor: unitCostMinor,
          feeMinor: 0,
          currency: resolvedCurrency,
          baseTotalMinor,
          notes: "Initial holding",
        })
        .returning();
      if (lot) initialTradeId = lot.id;
    }

    return { id: created.id, slug: created.slug ?? slugVal, ticker: created.ticker, initialTradeId };
  },
);

export const recordTrade = mutation(
  { access: "editor" },
  async ({
    securityId,
    accountId,
    tradeType,
    executedOn,
    quantity,
    price,
    fee,
    notes,
  }: {
    securityId: string | number;
    accountId: string | number;
    tradeType?: TradeType;
    executedOn: string;
    quantity: string;
    price?: string;
    fee?: string;
    notes?: string;
  }) => {
    const secId = Number(securityId);
    const accId = Number(accountId);
    if (!Number.isInteger(secId) || secId <= 0) throw new HttpError(422, "invalid_input", "Select a security.", "/securityId");
    if (!Number.isInteger(accId) || accId <= 0) throw new HttpError(422, "invalid_input", "Select an account.", "/accountId");

    const sec = await db.query.securities.findFirst({ where: { id: secId } });
    if (!sec) throw new HttpError(404, "not_found", `Security #${secId} not found.`);
    const acc = await db.query.accounts.findFirst({ where: { id: accId } });
    if (!acc) throw new HttpError(404, "not_found", `Account #${accId} not found.`);

    const tType: TradeType = tradeType ?? "buy";

    const qtyParsed = parseDecimalToMicros(quantity);
    const qtyMicros = qtyParsed !== null ? Math.abs(qtyParsed) : 0;
    if (tType !== "dividend" && tType !== "fee" && qtyMicros <= 0) {
      throw new HttpError(422, "invalid_input", "Enter a positive quantity (e.g. 10 or 0.25).", "/quantity");
    }

    const priceStr = (price ?? "").trim();
    const priceParsed = priceStr !== "" ? parseDecimalToMinor(priceStr) : 0;
    const priceMinor = Math.max(0, priceParsed ?? 0);
    const feeStr = (fee ?? "").trim();
    const feeParsed = feeStr !== "" ? parseDecimalToMinor(feeStr) : 0;
    const feeMinor = Math.max(0, feeParsed ?? 0);

    const execStr = executedOn.trim();
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(execStr) ? execStr : new Date().toISOString().slice(0, 10);

    const settings = await db.globals.financeSettings.get();
    const rateToBase = await lookupRateMicros(sec.currency, settings.baseCurrency);
    const nativeTotalMinor =
      tType === "dividend" || tType === "fee"
        ? priceMinor
        : tType === "split"
          ? 0
          : Math.round((qtyMicros * priceMinor) / 1_000_000) + feeMinor;
    const baseTotalMinor = convertToBaseMinor(nativeTotalMinor, rateToBase);

    const [created] = await db
      .insert(trades)
      .values({
        entityId: acc.entityId,
        accountId: acc.id,
        securityId: sec.id,
        tradeType: tType,
        executedOn: isoDate,
        quantityMicros: tType === "dividend" || tType === "fee" ? 0 : qtyMicros,
        priceMinor,
        feeMinor,
        currency: sec.currency,
        baseTotalMinor,
        notes: notes?.trim() || null,
      })
      .returning();
    if (!created) throw new HttpError(500, "internal", "Could not record trade.");

    // If this buy/sell is at least as recent as the last recorded price, refresh lastPriceMinor.
    if ((tType === "buy" || tType === "sell") && priceMinor > 0 && (sec.lastPricedOn === null || isoDate >= sec.lastPricedOn)) {
      await db
        .update(securities)
        .set({ lastPriceMinor: priceMinor, lastPricedOn: isoDate })
        .where({ id: sec.id });
    }

    return { id: created.id, securityId: sec.id, tradeType: tType, baseTotalMinor };
  },
);

export const updateSecurityPrice = mutation(
  { access: "editor" },
  async ({
    securityId,
    lastPrice,
    pricedOn,
  }: {
    securityId: string | number;
    lastPrice: string;
    pricedOn?: string;
  }) => {
    const secId = Number(securityId);
    if (!Number.isInteger(secId) || secId <= 0) throw new HttpError(422, "invalid_input", "Invalid securityId.");
    const sec = await db.query.securities.findFirst({ where: { id: secId } });
    if (!sec) throw new HttpError(404, "not_found", `Security #${secId} not found.`);
    const priceMinor = parseDecimalToMinor(lastPrice);
    if (priceMinor === null || priceMinor < 0) {
      throw new HttpError(422, "invalid_input", "Enter a valid non-negative price.", "/lastPrice");
    }
    const pricedStr = (pricedOn ?? "").trim();
    const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(pricedStr) ? pricedStr : new Date().toISOString().slice(0, 10);
    await db
      .update(securities)
      .set({ lastPriceMinor: priceMinor, lastPricedOn: isoDate })
      .where({ id: sec.id });
    return { id: sec.id, ticker: sec.ticker, lastPriceMinor: priceMinor, lastPricedOn: isoDate };
  },
);

export const refreshMarketPrices = mutation({ access: "editor" }, async () => {
  const allSec = await db.query.securities.findMany({ limit: 100 });
  const today = new Date().toISOString().slice(0, 10);
  let updated = 0;
  let skipped = 0;

  for (const sec of allSec) {
    if (
      sec.assetClass === "private_equity" ||
      sec.assetClass === "rsu_option" ||
      sec.assetClass === "money_market" ||
      sec.assetClass === "other"
    ) {
      skipped += 1;
      continue;
    }
    const symbol =
      sec.assetClass === "crypto" && !sec.ticker.includes("-")
        ? `${sec.ticker}-${sec.currency}`
        : sec.ticker;
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        {
          method: "GET",
          headers: { "User-Agent": "Ledger/1.0" },
        },
      );
      if (!res.ok) {
        skipped += 1;
        continue;
      }
      const data = (await res.json()) as {
        chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> };
      };
      const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === "number" && Number.isFinite(price) && price > 0) {
        const priceMinor = Math.round(price * 100);
        await db
          .update(securities)
          .set({ lastPriceMinor: priceMinor, lastPricedOn: today })
          .where({ id: sec.id });
        updated += 1;
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  return { updated, skipped };
});

// ---------------------------------------------------------------------------
// Sharing, Invitations & Grants Mutations
// ---------------------------------------------------------------------------

export const createShareLink = mutation(
  { access: "admin" },
  async ({
    label,
    entityId,
    dateFrom,
    dateTo,
    maskCounterparties,
  }: {
    label: string;
    entityId?: string | number;
    dateFrom?: string;
    dateTo?: string;
    maskCounterparties?: string | boolean;
  }) => {
    const cleanLabel = label.trim();
    if (cleanLabel === "") throw new HttpError(422, "invalid_input", "Label is required.", "/label");
    const entNum = entityId ? Number(entityId) : 0;
    const mask =
      maskCounterparties === true || maskCounterparties === "true" || maskCounterparties === "on" || maskCounterparties === "1";
    const [created] = await db
      .insert(shareLinks)
      .values({
        label: cleanLabel,
        entityId: Number.isInteger(entNum) && entNum > 0 ? entNum : null,
        dateFrom: dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? dateFrom : null,
        dateTo: dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? dateTo : null,
        maskCounterparties: mask,
      })
      .returning();
    if (!created) throw new HttpError(500, "internal", "Could not create share link.");
    return { id: created.id, token: created.token };
  },
);

export const revokeShareLink = mutation({ access: "admin" }, async ({ linkId }: { linkId: string | number }) => {
  const id = Number(linkId);
  if (!Number.isInteger(id)) throw new HttpError(422, "invalid_input", "linkId must be an integer");
  await db.update(shareLinks).set({ revokedAt: new Date().toISOString() }).where({ id });
  return { id, revoked: true };
});

export const createInvitation = mutation(
  { access: "admin" },
  async ({
    recipientEmail,
    entityId,
    role,
    scope,
  }: {
    recipientEmail: string;
    entityId?: string | number;
    role?: "viewer" | "accountant" | "editor";
    scope?: "full" | "tax_only" | "read_only";
  }) => {
    const cleanEmail = recipientEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new HttpError(422, "invalid_input", "Enter a valid email address.", "/recipientEmail");
    }
    const entNum = entityId ? Number(entityId) : 0;
    const expiresAt = new Date(Date.now() + 14 * 86_400_000).toISOString();
    const [created] = await db
      .insert(invitations)
      .values({
        recipientEmail: cleanEmail,
        entityId: Number.isInteger(entNum) && entNum > 0 ? entNum : null,
        role: role ?? "accountant",
        scope: scope ?? "tax_only",
        status: "pending",
        expiresAt,
      })
      .returning();
    if (!created) throw new HttpError(500, "internal", "Could not create invitation.");
    return { id: created.id, token: created.token };
  },
);

export const acceptInvitation = mutation(
  { access: "authenticated" },
  async ({ token }: { token: string }, ctx) => {
    const viewer = ctx.user;
    if (!viewer) throw new HttpError(401, "unauthenticated", "Sign in to accept this invitation.");
    const inv = await db.query.invitations.findFirst({ where: { token } });
    if (!inv || inv.status !== "pending") {
      throw new HttpError(404, "not_found", "This invitation is invalid or has already been used.");
    }
    if (inv.expiresAt < new Date().toISOString()) {
      await db.update(invitations).set({ status: "expired" }).where({ id: inv.id });
      throw new HttpError(410, "expired", "This invitation has expired.");
    }
    await db.insert(grants).values({
      userId: viewer.id,
      entityId: inv.entityId,
      role: inv.role,
      scope: inv.scope,
      dateFrom: inv.dateFrom,
      dateTo: inv.dateTo,
    });
    await db
      .update(invitations)
      .set({ status: "accepted", acceptedByUserId: viewer.id })
      .where({ id: inv.id });
    return { accepted: true, role: inv.role };
  },
);

export const revokeGrant = mutation({ access: "admin" }, async ({ grantId }: { grantId: string | number }) => {
  const id = Number(grantId);
  if (!Number.isInteger(id)) throw new HttpError(422, "invalid_input", "grantId must be an integer");
  await db.update(grants).set({ revokedAt: new Date().toISOString() }).where({ id });
  return { id, revoked: true };
});

// ---------------------------------------------------------------------------
// Summary Query & One-Click Demo Seeder
// ---------------------------------------------------------------------------

export const dashboardSummary = query({ access: "authenticated" }, async () => {
  const settings = await db.globals.financeSettings.get();
  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, limit: 200 });
  const unreviewed = await db.query.entries.findMany({ where: { reviewStatus: "unreviewed" }, limit: 500 });
  const allClaims = await db.query.reimbursementClaims.findMany({ limit: 200 });
  const allSecurities = await db.query.securities.findMany({ limit: 200 });
  const allTrades = await db.query.trades.findMany({ limit: 1000 });
  let netWorthBaseMinor = 0;
  for (const a of allAccounts) {
    if (a.excludeFromTotals) continue;
    const rate = await lookupRateMicros(a.currency, settings.baseCurrency);
    netWorthBaseMinor += convertToBaseMinor(a.balanceMinor, rate);
  }
  let receivablesBaseMinor = 0;
  let openClaimsCount = 0;
  for (const c of allClaims) {
    if (c.claimState === "paid" || c.claimState === "rejected") continue;
    openClaimsCount += 1;
    if (c.payerKind === "external_counterparty") {
      const rate = await lookupRateMicros(c.currency, settings.baseCurrency);
      receivablesBaseMinor += convertToBaseMinor(c.totalMinor, rate);
    }
  }
  let portfolioMarketBaseMinor = 0;
  let holdingsCount = 0;
  for (const sec of allSecurities) {
    const secTrades = allTrades
      .filter((t) => t.securityId === sec.id)
      .map((t) => ({
        tradeType: t.tradeType,
        executedOn: t.executedOn,
        quantityMicros: t.quantityMicros,
        priceMinor: t.priceMinor,
        feeMinor: t.feeMinor,
        baseTotalMinor: t.baseTotalMinor,
      }));
    const rate = await lookupRateMicros(sec.currency, settings.baseCurrency);
    const pos = computePosition(secTrades, sec.lastPriceMinor, rate);
    if (pos.qtyMicros > 0) {
      holdingsCount += 1;
      portfolioMarketBaseMinor += pos.marketBaseMinor;
    }
  }
  return {
    baseCurrency: settings.baseCurrency,
    netWorthBaseMinor,
    receivablesBaseMinor,
    openClaimsCount,
    portfolioMarketBaseMinor,
    holdingsCount,
    accountCount: allAccounts.length,
    unreviewedCount: unreviewed.length,
  };
});

export const seedDemoData = mutation({ access: "editor" }, async () => {
  const existing = await db.query.legalEntities.findFirst({ columns: { id: true } });
  if (existing) {
    return { seeded: false, message: "Workspace already has data." };
  }

  // 1. FX Rates (normalized to EUR)
  await db.insert(fxRates).values({ fromCurrency: "TRY", toCurrency: "EUR", rateDate: "2026-11-24", rateMicros: 26_500, source: "tcmb" });
  await db.insert(fxRates).values({ fromCurrency: "USD", toCurrency: "EUR", rateDate: "2026-11-24", rateMicros: 920_000, source: "ecb" });
  await db.insert(fxRates).values({ fromCurrency: "GBP", toCurrency: "EUR", rateDate: "2026-11-24", rateMicros: 1_180_000, source: "ecb" });

  // 2. Legal Entities
  const [personal] = await db
    .insert(legalEntities)
    .values({
      name: "Personal",
      slug: "personal",
      country: "NL",
      entityType: "personal",
      baseCurrency: "EUR",
      notes: "Personal living expenses, savings, travel, and personal equity portfolio across NL and TR.",
    })
    .returning();
  const [nlBv] = await db
    .insert(legalEntities)
    .values({
      name: "Spacefast Holdings B.V.",
      slug: "spacefast-nl-bv",
      country: "NL",
      entityType: "bv",
      baseCurrency: "EUR",
      taxId: "KVK-89120431",
      vatNumber: "NL864912340B01",
      notes: "Dutch B.V. operating entity — quarterly BTW (VAT 21%) filings and SaaS/cloud expenses.",
    })
    .returning();
  const [trLtd] = await db
    .insert(legalEntities)
    .values({
      name: "Bosphorus Labs Ltd.",
      slug: "bosphorus-tr-ltd",
      country: "TR",
      entityType: "ltd_tr",
      baseCurrency: "TRY",
      taxId: "VKN-4120987654",
      notes: "Turkish entity for Istanbul operations, contractor retainers, and local KDV (20%).",
    })
    .returning();

  if (!personal || !nlBv || !trLtd) throw new HttpError(500, "internal", "Failed to seed entities.");

  // 3. Institutions
  const [bunq] = await db
    .insert(institutions)
    .values({ name: "bunq", slug: "bunq", country: "NL", kind: "neobank", website: "https://www.bunq.com" })
    .returning();
  const [hsbcTr] = await db
    .insert(institutions)
    .values({ name: "HSBC Turkey", slug: "hsbc-turkey", country: "TR", kind: "bank", website: "https://www.hsbc.com.tr" })
    .returning();
  const [wise] = await db
    .insert(institutions)
    .values({ name: "Wise", slug: "wise", country: "GB", kind: "emoney", website: "https://wise.com" })
    .returning();
  const [ibkr] = await db
    .insert(institutions)
    .values({ name: "Interactive Brokers", slug: "ibkr", country: "US", kind: "broker", website: "https://www.interactivebrokers.com" })
    .returning();
  if (!bunq || !hsbcTr || !wise || !ibkr) throw new HttpError(500, "internal", "Failed to seed institutions.");

  // 4. Hierarchical Accounts & Multi-Currency Sub-Accounts
  const [bunqPersonal] = await db
    .insert(accounts)
    .values({
      name: "bunq Personal EUR",
      slug: "bunq-personal-eur",
      entityId: personal.id,
      institutionId: bunq.id,
      accountType: "checking",
      currency: "EUR",
      ibanOrMask: "NL91 BUNQ 2045 •••• 18",
      balanceMinor: 1_845_000,
    })
    .returning();
  const [bunqBvOp] = await db
    .insert(accounts)
    .values({
      name: "bunq B.V. Operating",
      slug: "bunq-bv-operating",
      entityId: nlBv.id,
      institutionId: bunq.id,
      accountType: "checking",
      currency: "EUR",
      ibanOrMask: "NL44 BUNQ 2099 •••• 72",
      balanceMinor: 6_420_000,
    })
    .returning();
  const [bunqBvVat] = await db
    .insert(accounts)
    .values({
      name: "bunq B.V. VAT Reserve",
      slug: "bunq-bv-vat-reserve",
      entityId: nlBv.id,
      institutionId: bunq.id,
      parentAccountId: bunqBvOp?.id ?? null,
      accountType: "virtual_pot",
      currency: "EUR",
      ibanOrMask: "NL44 BUNQ 2099 •••• 73",
      balanceMinor: 1_380_000,
    })
    .returning();
  const [wisePersonalEur] = await db
    .insert(accounts)
    .values({
      name: "Wise Personal — EUR",
      slug: "wise-personal-eur",
      entityId: personal.id,
      institutionId: wise.id,
      accountType: "checking",
      currency: "EUR",
      ibanOrMask: "BE68 9670 •••• 44",
      balanceMinor: 492_000,
    })
    .returning();
  const [wisePersonalUsd] = await db
    .insert(accounts)
    .values({
      name: "Wise Personal — USD",
      slug: "wise-personal-usd",
      entityId: personal.id,
      institutionId: wise.id,
      parentAccountId: wisePersonalEur?.id ?? null,
      accountType: "checking",
      currency: "USD",
      ibanOrMask: "ACH •••• 8812",
      balanceMinor: 830_000,
    })
    .returning();
  const [wiseBizUsd] = await db
    .insert(accounts)
    .values({
      name: "Wise Business B.V. — USD",
      slug: "wise-business-usd",
      entityId: nlBv.id,
      institutionId: wise.id,
      accountType: "checking",
      currency: "USD",
      ibanOrMask: "ACH •••• 4401",
      balanceMinor: 2_150_000,
    })
    .returning();
  const [hsbcTry] = await db
    .insert(accounts)
    .values({
      name: "HSBC Turkey TRY Checking",
      slug: "hsbc-tr-checking",
      entityId: trLtd.id,
      institutionId: hsbcTr.id,
      accountType: "checking",
      currency: "TRY",
      ibanOrMask: "TR32 0012 •••• 9011",
      balanceMinor: 42_500_000,
    })
    .returning();
  const [hsbcCardAcc] = await db
    .insert(accounts)
    .values({
      name: "HSBC Premier Credit Card",
      slug: "hsbc-tr-premier-card",
      entityId: personal.id,
      institutionId: hsbcTr.id,
      parentAccountId: hsbcTry?.id ?? null,
      accountType: "credit_card",
      currency: "TRY",
      ibanOrMask: "Card •••• 6190",
      balanceMinor: -8_420_000,
      creditLimitMinor: 35_000_000,
      statementCloseDay: 22,
      paymentDueDay: 2,
    })
    .returning();
  const [ibkrAcc] = await db
    .insert(accounts)
    .values({
      name: "IBKR Personal Portfolio",
      slug: "ibkr-personal",
      entityId: personal.id,
      institutionId: ibkr.id,
      accountType: "brokerage",
      currency: "USD",
      ibanOrMask: "U148••••9",
      balanceMinor: 9_850_000,
    })
    .returning();

  if (
    !bunqPersonal ||
    !bunqBvOp ||
    !bunqBvVat ||
    !wisePersonalEur ||
    !wisePersonalUsd ||
    !wiseBizUsd ||
    !hsbcTry ||
    !hsbcCardAcc ||
    !ibkrAcc
  ) {
    throw new HttpError(500, "internal", "Failed to seed accounts.");
  }

  // 5. Cards
  const [bunqVirtual] = await db
    .insert(cards)
    .values({
      name: "bunq B.V. SaaS Virtual",
      slug: "bunq-bv-saas-virtual",
      entityId: nlBv.id,
      accountId: bunqBvOp.id,
      cardType: "virtual",
      network: "mastercard",
      last4: "4821",
      currency: "EUR",
      monthlyLimitMinor: 500_000,
      expiresOn: "2029-06",
      cardState: "active",
    })
    .returning();
  const [hsbcPremier] = await db
    .insert(cards)
    .values({
      name: "HSBC Premier Miles",
      slug: "hsbc-premier-miles",
      entityId: personal.id,
      accountId: hsbcCardAcc.id,
      cardType: "credit",
      network: "visa",
      last4: "6190",
      currency: "TRY",
      monthlyLimitMinor: 35_000_000,
      expiresOn: "2028-11",
      cardState: "active",
    })
    .returning();
  await db.insert(cards).values({
    name: "Wise Travel Debit",
    slug: "wise-travel-debit",
    entityId: personal.id,
    accountId: wisePersonalEur.id,
    cardType: "debit",
    network: "visa",
    last4: "9034",
    currency: "EUR",
    expiresOn: "2029-02",
    cardState: "active",
  });

  // 6. Entity-Aware Categories
  const [catGroceries] = await db
    .insert(categories)
    .values({
      name: "Groceries & Dining",
      slug: "personal-groceries-dining",
      entityId: personal.id,
      groupName: "Living",
      monthlyBudgetMinor: 95_000,
    })
    .returning();
  const [catTravel] = await db
    .insert(categories)
    .values({
      name: "Flights & Travel",
      slug: "personal-travel",
      entityId: personal.id,
      groupName: "Lifestyle",
      monthlyBudgetMinor: 120_000,
    })
    .returning();
  const [catCloud] = await db
    .insert(categories)
    .values({
      name: "Cloud & SaaS Infrastructure",
      slug: "bv-cloud-saas",
      entityId: nlBv.id,
      groupName: "Operating Expenses",
      accountCode: "4510",
      vatRateBps: 2100,
      monthlyBudgetMinor: 250_000,
    })
    .returning();
  const [catBvRevenue] = await db
    .insert(categories)
    .values({
      name: "Enterprise Retainer Revenue",
      slug: "bv-revenue",
      entityId: nlBv.id,
      groupName: "Revenue",
      isIncome: true,
      accountCode: "8000",
      vatRateBps: 2100,
    })
    .returning();
  const [catTrOps] = await db
    .insert(categories)
    .values({
      name: "Istanbul Office & Contractors",
      slug: "tr-office-contractors",
      entityId: trLtd.id,
      groupName: "TR Operations",
      accountCode: "770.01",
      vatRateBps: 2000,
    })
    .returning();

  // 7. Payees
  const [payeeAh] = await db.insert(payees).values({ name: "Albert Heijn", slug: "albert-heijn", defaultCategoryId: catGroceries?.id ?? null, country: "NL" }).returning();
  const [payeeCf] = await db.insert(payees).values({ name: "Cloudflare", slug: "cloudflare", defaultCategoryId: catCloud?.id ?? null, country: "US" }).returning();
  const [payeeThy] = await db.insert(payees).values({ name: "Turkish Airlines", slug: "turkish-airlines", defaultCategoryId: catTravel?.id ?? null, country: "TR" }).returning();
  const [payeeAutomattic] = await db
    .insert(payees)
    .values({
      name: "Automattic Inc.",
      slug: "automattic-inc",
      defaultCategoryId: catTravel?.id ?? null,
      country: "US",
      notes: "Employer — external travel & home-office expense reimbursements (Ramp).",
    })
    .returning();

  // 8. HSBC Turkey Taksit Installment Plan
  const [taksitPlan] = await db
    .insert(installmentPlans)
    .values({
      entityId: personal.id,
      accountId: hsbcCardAcc.id,
      cardId: hsbcPremier?.id ?? null,
      categoryId: catTravel?.id ?? null,
      merchant: "Apple Store Zorlu Center (MacBook Pro)",
      totalMinor: 12_600_000,
      currency: "TRY",
      totalInstallments: 6,
      paidInstallments: 2,
      monthlyMinor: 2_100_000,
      startedOn: "2026-09-20",
      status: "active",
      notes: "6-month 0% vade farksız taksit on HSBC Premier.",
    })
    .returning();

  // 9. Cross-Currency Transfer (Wise Personal EUR -> HSBC Turkey TRY)
  const [fxTransfer] = await db
    .insert(transfers)
    .values({
      transferKind: "fx_conversion",
      fromAccountId: wisePersonalEur.id,
      toAccountId: hsbcTry.id,
      fromAmountMinor: 150_000,
      fromCurrency: "EUR",
      toAmountMinor: 5_640_000,
      toCurrency: "TRY",
      feeMinor: 780,
      fxRateMicros: 37_600_000,
      executedOn: "2026-11-18",
      reference: "WISE-TR-88412",
      notes: "Monthly Istanbul operating liquidity transfer.",
    })
    .returning();

  // 10. Ledger Entries
  await db.insert(entries).values({
    entityId: nlBv.id,
    accountId: bunqBvOp.id,
    categoryId: catBvRevenue?.id ?? null,
    postedOn: "2026-11-22",
    description: "Acme Europe B.V. — November Retainer (INV-2026-114)",
    merchantRaw: "ACME EUROPE BV",
    amountMinor: 1_210_000,
    currency: "EUR",
    baseAmountMinor: 1_210_000,
    fxRateMicros: 1_000_000,
    entryKind: "income",
    reviewStatus: "reviewed",
    vatAmountMinor: 210_000,
    tagsJson: ["vat-21", "q4-2026"],
  });
  await db.insert(entries).values({
    entityId: nlBv.id,
    accountId: bunqBvOp.id,
    cardId: bunqVirtual?.id ?? null,
    categoryId: catCloud?.id ?? null,
    payeeId: payeeCf?.id ?? null,
    postedOn: "2026-11-21",
    description: "Cloudflare Workers & R2 Production",
    merchantRaw: "CLOUDFLARE INC",
    amountMinor: -48_500,
    currency: "EUR",
    baseAmountMinor: -48_500,
    fxRateMicros: 1_000_000,
    entryKind: "expense",
    reviewStatus: "unreviewed",
    vatAmountMinor: 8_417,
    tagsJson: ["saas", "business-deductible"],
  });
  await db.insert(entries).values({
    entityId: personal.id,
    accountId: bunqPersonal.id,
    categoryId: catGroceries?.id ?? null,
    payeeId: payeeAh?.id ?? null,
    postedOn: "2026-11-23",
    description: "Albert Heijn Amsterdam Oud-West",
    merchantRaw: "ALBERT HEIJN 1422",
    amountMinor: -11_840,
    currency: "EUR",
    baseAmountMinor: -11_840,
    fxRateMicros: 1_000_000,
    entryKind: "expense",
    reviewStatus: "unreviewed",
    tagsJson: ["groceries"],
  });
  await db.insert(entries).values({
    entityId: personal.id,
    accountId: hsbcCardAcc.id,
    cardId: hsbcPremier?.id ?? null,
    categoryId: catTravel?.id ?? null,
    payeeId: payeeThy?.id ?? null,
    installmentPlanId: taksitPlan?.id ?? null,
    postedOn: "2026-11-20",
    description: "Apple Store Zorlu Center (2/6 Taksit)",
    merchantRaw: "APPLE STORE ZORLU",
    amountMinor: -2_100_000,
    currency: "TRY",
    baseAmountMinor: -55_650,
    fxRateMicros: 26_500,
    entryKind: "expense",
    reviewStatus: "reviewed",
    tagsJson: ["taksit", "hardware"],
  });
  const [thyEntry] = await db
    .insert(entries)
    .values({
      entityId: personal.id,
      accountId: hsbcCardAcc.id,
      cardId: hsbcPremier?.id ?? null,
      categoryId: catTravel?.id ?? null,
      payeeId: payeeThy?.id ?? null,
      postedOn: "2026-11-19",
      description: "Turkish Airlines AMS ↔ IST",
      merchantRaw: "THY ISTANBUL",
      amountMinor: -1_840_000,
      currency: "TRY",
      baseAmountMinor: -48_760,
      fxRateMicros: 26_500,
      entryKind: "expense",
      reviewStatus: "flagged",
      excludeFromBudget: true,
      tagsJson: ["travel", "reimbursable"],
      notes: "100% reimbursable by Automattic Inc. via Ramp.",
    })
    .returning();
  const [jetbrainsEntry] = await db
    .insert(entries)
    .values({
      entityId: personal.id,
      accountId: bunqPersonal.id,
      categoryId: catCloud?.id ?? null,
      postedOn: "2026-11-22",
      description: "JetBrains All Products Pack (Out-of-Pocket)",
      merchantRaw: "JETBRAINS SRO",
      amountMinor: -28_900,
      currency: "EUR",
      baseAmountMinor: -28_900,
      fxRateMicros: 1_000_000,
      entryKind: "expense",
      reviewStatus: "reviewed",
      excludeFromBudget: true,
      tagsJson: ["devtools", "reimbursable"],
      notes: "Paid on personal bunq card; to be reimbursed by Spacefast Holdings B.V.",
    })
    .returning();
  await db.insert(entries).values({
    entityId: trLtd.id,
    accountId: hsbcTry.id,
    categoryId: catTrOps?.id ?? null,
    postedOn: "2026-11-15",
    description: "Kolektif House Levent — November Desk",
    merchantRaw: "KOLEKTIF HOUSE",
    amountMinor: -3_200_000,
    currency: "TRY",
    baseAmountMinor: -84_800,
    fxRateMicros: 26_500,
    entryKind: "expense",
    reviewStatus: "reviewed",
    vatAmountMinor: 533_333,
    tagsJson: ["kdv-20", "office"],
  });
  if (fxTransfer) {
    await db.insert(entries).values({
      entityId: personal.id,
      accountId: wisePersonalEur.id,
      transferId: fxTransfer.id,
      postedOn: "2026-11-18",
      description: "Transfer to HSBC Turkey TRY Checking",
      amountMinor: -150_780,
      currency: "EUR",
      baseAmountMinor: -150_780,
      fxRateMicros: 1_000_000,
      entryKind: "fx_conversion",
      reviewStatus: "reviewed",
      excludeFromBudget: true,
      excludeFromTotals: true,
    });
    await db.insert(entries).values({
      entityId: trLtd.id,
      accountId: hsbcTry.id,
      transferId: fxTransfer.id,
      postedOn: "2026-11-18",
      description: "Transfer from Wise Personal — EUR",
      amountMinor: 5_640_000,
      currency: "TRY",
      baseAmountMinor: 149_460,
      fxRateMicros: 26_500,
      entryKind: "fx_conversion",
      reviewStatus: "reviewed",
      excludeFromBudget: true,
      excludeFromTotals: true,
    });
  }

  // 11. Recurring Items
  await db.insert(recurringItems).values({
    name: "Cloudflare Enterprise & Workers",
    slug: "cloudflare-workers",
    entityId: nlBv.id,
    accountId: bunqBvOp.id,
    categoryId: catCloud?.id ?? null,
    payeeId: payeeCf?.id ?? null,
    amountMinor: -48_500,
    currency: "EUR",
    cadence: "monthly",
    billingDay: 21,
    nextDueOn: "2026-12-21",
    autoPay: true,
    scheduleState: "active",
  });
  await db.insert(recurringItems).values({
    name: "Kolektif House Istanbul",
    slug: "kolektif-house",
    entityId: trLtd.id,
    accountId: hsbcTry.id,
    categoryId: catTrOps?.id ?? null,
    amountMinor: -3_200_000,
    currency: "TRY",
    cadence: "monthly",
    billingDay: 15,
    nextDueOn: "2026-12-15",
    autoPay: true,
    scheduleState: "active",
  });

  // 12. Investments (Stocks, ETFs, Crypto & Private Equity Holdings)
  const [vwce] = await db
    .insert(securities)
    .values({
      name: "Vanguard FTSE All-World UCITS ETF",
      slug: "vwce",
      ticker: "VWCE.DE",
      isin: "IE00BK5BQT80",
      exchange: "XETRA",
      unitLabel: "shares",
      assetClass: "etf",
      currency: "EUR",
      lastPriceMinor: 13_480,
      lastPricedOn: "2026-11-24",
    })
    .returning();
  const [msft] = await db
    .insert(securities)
    .values({
      name: "Microsoft Corporation",
      slug: "msft",
      ticker: "MSFT",
      isin: "US5949181045",
      exchange: "NASDAQ",
      unitLabel: "shares",
      assetClass: "stock",
      currency: "USD",
      lastPriceMinor: 42_850,
      lastPricedOn: "2026-11-24",
    })
    .returning();
  const [btc] = await db
    .insert(securities)
    .values({
      name: "Bitcoin",
      slug: "btc",
      ticker: "BTC",
      exchange: "CRYPTO",
      unitLabel: "BTC",
      assetClass: "crypto",
      currency: "USD",
      lastPriceMinor: 9_150_000,
      lastPricedOn: "2026-11-24",
      notes: "Long-term spot BTC held in self-custody hardware wallet.",
    })
    .returning();
  const [autm] = await db
    .insert(securities)
    .values({
      name: "Automattic Inc. (Vested Equity)",
      slug: "autm-equity",
      ticker: "AUTM",
      exchange: "PRIVATE",
      unitLabel: "shares",
      assetClass: "private_equity",
      currency: "USD",
      lastPriceMinor: 5_200,
      lastPricedOn: "2026-11-01",
      notes: "Vested employer equity tracked at latest 409A / tender valuation.",
    })
    .returning();
  if (vwce) {
    await db.insert(trades).values({
      entityId: personal.id,
      accountId: ibkrAcc.id,
      securityId: vwce.id,
      tradeType: "buy",
      executedOn: "2026-08-10",
      quantityMicros: 320_000_000,
      priceMinor: 12_650,
      feeMinor: 300,
      currency: "EUR",
      baseTotalMinor: 4_048_300,
    });
  }
  if (msft) {
    await db.insert(trades).values({
      entityId: personal.id,
      accountId: ibkrAcc.id,
      securityId: msft.id,
      tradeType: "buy",
      executedOn: "2026-09-14",
      quantityMicros: 120_000_000,
      priceMinor: 41_200,
      feeMinor: 150,
      currency: "USD",
      baseTotalMinor: 4_548_618,
    });
    await db.insert(trades).values({
      entityId: personal.id,
      accountId: ibkrAcc.id,
      securityId: msft.id,
      tradeType: "dividend",
      executedOn: "2026-11-12",
      quantityMicros: 0,
      priceMinor: 9_960,
      feeMinor: 0,
      currency: "USD",
      baseTotalMinor: 9_163,
      notes: "Quarterly dividend ($0.83/share × 120)",
    });
  }
  if (btc) {
    await db.insert(trades).values({
      entityId: personal.id,
      accountId: ibkrAcc.id,
      securityId: btc.id,
      tradeType: "buy",
      executedOn: "2026-05-18",
      quantityMicros: 450_000,
      priceMinor: 6_800_000,
      feeMinor: 2_500,
      currency: "USD",
      baseTotalMinor: 2_817_500,
      notes: "Spot BTC accumulation",
    });
  }
  if (autm) {
    await db.insert(trades).values({
      entityId: personal.id,
      accountId: ibkrAcc.id,
      securityId: autm.id,
      tradeType: "vest_grant",
      executedOn: "2026-10-01",
      quantityMicros: 500_000_000,
      priceMinor: 4_500,
      feeMinor: 0,
      currency: "USD",
      baseTotalMinor: 2_070_000,
      notes: "Vested grant lot",
    });
  }

  // 13. Valuation Snapshot
  await db.insert(valuations).values({
    entityId: nlBv.id,
    accountId: bunqBvOp.id,
    valuedOn: "2026-11-24",
    balanceMinor: 6_420_000,
    currency: "EUR",
    baseBalanceMinor: 6_420_000,
    source: "statement",
  });

  // 14. Reimbursements (External Employer Receivable + Internal B.V. Claim)
  if (payeeAutomattic && thyEntry) {
    const [extClaim] = await db
      .insert(reimbursementClaims)
      .values({
        title: "Automattic Summit Travel — AMS ↔ IST",
        payerKind: "external_counterparty",
        counterpartyPayeeId: payeeAutomattic.id,
        reimburseToAccountId: wisePersonalUsd.id,
        claimState: "submitted",
        currency: "EUR",
        totalMinor: 48_760,
        fxVarianceMinor: 0,
        externalRef: "RAMP-REIMB-4910",
        submittedOn: "2026-11-20",
        notes: "Submitted via Ramp; expecting USD wire payout to Wise Personal USD.",
      })
      .returning();
    if (extClaim) {
      await db.insert(reimbursementLines).values({
        claimId: extClaim.id,
        sourceEntryId: thyEntry.id,
        splitBps: 10_000,
        reimbursableMinor: 1_840_000,
        currency: "TRY",
        baseMinor: 48_760,
        notes: "Round-trip economy flight AMS ↔ IST.",
      });
    }
  }
  if (jetbrainsEntry) {
    const [intClaim] = await db
      .insert(reimbursementClaims)
      .values({
        title: "Q4 Developer Tools — Personal Card Out-of-Pocket",
        payerKind: "internal_entity",
        businessEntityId: nlBv.id,
        reimburseToAccountId: bunqPersonal.id,
        claimState: "approved",
        currency: "EUR",
        totalMinor: 28_900,
        fxVarianceMinor: 0,
        submittedOn: "2026-11-22",
        notes: "Ready for inter-entity payout from bunq B.V. Operating to bunq Personal EUR.",
      })
      .returning();
    if (intClaim) {
      await db.insert(reimbursementLines).values({
        claimId: intClaim.id,
        sourceEntryId: jetbrainsEntry.id,
        businessCategoryId: catCloud?.id ?? null,
        splitBps: 10_000,
        reimbursableMinor: 28_900,
        currency: "EUR",
        baseMinor: 28_900,
        notes: "100% business deductible for Spacefast Holdings B.V. (21% BTW).",
      });
    }
  }

  // 15. Sample Memo & Accountant Share Link
  await db.insert(financeMemos).values({
    title: "2026 Q4 Dutch BTW & Turkish KDV Checklist",
    slug: "2026-q4-vat-checklist",
    entityId: nlBv.id,
    period: "2026-Q4",
    content:
      "Confirm reverse-charge treatment for US SaaS invoices (Cloudflare, OpenAI), reconcile bunq VAT Reserve pot against Q4 output BTW, and export signed receipt links for Dutch accountant.",
  });
  await db.insert(shareLinks).values({
    label: "NL Accountant — Q4 2026 B.V. Review",
    entityId: nlBv.id,
    dateFrom: "2026-10-01",
    dateTo: "2026-12-31",
    maskCounterparties: false,
  });

  return { seeded: true, message: "Seeded multi-entity demo workspace (Personal, NL B.V., TR Ltd)." };
});
