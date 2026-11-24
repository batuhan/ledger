import { db } from "typedpress";
import { Link, notFound, type PageProps } from "typedpress/app";
import { EntryReviewActions } from "../../../components/EntryReviewActions";
import { formatMinor, formatRateMicros, formatSignedMinor } from "../../../lib/money";

export const metadata = { title: "Entry Detail" };

export default async function EntryDetailPage({ params }: PageProps<"entries/[id]">) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const entry = await db.query.entries.findFirst({ where: { id } });
  if (!entry) notFound();

  const settings = await db.globals.financeSettings.get();
  const entity = await db.query.legalEntities.findFirst({ where: { id: entry.entityId } });
  const account = await db.query.accounts.findFirst({ where: { id: entry.accountId } });
  const card = entry.cardId ? await db.query.cards.findFirst({ where: { id: entry.cardId } }) : null;
  const category = entry.categoryId ? await db.query.categories.findFirst({ where: { id: entry.categoryId } }) : null;
  const plan = entry.installmentPlanId
    ? await db.query.installmentPlans.findFirst({ where: { id: entry.installmentPlanId } })
    : null;
  const transfer = entry.transferId ? await db.query.transfers.findFirst({ where: { id: entry.transferId } }) : null;

  return (
    <>
      <div className="breadcrumb"><Link href="/entries">← Ledger Entries</Link></div>
      <div className="page-head">
        <div>
          <h1>{entry.description}</h1>
          <p className="subtitle">Entry #{entry.id} · Posted {entry.postedOn} · {entry.entryKind}</p>
        </div>
        <div className={entry.amountMinor >= 0 ? "stat-value pos" : "stat-value"}>
          {formatSignedMinor(entry.amountMinor, entry.currency)}
        </div>
      </div>

      <section className="card">
        <div className="card-head"><h2>Review &amp; Reporting Flags</h2></div>
        <EntryReviewActions
          entryId={entry.id}
          initialStatus={entry.reviewStatus}
          initialExcludeBudget={entry.excludeFromBudget}
          initialExcludeTotals={entry.excludeFromTotals}
        />
      </section>

      <section className="card">
        <div className="kv-grid">
          <div>
            <div className="kv-label">Entity</div>
            <div className="kv-val">{entity ? <Link href={`/entities/${entity.slug}`}>{entity.name}</Link> : "—"}</div>
          </div>
          <div>
            <div className="kv-label">Account</div>
            <div className="kv-val">{account ? <Link href={`/accounts/${account.slug}`}>{account.name}</Link> : "—"}</div>
          </div>
          <div>
            <div className="kv-label">Card</div>
            <div className="kv-val">{card ? <Link href={`/cards/${card.slug}`}>{card.name}</Link> : "—"}</div>
          </div>
          <div>
            <div className="kv-label">Category</div>
            <div className="kv-val">{category ? <Link href={`/categories/${category.slug}`}>{category.name}</Link> : "Uncategorized"}</div>
          </div>
          <div>
            <div className="kv-label">Normalized Base ({settings.baseCurrency})</div>
            <div className="kv-val mono">
              {formatSignedMinor(entry.baseAmountMinor, settings.baseCurrency)} (FX {formatRateMicros(entry.fxRateMicros)})
            </div>
          </div>
          <div>
            <div className="kv-label">VAT / Tax Component</div>
            <div className="kv-val mono">{entry.vatAmountMinor ? formatMinor(entry.vatAmountMinor, entry.currency) : "—"}</div>
          </div>
        </div>

        {entry.tagsJson && entry.tagsJson.length > 0 && (
          <div style={{ marginTop: "14px" }} className="action-bar">
            {entry.tagsJson.map((tag) => <span className="pill">#{tag}</span>)}
          </div>
        )}

        {entry.notes && <p style={{ marginTop: "14px" }}>{entry.notes}</p>}
      </section>

      {plan && (
        <section className="card">
          <div className="card-head"><h2>Linked Installment Plan (Taksit)</h2></div>
          <p>
            <Link href={`/installments/${plan.id}`}>{plan.merchant}</Link> — {plan.paidInstallments}/{plan.totalInstallments} paid ({formatMinor(plan.monthlyMinor, plan.currency)}/mo).
          </p>
        </section>
      )}

      {transfer && (
        <section className="card">
          <div className="card-head"><h2>Linked Transfer</h2></div>
          <p>
            {transfer.transferKind} on {transfer.executedOn}: {formatMinor(transfer.fromAmountMinor, transfer.fromCurrency)} → {formatMinor(transfer.toAmountMinor, transfer.toCurrency)}
            {transfer.reference ? ` (Ref: ${transfer.reference})` : ""}. <Link href="/transfers">View all transfers →</Link>
          </p>
        </section>
      )}
    </>
  );
}
