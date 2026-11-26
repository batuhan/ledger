import { db } from "spacepress/server";
import { Link } from "spacepress/app";
import { formatSignedMinor } from "../../lib/money";

export const metadata = { title: "Recurring" };

export default async function RecurringPage() {
  const list = await db.query.recurringItems.findMany({ orderBy: { nextDueOn: "asc" }, limit: 100 });
  const entities = await db.query.legalEntities.findMany({ limit: 50 });
  const entityMap = new Map<number, { name: string; slug: string }>();
  for (const e of entities) entityMap.set(e.id, { name: e.name, slug: e.slug ?? String(e.id) });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Recurring Bills &amp; Retainers</h1>
          <p className="subtitle">Subscriptions, office leases, payroll, and retainers tracked across entities.</p>
        </div>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Entity</th><th>Cadence</th><th>Next Due</th><th>Status</th><th className="num">Amount</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr>
                  <td><Link href={`/recurring/${r.slug}`}>{r.name}</Link></td>
                  <td><span className="pill pill-entity">{entityMap.get(r.entityId)?.name ?? ""}</span></td>
                  <td>{r.cadence} (day {r.billingDay})</td>
                  <td className="mono">{r.nextDueOn}</td>
                  <td><span className={r.scheduleState === "active" ? "pill pill-ok" : "pill"}>{r.scheduleState}</span></td>
                  <td className="num">{formatSignedMinor(r.amountMinor, r.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
