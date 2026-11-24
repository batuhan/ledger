import { db } from "typedpress";
import { Link } from "typedpress/app";
import { formatMinor } from "../../lib/money";

export const metadata = { title: "Taksit / Installments" };

export default async function InstallmentsPage() {
  const plans = await db.query.installmentPlans.findMany({ orderBy: { startedOn: "desc" }, limit: 100 });
  const allAccounts = await db.query.accounts.findMany({ limit: 200 });
  const accountMap = new Map<number, { name: string; slug: string }>();
  for (const a of allAccounts) accountMap.set(a.id, { name: a.name, slug: a.slug ?? String(a.id) });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Taksit &amp; Credit Card Installments</h1>
          <p className="subtitle">Track HSBC Turkey taksit schedules, paid progress, and remaining monthly commitments.</p>
        </div>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Merchant</th>
                <th>Account</th>
                <th>Progress</th>
                <th className="num">Monthly</th>
                <th className="num">Remaining</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => {
                const remainingCount = Math.max(0, p.totalInstallments - p.paidInstallments);
                const remainingMinor = remainingCount * p.monthlyMinor;
                const pct = Math.min(100, Math.round((p.paidInstallments / p.totalInstallments) * 100));
                return (
                  <tr>
                    <td><Link href={`/installments/${p.id}`}>{p.merchant}</Link></td>
                    <td><Link href={`/accounts/${accountMap.get(p.accountId)?.slug ?? ""}`}>{accountMap.get(p.accountId)?.name ?? ""}</Link></td>
                    <td>
                      <div className="mono" style={{ marginBottom: "4px" }}>{p.paidInstallments}/{p.totalInstallments}</div>
                      <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                    </td>
                    <td className="num">{formatMinor(p.monthlyMinor, p.currency)}</td>
                    <td className="num">{formatMinor(remainingMinor, p.currency)}</td>
                    <td className="num muted">{formatMinor(p.totalMinor, p.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
