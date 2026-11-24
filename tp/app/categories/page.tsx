import { db } from "typedpress";
import { Link } from "typedpress/app";
import { formatMinor } from "../../lib/money";

export const metadata = { title: "Categories & VAT" };

export default async function CategoriesPage() {
  const settings = await db.globals.financeSettings.get();
  const list = await db.query.categories.findMany({ orderBy: { id: "asc" }, limit: 200 });
  const entities = await db.query.legalEntities.findMany({ limit: 50 });
  const entityMap = new Map<number, { name: string; slug: string }>();
  for (const e of entities) entityMap.set(e.id, { name: e.name, slug: e.slug ?? String(e.id) });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Categories &amp; Chart of Accounts</h1>
          <p className="subtitle">Entity-aware personal budgets, Dutch B.V. BTW/ledger codes, and Turkish KDV categories.</p>
        </div>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Entity</th>
                <th>Group</th>
                <th>Ledger Code</th>
                <th>VAT</th>
                <th className="num">Monthly Budget</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr>
                  <td>
                    <Link href={`/categories/${c.slug}`}>{c.name}</Link>
                    {c.isIncome && <span className="pill pill-ok" style={{ marginLeft: "6px" }}>income</span>}
                  </td>
                  <td>
                    {c.entityId !== null && entityMap.has(c.entityId ?? 0) ? (
                      <Link href={`/entities/${entityMap.get(c.entityId ?? 0)?.slug ?? ""}`}>
                        <span className="pill pill-entity">{entityMap.get(c.entityId ?? 0)?.name ?? ""}</span>
                      </Link>
                    ) : (
                      <span className="pill">Shared</span>
                    )}
                  </td>
                  <td>{c.groupName}</td>
                  <td className="mono">{c.accountCode ?? "—"}</td>
                  <td className="mono">{c.vatRateBps > 0 ? `${(c.vatRateBps / 100).toFixed(0)}%` : "0%"}</td>
                  <td className="num">
                    {c.monthlyBudgetMinor ? formatMinor(c.monthlyBudgetMinor, settings.baseCurrency) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
