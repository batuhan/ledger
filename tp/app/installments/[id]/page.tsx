import { db } from "typedpress";
import { Link, notFound, type PageProps } from "typedpress/app";
import { formatMinor, formatSignedMinor } from "../../../lib/money";

export const metadata = { title: "Installment Plan" };

export default async function InstallmentDetailPage({ params }: PageProps<"installments/[id]">) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const plan = await db.query.installmentPlans.findFirst({ where: { id } });
  if (!plan) notFound();

  const account = await db.query.accounts.findFirst({ where: { id: plan.accountId } });
  const card = plan.cardId ? await db.query.cards.findFirst({ where: { id: plan.cardId } }) : null;
  const linkedEntries = await db.query.entries.findMany({ where: { installmentPlanId: plan.id }, orderBy: { postedOn: "desc" }, limit: 50 });

  const remainingCount = Math.max(0, plan.totalInstallments - plan.paidInstallments);
  const remainingMinor = remainingCount * plan.monthlyMinor;

  return (
    <>
      <div className="breadcrumb"><Link href="/installments">← Installments</Link></div>
      <div className="page-head">
        <div>
          <h1>{plan.merchant}</h1>
          <p className="subtitle">Started {plan.startedOn} · {plan.paidInstallments} of {plan.totalInstallments} installments paid</p>
        </div>
        <span className={plan.status === "active" ? "pill pill-warn" : "pill pill-ok"}>{plan.status}</span>
      </div>

      <section className="card">
        <div className="kv-grid">
          <div><div className="kv-label">Account</div><div className="kv-val">{account ? <Link href={`/accounts/${account.slug}`}>{account.name}</Link> : "—"}</div></div>
          <div><div className="kv-label">Card</div><div className="kv-val">{card ? <Link href={`/cards/${card.slug}`}>{card.name}</Link> : "—"}</div></div>
          <div><div className="kv-label">Monthly Payment</div><div className="kv-val mono">{formatMinor(plan.monthlyMinor, plan.currency)}</div></div>
          <div><div className="kv-label">Total Principal</div><div className="kv-val mono">{formatMinor(plan.totalMinor, plan.currency)}</div></div>
          <div><div className="kv-label">Remaining ({remainingCount} left)</div><div className="kv-val mono">{formatMinor(remainingMinor, plan.currency)}</div></div>
        </div>
        {plan.notes && <p style={{ marginTop: "12px" }}>{plan.notes}</p>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Posted Installment Entries ({linkedEntries.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {linkedEntries.map((e) => (
                <tr>
                  <td className="mono">{e.postedOn}</td>
                  <td><Link href={`/entries/${e.id}`}>{e.description}</Link></td>
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
