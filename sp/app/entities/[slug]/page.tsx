import type { PageProps } from "./$types";
import { db } from "spacepress/server";
import { Content, Link, notFound } from "spacepress/app";
import { formatMinor, formatSignedMinor } from "../../../lib/money";

export const metadata = ({ item }: PageProps) => ({
  title: item?.name ?? "Entity",
});

export default async function EntityDetailPage({ item }: PageProps) {
  if (!item) notFound();
  const entityAccounts = await db.query.accounts.findMany({ where: { entityId: item.id }, orderBy: { id: "asc" }, limit: 100 });
  const entityCategories = await db.query.categories.findMany({ where: { entityId: item.id }, orderBy: { id: "asc" }, limit: 100 });
  const entityEntries = await db.query.entries.findMany({ where: { entityId: item.id }, orderBy: { postedOn: "desc" }, limit: 30 });
  const entityMemos = await db.query.financeMemos.findMany({ where: { entityId: item.id }, limit: 20 });

  return (
    <>
      <div className="breadcrumb"><Link href="/entities">← Legal Entities</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.name}</h1>
          <p className="subtitle">
            {item.country} · {item.entityType} · Base {item.baseCurrency}
            {item.taxId ? ` · Tax ID ${item.taxId}` : ""}
            {item.vatNumber ? ` · VAT ${item.vatNumber}` : ""}
          </p>
        </div>
        <Link href={`/inbox`} className="btn">Upload Statement</Link>
      </div>

      {item.notes && (
        <div className="card">
          <Content value={item.notes} />
        </div>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Accounts ({entityAccounts.length})</h2>
            <Link href="/accounts">All accounts →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Account</th><th>Type</th><th className="num">Balance</th></tr>
              </thead>
              <tbody>
                {entityAccounts.map((a) => (
                  <tr>
                    <td><Link href={`/accounts/${a.slug}`}>{a.name}</Link></td>
                    <td><span className="pill">{a.accountType}</span></td>
                    <td className="num">{formatMinor(a.balanceMinor, a.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Chart of Accounts / Categories ({entityCategories.length})</h2>
            <Link href="/categories">All categories →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Category</th><th>Code</th><th>VAT</th></tr>
              </thead>
              <tbody>
                {entityCategories.map((c) => (
                  <tr>
                    <td><Link href={`/categories/${c.slug}`}>{c.name}</Link></td>
                    <td className="mono">{c.accountCode ?? "—"}</td>
                    <td className="mono">{c.vatRateBps > 0 ? `${(c.vatRateBps / 100).toFixed(0)}%` : "0%"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Recent Ledger Entries</h2>
          <Link href="/entries">Full ledger →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Kind</th><th>Status</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {entityEntries.map((e) => (
                <tr>
                  <td className="mono">{e.postedOn}</td>
                  <td><Link href={`/entries/${e.id}`}>{e.description}</Link></td>
                  <td><span className="pill">{e.entryKind}</span></td>
                  <td><span className="pill">{e.reviewStatus}</span></td>
                  <td className={e.amountMinor >= 0 ? "num pos" : "num neg"}>{formatSignedMinor(e.amountMinor, e.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {entityMemos.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Tax &amp; Accountant Memos</h2></div>
          <ul>
            {entityMemos.map((m) => (
              <li><Link href={`/memos/${m.slug}`}>{m.title}</Link> · <span className="mono">{m.period}</span></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
