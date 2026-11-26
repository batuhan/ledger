import { db } from "spacepress";
import { Content, Link, notFound, type PageProps } from "spacepress/app";
import { formatMinor, formatSignedMinor } from "../../../lib/money";

export const metadata = ({ item }: PageProps<"cards/[slug]">) => ({
  title: item?.name ?? "Card",
});

export default async function CardDetailPage({ item }: PageProps<"cards/[slug]">) {
  if (!item) notFound();
  const account = await db.query.accounts.findFirst({ where: { id: item.accountId } });
  const entity = await db.query.legalEntities.findFirst({ where: { id: item.entityId } });
  const cardEntries = await db.query.entries.findMany({ where: { cardId: item.id }, orderBy: { postedOn: "desc" }, limit: 40 });
  const plans = await db.query.installmentPlans.findMany({ where: { cardId: item.id }, limit: 20 });

  return (
    <>
      <div className="breadcrumb"><Link href="/cards">← Cards</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.name}</h1>
          <p className="subtitle">
            {item.network.toUpperCase()} {item.cardType} · •••• {item.last4} · {item.currency}
          </p>
        </div>
        <span className={item.cardState === "active" ? "pill pill-ok" : "pill pill-warn"}>{item.cardState}</span>
      </div>

      <section className="card">
        <div className="kv-grid">
          <div>
            <div className="kv-label">Linked Account</div>
            <div className="kv-val">{account ? <Link href={`/accounts/${account.slug}`}>{account.name}</Link> : "—"}</div>
          </div>
          <div>
            <div className="kv-label">Entity</div>
            <div className="kv-val">{entity ? <Link href={`/entities/${entity.slug}`}>{entity.name}</Link> : "—"}</div>
          </div>
          <div>
            <div className="kv-label">Monthly Limit / Expiry</div>
            <div className="kv-val">
              {item.monthlyLimitMinor ? formatMinor(item.monthlyLimitMinor, item.currency) : "Unlimited"} · Exp {item.expiresOn ?? "—"}
            </div>
          </div>
        </div>
        {item.notes && <div style={{ marginTop: "12px" }}><Content value={item.notes} /></div>}
      </section>

      {plans.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Card Installments (Taksit)</h2></div>
          <ul>
            {plans.map((p) => (
              <li><Link href={`/installments/${p.id}`}>{p.merchant}</Link> · {p.paidInstallments}/{p.totalInstallments} ({formatMinor(p.monthlyMinor, p.currency)}/mo)</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head"><h2>Recent Card Charges ({cardEntries.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Status</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {cardEntries.map((e) => (
                <tr>
                  <td className="mono">{e.postedOn}</td>
                  <td><Link href={`/entries/${e.id}`}>{e.description}</Link></td>
                  <td><span className="pill">{e.reviewStatus}</span></td>
                  <td className="num">{formatSignedMinor(e.amountMinor, e.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
