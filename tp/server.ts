import { cron, db, HttpError, job, mutation, query } from "typedpress";
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
  securities,
  shareLinks,
  trades,
  transfers,
  valuations,
} from "./schema";
import {
  convertToBaseMinor,
  parseDecimalToMinor,
  parseStatementCsv,
  slugify,
  type Currency,
} from "./lib/money";

type EntryKind = "expense" | "income" | "transfer" | "fx_conversion" | "card_payment" | "inter_entity" | "fee" | "tax" | "investment";
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

  // Binary document (PDF statement or receipt image): read base64 from private storage.
  // When FINANCE_AI_API_KEY is configured, send to OpenAI using the job's 60s / 16 MiB fetch budget.
  const b64 = await inboxFiles.readBase64(fileId);
  const apiKey = process.env.FINANCE_AI_API_KEY;
  if (apiKey && apiKey.trim() !== "") {
    const prompt =
      "Extract financial transactions from this statement or receipt. Respond with strict JSON: " +
      '{"institution":"string","currency":"EUR|TRY|USD|GBP|CHF","rows":[{"postedOn":"YYYY-MM-DD","description":"string","merchant":"string","amountMinor":-1250,"currency":"EUR","entryKind":"expense|income|transfer|fee","installmentCount":null}]}';
    const isImage = meta.mime.startsWith("image/");
    const contentPart = isImage
      ? { type: "image_url", image_url: { url: `data:${meta.mime};base64,${b64}` } }
      : { type: "text", text: `Filename: ${meta.filename} (${meta.mime}, ${meta.size} bytes). Base64 prefix: ${b64.slice(0, 4000)}` };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: settings.aiModel,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You extract structured accounting ledger rows from statements and receipts." },
          { role: "user", content: [{ type: "text", text: prompt }, contentPart] },
        ],
      }),
    });
    if (res.ok) {
      const payload = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const rawJson = payload.choices?.[0]?.message?.content ?? "{}";
      const extracted = JSON.parse(rawJson) as {
        institution?: string;
        currency?: string;
        rows?: Array<{
          postedOn?: string;
          description?: string;
          merchant?: string;
          amountMinor?: number;
          currency?: string;
          entryKind?: string;
          installmentCount?: number | null;
        }>;
      };
      const rows = extracted.rows ?? [];
      let count = 0;
      for (const r of rows) {
        const amt = typeof r.amountMinor === "number" ? Math.round(r.amountMinor) : 0;
        if (amt === 0) continue;
        const ccy =
          r.currency === "TRY" || r.currency === "USD" || r.currency === "GBP" || r.currency === "CHF"
            ? r.currency
            : "EUR";
        const kind =
          r.entryKind === "income" || r.entryKind === "transfer" || r.entryKind === "fee" ? r.entryKind : "expense";
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
          confidenceBps: 8500,
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
            detectedInstitution: (extracted.institution ?? "AI Extraction").slice(0, 80),
            detectedCurrency: fallbackCurrency,
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
  let netWorthBaseMinor = 0;
  for (const a of allAccounts) {
    if (a.excludeFromTotals) continue;
    const rate = await lookupRateMicros(a.currency, settings.baseCurrency);
    netWorthBaseMinor += convertToBaseMinor(a.balanceMinor, rate);
  }
  return {
    baseCurrency: settings.baseCurrency,
    netWorthBaseMinor,
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
  await db.insert(entries).values({
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
    tagsJson: ["travel", "reimbursable"],
    notes: "Confirm whether split 50/50 with NL B.V.",
  });
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

  // 12. Investments (Securities & Trades)
  const [vwce] = await db
    .insert(securities)
    .values({
      name: "Vanguard FTSE All-World UCITS ETF",
      slug: "vwce",
      ticker: "VWCE",
      isin: "IE00BK5BQT80",
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
      assetClass: "stock",
      currency: "USD",
      lastPriceMinor: 42_850,
      lastPricedOn: "2026-11-24",
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

  // 14. Sample Memo & Accountant Share Link
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
