import type { PageProps } from "./$types";
import { db } from "spacepress/server";
import { Content, Link, notFound } from "spacepress/app";
import { formatSignedMinor } from "../../../lib/money";

export const metadata = ({ item }: PageProps) => ({
  title: item?.name ?? "Recurring Item",
});

export default async function RecurringDetailPage({ item }: PageProps) {
  if (!item) notFound();
  const entity = await db.query.legalEntities.findFirst({ where: { id: item.entityId } });
  const account = await db.query.accounts.findFirst({ where: { id: item.accountId } });
  const category = item.categoryId ? await db.query.categories.findFirst({ where: { id: item.categoryId } }) : null;

  return (
    <>
      <div className="breadcrumb"><Link href="/recurring">← Recurring</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.name}</h1>
          <p className="subtitle">{item.cadence} · Next due {item.nextDueOn}</p>
        </div>
        <div className="stat-value">{formatSignedMinor(item.amountMinor, item.currency)}</div>
      </div>

      <section className="card">
        <div className="kv-grid">
          <div><div className="kv-label">Entity</div><div className="kv-val">{entity ? <Link href={`/entities/${entity.slug}`}>{entity.name}</Link> : "—"}</div></div>
          <div><div className="kv-label">Account</div><div className="kv-val">{account ? <Link href={`/accounts/${account.slug}`}>{account.name}</Link> : "—"}</div></div>
          <div><div className="kv-label">Category</div><div className="kv-val">{category ? <Link href={`/categories/${category.slug}`}>{category.name}</Link> : "—"}</div></div>
          <div><div className="kv-label">Billing Day</div><div className="kv-val">Day {item.billingDay}</div></div>
          <div><div className="kv-label">Auto-Pay</div><div className="kv-val">{item.autoPay ? "Enabled" : "Manual"}</div></div>
          <div><div className="kv-label">Status</div><div className="kv-val"><span className="pill">{item.scheduleState}</span></div></div>
        </div>
        {item.notes && <div style={{ marginTop: "12px" }}><Content value={item.notes} /></div>}
      </section>
    </>
  );
}
