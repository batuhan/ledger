import { db } from "typedpress";
import { Content, Link, notFound, type PageProps } from "typedpress/app";
import { formatMinor, formatSignedMinor } from "../../../lib/money";

export const metadata = ({ item }: PageProps<"categories/[slug]">) => ({
  title: item?.name ?? "Category",
});

export default async function CategoryDetailPage({ item }: PageProps<"categories/[slug]">) {
  if (!item) notFound();
  const settings = await db.globals.financeSettings.get();
  const entity = item.entityId ? await db.query.legalEntities.findFirst({ where: { id: item.entityId } }) : null;
  const list = await db.query.entries.findMany({ where: { categoryId: item.id }, orderBy: { postedOn: "desc" }, limit: 50 });

  let totalBase = 0;
  for (const e of list) totalBase += e.baseAmountMinor;

  return (
    <>
      <div className="breadcrumb"><Link href="/categories">← Categories</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.name}</h1>
          <p className="subtitle">
            {item.groupName} · {entity ? <Link href={`/entities/${entity.slug}`}>{entity.name}</Link> : "Shared"}
            {item.accountCode ? ` · Code ${item.accountCode}` : ""}
          </p>
        </div>
        <div className="stat-value">{formatSignedMinor(totalBase, settings.baseCurrency)}</div>
      </div>

      <section className="card">
        <div className="kv-grid">
          <div><div className="kv-label">VAT Rate</div><div className="kv-val mono">{(item.vatRateBps / 100).toFixed(0)}%</div></div>
          <div>
            <div className="kv-label">Monthly Budget</div>
            <div className="kv-val mono">
              {item.monthlyBudgetMinor ? formatMinor(item.monthlyBudgetMinor, settings.baseCurrency) : "None"}
            </div>
          </div>
          <div>
            <div className="kv-label">Reporting Flags</div>
            <div className="kv-val">
              {item.excludeFromBudget ? "Excluded from budget" : "In budget"} · {item.excludeFromTotals ? "Excluded from totals" : "In totals"}
            </div>
          </div>
        </div>
        {item.notes && <div style={{ marginTop: "12px" }}><Content value={item.notes} /></div>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Entries in This Category ({list.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Status</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr>
                  <td className="mono">{e.postedOn}</td>
                  <td><Link href={`/entries/${e.id}`}>{e.description}</Link></td>
                  <td><span className="pill">{e.reviewStatus}</span></td>
                  <td className={e.amountMinor >= 0 ? "num pos" : "num neg"}>{formatSignedMinor(e.amountMinor, e.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
