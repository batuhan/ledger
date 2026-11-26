import { db } from "spacepress/server";
import { Link } from "spacepress/app";
import { convertToBaseMinor, formatMinor } from "../../lib/money";

export const metadata = { title: "Legal Entities" };

export default async function EntitiesPage() {
  const settings = await db.globals.financeSettings.get();
  const entities = await db.query.legalEntities.findMany({ orderBy: { id: "asc" }, limit: 100 });
  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, limit: 300 });
  const rates = await db.query.fxRates.findMany({ orderBy: { rateDate: "desc" }, limit: 100 });

  const rateFor = (from: string): number => {
    if (from === settings.baseCurrency) return 1_000_000;
    const hit = rates.find((r) => r.fromCurrency === from && r.toCurrency === settings.baseCurrency);
    if (hit) return hit.rateMicros;
    if (from === "TRY") return 26_500;
    if (from === "USD") return 920_000;
    if (from === "GBP") return 1_180_000;
    return 1_000_000;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Legal Entities</h1>
          <p className="subtitle">Separate personal wealth, Dutch B.V., and Turkish operations under one ledger.</p>
        </div>
      </div>

      <section className="grid-3">
        {entities.map((entity) => {
          const accs = allAccounts.filter((a) => a.entityId === entity.id);
          let totalBase = 0;
          for (const a of accs) {
            if (!a.excludeFromTotals) totalBase += convertToBaseMinor(a.balanceMinor, rateFor(a.currency));
          }
          return (
            <div className="card">
              <div className="card-head">
                <h2><Link href={`/entities/${entity.slug}`}>{entity.name}</Link></h2>
                <span className="pill pill-entity">{entity.country}</span>
              </div>
              <div className="stat-value">{formatMinor(totalBase, settings.baseCurrency)}</div>
              <p className="stat-meta">
                {entity.entityType} · Base {entity.baseCurrency} · {accs.length} accounts
              </p>
              {entity.taxId && <p className="muted mono">Tax ID: {entity.taxId}</p>}
              {entity.vatNumber && <p className="muted mono">VAT: {entity.vatNumber}</p>}
              <p><Link href={`/entities/${entity.slug}`}>Open entity detail →</Link></p>
            </div>
          );
        })}
      </section>
    </>
  );
}
