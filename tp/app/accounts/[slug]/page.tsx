import { db } from "typedpress";
import { Content, Link, notFound, type PageProps } from "typedpress/app";
import { InboxDropzone } from "../../../components/InboxDropzone";
import { formatMinor, formatSignedMinor } from "../../../lib/money";

export const metadata = ({ item }: PageProps<"accounts/[slug]">) => ({
  title: item?.name ?? "Account",
});

export default async function AccountDetailPage({ item }: PageProps<"accounts/[slug]">) {
  if (!item) notFound();
  const entity = await db.query.legalEntities.findFirst({ where: { id: item.entityId } });
  const institution = await db.query.institutions.findFirst({ where: { id: item.institutionId } });
  const subAccounts = await db.query.accounts.findMany({ where: { parentAccountId: item.id }, limit: 50 });
  const linkedCards = await db.query.cards.findMany({ where: { accountId: item.id }, limit: 20 });
  const accountEntries = await db.query.entries.findMany({ where: { accountId: item.id }, orderBy: { postedOn: "desc" }, limit: 50 });
  const plans = await db.query.installmentPlans.findMany({ where: { accountId: item.id }, limit: 20 });

  return (
    <>
      <div className="breadcrumb"><Link href="/accounts">← Accounts</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.name}</h1>
          <p className="subtitle">
            {institution?.name ?? ""} · {entity ? <Link href={`/entities/${entity.slug}`}>{entity.name}</Link> : ""} · {item.accountType}
          </p>
        </div>
        <div className="stat-value">{formatMinor(item.balanceMinor, item.currency)}</div>
      </div>

      <section className="card">
        <div className="kv-grid">
          <div><div className="kv-label">Currency</div><div className="kv-val mono">{item.currency}</div></div>
          <div><div className="kv-label">IBAN / Mask</div><div className="kv-val mono">{item.ibanOrMask ?? "—"}</div></div>
          <div>
            <div className="kv-label">Credit Limit / Cycle</div>
            <div className="kv-val">
              {item.creditLimitMinor ? formatMinor(item.creditLimitMinor, item.currency) : "N/A"}
              {item.statementCloseDay ? ` · Closes day ${item.statementCloseDay}` : ""}
              {item.paymentDueDay ? `, due day ${item.paymentDueDay}` : ""}
            </div>
          </div>
        </div>
        {item.notes && <div style={{ marginTop: "14px" }}><Content value={item.notes} /></div>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Import Statement Directly to This Account</h2></div>
        <InboxDropzone entityId={item.entityId} accountId={item.id} />
      </section>

      {subAccounts.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Sub-Accounts</h2></div>
          <ul>
            {subAccounts.map((sub) => (
              <li><Link href={`/accounts/${sub.slug}`}>{sub.name}</Link> — <span className="mono">{formatMinor(sub.balanceMinor, sub.currency)}</span></li>
            ))}
          </ul>
        </section>
      )}

      {linkedCards.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Cards Linked to This Account</h2></div>
          <ul>
            {linkedCards.map((c) => (
              <li><Link href={`/cards/${c.slug}`}>{c.name}</Link> ({c.cardType} · {c.network} •••• {c.last4}) — <span className="pill">{c.cardState}</span></li>
            ))}
          </ul>
        </section>
      )}

      {plans.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Active Taksit / Installments</h2></div>
          <ul>
            {plans.map((p) => (
              <li>
                <Link href={`/installments/${p.id}`}>{p.merchant}</Link> — {p.paidInstallments}/{p.totalInstallments} paid ({formatMinor(p.monthlyMinor, p.currency)}/mo)
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head"><h2>Account Ledger ({accountEntries.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Kind</th><th>Status</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {accountEntries.map((e) => (
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
    </>
  );
}
