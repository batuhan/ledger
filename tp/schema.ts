import {
  boolean,
  collection,
  date,
  db,
  email,
  file,
  files,
  global,
  HttpError,
  integer,
  json,
  ref,
  richText,
  select,
  slug,
  table,
  taxonomy,
  terms,
  text,
  timestamp,
  url,
  type AccessCtx,
} from "typedpress";
import {
  ACCOUNT_TYPES,
  ASSET_CLASSES,
  CLAIM_STATES,
  COUNTRIES,
  CURRENCIES,
  ENTITY_TYPES,
  ENTRY_KINDS,
  PAYER_KINDS,
  TRADE_TYPES,
  slugify,
} from "./lib/money";

// ---------------------------------------------------------------------------
// Private files, taxonomy & workspace settings
// ---------------------------------------------------------------------------

export const inboxFiles = files({
  accept: [
    "application/pdf",
    "text/csv",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/json",
  ],
  maxBytes: 25_000_000,
  access: {
    read: "authenticated",
    create: "authenticated",
    delete: "editor",
  },
});

export const tags = taxonomy(
  {
    color: text().pattern(/^#[0-9a-fA-F]{6}$/).optional(),
  },
  { label: "Finance Tags" },
);

export const financeSettings = global(
  {
    workspaceName: text().default("Personal & Ventures Finance"),
    baseCurrency: select(CURRENCIES).default("EUR"),
    fiscalYearStartMonth: integer().min(1).max(12).default(1),
    aiProvider: select(["gemini", "anthropic", "openai"]).default("gemini"),
    aiModel: text().default("gemini-2.5-flash"),
    autoApproveConfidenceBps: integer().min(5000).max(10000).default(9500),
    accountantNote: text({ multiline: true }).optional(),
  },
  {
    access: { read: "authenticated", update: "admin" },
  },
);

// ---------------------------------------------------------------------------
// Read-only db.query access helpers (powered by PR #614, pushed into SQL)
// ---------------------------------------------------------------------------

async function allowedEntityIds(ctx: AccessCtx, write: boolean): Promise<{ all: boolean; ids: number[] }> {
  if (!ctx.user) return { all: false, ids: [] };
  if (ctx.user.role === "admin" || ctx.user.role === "editor") return { all: true, ids: [] };
  const userGrants = await db.query.grants.findMany({
    where: { userId: ctx.user.id },
    limit: 50,
  });
  const ids: number[] = [];
  for (const g of userGrants) {
    if (g.revokedAt !== null) continue;
    if (write && g.role !== "editor" && g.role !== "admin") continue;
    if (g.entityId === null) return { all: true, ids: [] };
    ids.push(g.entityId);
  }
  return { all: false, ids };
}

const readByEntityGrant = async (ctx: AccessCtx) => {
  const scope = await allowedEntityIds(ctx, false);
  if (scope.all) return true;
  if (scope.ids.length === 0) return false;
  return { entityId: { in: scope.ids } };
};

const writeByEntityGrant = async (ctx: AccessCtx) => {
  const scope = await allowedEntityIds(ctx, true);
  if (scope.all) return true;
  if (scope.ids.length === 0) return false;
  return { entityId: { in: scope.ids } };
};

// ---------------------------------------------------------------------------
// Collections (human-curated master data & documents with slugs & URLs)
// ---------------------------------------------------------------------------

export const legalEntities = collection(
  {
    name: text().min(1).max(120).ui({ label: "Entity name" }),
    slug: slug({ source: "name" }).optional(),
    country: select(COUNTRIES).default("NL"),
    entityType: select(ENTITY_TYPES).default("personal"),
    baseCurrency: select(CURRENCIES).default("EUR"),
    taxId: text().max(80).optional(),
    vatNumber: text().max(80).optional(),
    notes: richText().optional(),
  },
  {
    label: "Legal Entities",
    title: "name",
    content: "notes",
    url: "/entities/:slug",
    access: {
      read: async (ctx) => {
        const scope = await allowedEntityIds(ctx, false);
        if (scope.all) return true;
        if (scope.ids.length === 0) return false;
        return { id: { in: scope.ids } };
      },
      create: "editor",
      update: async (ctx) => {
        const scope = await allowedEntityIds(ctx, true);
        if (scope.all) return true;
        if (scope.ids.length === 0) return false;
        return { id: { in: scope.ids } };
      },
      delete: "admin",
    },
  },
);

export const institutions = collection(
  {
    name: text().min(1).max(120),
    slug: slug({ source: "name" }).optional(),
    country: select(COUNTRIES).default("NL"),
    kind: select(["bank", "neobank", "emoney", "broker", "credit_card", "crypto"]).default("bank"),
    website: url().optional(),
    notes: richText().optional(),
  },
  {
    label: "Institutions",
    title: "name",
    content: "notes",
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const accounts = collection(
  {
    name: text().min(1).max(120),
    slug: slug({ source: "name" }).optional(),
    entityId: ref(legalEntities).onDelete("restrict").reverse("accounts"),
    institutionId: ref(institutions).onDelete("restrict").reverse("accounts"),
    parentAccountId: integer().optional(),
    accountType: select(ACCOUNT_TYPES).default("checking"),
    currency: select(CURRENCIES).default("EUR"),
    ibanOrMask: text().max(64).optional(),
    balanceMinor: integer().default(0),
    creditLimitMinor: integer().optional(),
    statementCloseDay: integer().min(1).max(31).optional(),
    paymentDueDay: integer().min(1).max(31).optional(),
    excludeFromTotals: boolean().default(false),
    archived: boolean().default(false),
    notes: richText().optional(),
  },
  {
    label: "Accounts",
    title: "name",
    content: "notes",
    url: "/accounts/:slug",
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: writeByEntityGrant,
      delete: "admin",
    },
  },
);

export const cards = collection(
  {
    name: text().min(1).max(120),
    slug: slug({ source: "name" }).optional(),
    entityId: ref(legalEntities).onDelete("restrict"),
    accountId: ref(accounts).onDelete("restrict").reverse("cards"),
    cardType: select(["debit", "credit", "virtual", "prepaid"]).default("debit"),
    network: select(["visa", "mastercard", "amex", "troy"]).default("mastercard"),
    last4: text().max(4),
    currency: select(CURRENCIES).default("EUR"),
    monthlyLimitMinor: integer().optional(),
    expiresOn: text().max(7).optional(),
    cardState: select(["active", "frozen", "cancelled"]).default("active"),
    notes: richText().optional(),
  },
  {
    label: "Cards",
    title: "name",
    content: "notes",
    url: "/cards/:slug",
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: writeByEntityGrant,
      delete: "admin",
    },
  },
);

export const categories = collection(
  {
    name: text().min(1).max(120),
    slug: slug({ source: "name" }).optional(),
    entityId: ref(legalEntities).optional().onDelete("setNull"),
    parentCategoryId: integer().optional(),
    groupName: text().max(80).default("General"),
    isIncome: boolean().default(false),
    excludeFromBudget: boolean().default(false),
    excludeFromTotals: boolean().default(false),
    accountCode: text().max(32).optional(),
    vatRateBps: integer().min(0).max(5000).default(0),
    monthlyBudgetMinor: integer().optional(),
    notes: richText().optional(),
  },
  {
    label: "Categories",
    title: "name",
    content: "notes",
    url: "/categories/:slug",
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const payees = collection(
  {
    name: text().min(1).max(120),
    slug: slug({ source: "name" }).optional(),
    defaultCategoryId: ref(categories).optional().onDelete("setNull"),
    country: select(COUNTRIES).optional(),
    vatNumber: text().max(80).optional(),
    notes: richText().optional(),
  },
  {
    label: "Payees",
    title: "name",
    content: "notes",
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const recurringItems = collection(
  {
    name: text().min(1).max(120),
    slug: slug({ source: "name" }).optional(),
    entityId: ref(legalEntities).onDelete("restrict"),
    accountId: ref(accounts).onDelete("restrict"),
    categoryId: ref(categories).optional().onDelete("setNull"),
    payeeId: ref(payees).optional().onDelete("setNull"),
    amountMinor: integer(),
    currency: select(CURRENCIES).default("EUR"),
    cadence: select(["weekly", "monthly", "quarterly", "yearly"]).default("monthly"),
    billingDay: integer().min(1).max(31).default(1),
    nextDueOn: date(),
    autoPay: boolean().default(true),
    scheduleState: select(["active", "paused", "cancelled"]).default("active"),
    notes: richText().optional(),
  },
  {
    label: "Recurring Items",
    title: "name",
    content: "notes",
    url: "/recurring/:slug",
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: writeByEntityGrant,
      delete: "admin",
    },
  },
);

export const securities = collection(
  {
    name: text().min(1).max(120),
    slug: slug({ source: "name" }).optional(),
    ticker: text().min(1).max(24),
    isin: text().max(24).optional(),
    exchange: text().max(32).optional(),
    unitLabel: text().max(24).default("shares"),
    assetClass: select(ASSET_CLASSES).default("stock"),
    currency: select(CURRENCIES).default("USD"),
    lastPriceMinor: integer().default(0),
    lastPricedOn: date().optional(),
    notes: richText().optional(),
  },
  {
    label: "Securities",
    title: "name",
    content: "notes",
    url: "/investments/:slug",
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const ingestItems = collection(
  {
    title: text().min(1).max(180),
    slug: slug({ source: "title" }).optional(),
    entityId: ref(legalEntities).optional().onDelete("setNull"),
    accountId: ref(accounts).optional().onDelete("setNull"),
    fileId: file(inboxFiles).optional(),
    sourceKind: select([
      "bank_csv",
      "credit_card_pdf",
      "receipt_image",
      "invoice_pdf",
      "broker_statement",
      "other",
    ]).default("bank_csv"),
    ingestState: select(["uploaded", "processing", "needs_review", "applied", "failed"]).default("uploaded"),
    detectedInstitution: text().max(80).optional(),
    detectedCurrency: select(CURRENCIES).optional(),
    proposalCount: integer().default(0),
    errorMessage: text().optional(),
    summary: richText().optional(),
  },
  {
    label: "Inbox Imports",
    title: "title",
    content: "summary",
    url: "/inbox/:slug",
    access: {
      read: readByEntityGrant,
      create: "authenticated",
      update: "editor",
      delete: "admin",
    },
  },
).on({
  beforeCreate(data) {
    data.title = data.title.trim();
    if (data.title === "") throw new HttpError(422, "invalid_input", "Import title cannot be empty.");
    if (!data.slug) data.slug = `${slugify(data.title)}-${String(Date.now())}`;
  },
});

export const financeMemos = collection(
  {
    title: text().min(1).max(180),
    slug: slug({ source: "title" }).optional(),
    entityId: ref(legalEntities).optional().onDelete("setNull"),
    period: text().max(32).default("2026-Q4"),
    tagIds: terms(tags).reverse("memos"),
    content: richText().optional(),
  },
  {
    label: "Finance Memos",
    title: "title",
    content: "content",
    url: "/memos/:slug",
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

// ---------------------------------------------------------------------------
// Tables (high-volume ledger, transfers, taksit installments, trades, FX, sharing)
// ---------------------------------------------------------------------------

export const transfers = table(
  {
    transferKind: select([
      "same_currency",
      "fx_conversion",
      "card_payment",
      "inter_entity",
      "broker_funding",
    ]).default("same_currency"),
    fromAccountId: ref(accounts).onDelete("restrict"),
    toAccountId: ref(accounts).onDelete("restrict"),
    fromAmountMinor: integer(),
    fromCurrency: select(CURRENCIES),
    toAmountMinor: integer(),
    toCurrency: select(CURRENCIES),
    feeMinor: integer().default(0),
    fxRateMicros: integer().default(1_000_000),
    executedOn: date(),
    reference: text().max(120).optional(),
    notes: text().optional(),
  },
  {
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const installmentPlans = table(
  {
    entityId: ref(legalEntities).onDelete("restrict"),
    accountId: ref(accounts).onDelete("restrict"),
    cardId: ref(cards).optional().onDelete("setNull"),
    categoryId: ref(categories).optional().onDelete("setNull"),
    merchant: text().min(1).max(160),
    totalMinor: integer(),
    currency: select(CURRENCIES).default("TRY"),
    totalInstallments: integer().min(2).max(48),
    paidInstallments: integer().min(0).default(0),
    monthlyMinor: integer(),
    startedOn: date(),
    status: select(["active", "completed", "cancelled"]).default("active"),
    notes: text().optional(),
  },
  {
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: writeByEntityGrant,
      delete: "admin",
    },
  },
);

export const entries = table(
  {
    entityId: ref(legalEntities).onDelete("restrict").reverse("entries"),
    accountId: ref(accounts).onDelete("restrict").reverse("entries"),
    cardId: ref(cards).optional().onDelete("setNull"),
    categoryId: ref(categories).optional().onDelete("setNull"),
    payeeId: ref(payees).optional().onDelete("setNull"),
    parentEntryId: integer().optional(),
    transferId: ref(transfers).optional().onDelete("setNull"),
    installmentPlanId: ref(installmentPlans).optional().onDelete("setNull"),
    postedOn: date(),
    description: text().min(1).max(240),
    merchantRaw: text().max(120).optional(),
    amountMinor: integer(),
    currency: select(CURRENCIES).default("EUR"),
    baseAmountMinor: integer(),
    fxRateMicros: integer().default(1_000_000),
    entryKind: select(ENTRY_KINDS).default("expense"),
    isPending: boolean().default(false),
    reviewStatus: select(["unreviewed", "reviewed", "flagged"]).default("unreviewed"),
    isSplitParent: boolean().default(false),
    excludeFromBudget: boolean().default(false),
    excludeFromTotals: boolean().default(false),
    vatAmountMinor: integer().optional(),
    receiptFileId: file(inboxFiles).optional(),
    tagsJson: json<string[]>().$default(() => []),
    externalRef: text().max(120).optional(),
    notes: text().optional(),
    createdAt: timestamp().$default(() => new Date().toISOString()),
  },
  {
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: writeByEntityGrant,
      delete: "admin",
    },
  },
);

export const trades = table(
  {
    entityId: ref(legalEntities).onDelete("restrict"),
    accountId: ref(accounts).onDelete("restrict"),
    securityId: ref(securities).onDelete("restrict").reverse("trades"),
    tradeType: select(TRADE_TYPES).default("buy"),
    executedOn: date(),
    quantityMicros: integer(),
    priceMinor: integer(),
    feeMinor: integer().default(0),
    currency: select(CURRENCIES).default("USD"),
    baseTotalMinor: integer(),
    notes: text().optional(),
  },
  {
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const valuations = table(
  {
    entityId: ref(legalEntities).onDelete("restrict"),
    accountId: ref(accounts).onDelete("restrict"),
    valuedOn: date(),
    balanceMinor: integer(),
    currency: select(CURRENCIES).default("EUR"),
    baseBalanceMinor: integer(),
    source: select(["manual", "statement", "sync"]).default("manual"),
  },
  {
    access: {
      read: readByEntityGrant,
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const fxRates = table(
  {
    fromCurrency: select(CURRENCIES),
    toCurrency: select(CURRENCIES).default("EUR"),
    rateDate: date(),
    rateMicros: integer(),
    source: select(["ecb", "tcmb", "wise", "manual"]).default("ecb"),
  },
  {
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const ingestProposals = table(
  {
    ingestItemId: ref(ingestItems).onDelete("cascade").reverse("proposals"),
    targetKind: select(["entry", "transfer", "installment", "trade"]).default("entry"),
    postedOn: date(),
    description: text().min(1).max(240),
    merchantRaw: text().max(120).optional(),
    amountMinor: integer(),
    currency: select(CURRENCIES).default("EUR"),
    suggestedEntityId: ref(legalEntities).optional().onDelete("setNull"),
    suggestedAccountId: ref(accounts).optional().onDelete("setNull"),
    suggestedCategoryId: ref(categories).optional().onDelete("setNull"),
    entryKind: select(ENTRY_KINDS).default("expense"),
    installmentCount: integer().optional(),
    confidenceBps: integer().min(0).max(10000).default(8000),
    status: select(["pending", "approved", "rejected", "applied"]).default("pending"),
    appliedEntryId: integer().optional(),
    rawJson: text().optional(),
  },
  {
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const reimbursementClaims = table(
  {
    title: text().min(1).max(160),
    payerKind: select(PAYER_KINDS).default("external_counterparty"),
    businessEntityId: ref(legalEntities).optional().onDelete("setNull"),
    counterpartyPayeeId: ref(payees).optional().onDelete("setNull"),
    reimburseToAccountId: ref(accounts).optional().onDelete("setNull"),
    claimState: select(CLAIM_STATES).default("draft"),
    currency: select(CURRENCIES).default("EUR"),
    totalMinor: integer().default(0),
    reimbursedBaseMinor: integer().optional(),
    fxVarianceMinor: integer().default(0),
    payoutTransferId: ref(transfers).optional().onDelete("setNull"),
    payoutEntryId: ref(entries).optional().onDelete("setNull"),
    externalRef: text().max(120).optional(),
    submittedOn: date().optional(),
    paidOn: date().optional(),
    notes: text().optional(),
    createdAt: timestamp().$default(() => new Date().toISOString()),
  },
  {
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "admin",
    },
  },
);

export const reimbursementLines = table(
  {
    claimId: ref(reimbursementClaims).onDelete("cascade").reverse("lines"),
    sourceEntryId: ref(entries).onDelete("restrict"),
    businessCategoryId: ref(categories).optional().onDelete("setNull"),
    splitBps: integer().min(1).max(10000).default(10000),
    reimbursableMinor: integer(),
    currency: select(CURRENCIES).default("EUR"),
    baseMinor: integer(),
    receiptFileId: file(inboxFiles).optional(),
    notes: text().optional(),
  },
  {
    access: {
      read: "authenticated",
      create: "editor",
      update: "editor",
      delete: "editor",
    },
  },
);

// ---------------------------------------------------------------------------
// Access grants, collaborator invitations, and revocable share links
// ---------------------------------------------------------------------------

export const grants = table(
  {
    userId: integer(),
    entityId: ref(legalEntities).optional().onDelete("cascade"),
    accountId: ref(accounts).optional().onDelete("cascade"),
    role: select(["viewer", "accountant", "editor", "admin"]).default("accountant"),
    scope: select(["full", "tax_only", "read_only"]).default("tax_only"),
    dateFrom: date().optional(),
    dateTo: date().optional(),
    maskAmounts: boolean().default(false),
    revokedAt: timestamp().optional(),
    createdAt: timestamp().$default(() => new Date().toISOString()),
  },
  {
    access: {
      read: (ctx) => {
        if (!ctx.user) return false;
        if (ctx.user.role === "admin") return true;
        return { userId: ctx.user.id };
      },
      create: "admin",
      update: "admin",
      delete: "admin",
    },
  },
);

export const invitations = table(
  {
    recipientEmail: email().max(191),
    token: text().max(64).unique().$default(() => crypto.randomUUID()),
    entityId: ref(legalEntities).optional().onDelete("cascade"),
    role: select(["viewer", "accountant", "editor"]).default("accountant"),
    scope: select(["full", "tax_only", "read_only"]).default("tax_only"),
    dateFrom: date().optional(),
    dateTo: date().optional(),
    status: select(["pending", "accepted", "revoked", "expired"]).default("pending"),
    expiresAt: timestamp(),
    acceptedByUserId: integer().optional(),
    createdAt: timestamp().$default(() => new Date().toISOString()),
  },
  {
    access: {
      read: "admin",
      create: "admin",
      update: "admin",
      delete: "admin",
    },
  },
);

export const shareLinks = table(
  {
    label: text().min(1).max(120),
    token: text().max(64).unique().$default(() => crypto.randomUUID()),
    entityId: ref(legalEntities).optional().onDelete("cascade"),
    accountId: ref(accounts).optional().onDelete("cascade"),
    dateFrom: date().optional(),
    dateTo: date().optional(),
    includeReceipts: boolean().default(false),
    maskCounterparties: boolean().default(false),
    revokedAt: timestamp().optional(),
    expiresAt: timestamp().optional(),
    createdAt: timestamp().$default(() => new Date().toISOString()),
  },
  {
    access: {
      read: "admin",
      create: "admin",
      update: "admin",
      delete: "admin",
    },
  },
);
