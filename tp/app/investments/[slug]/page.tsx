import { db } from "typedpress";
import { Content, Link, notFound, type PageProps } from "typedpress/app";
import { formatMinor, formatQtyMicros } from "../../../lib/money";

export const metadata = ({ item }: PageProps<"investments/[slug]">) => ({
  title: item ? `${item.ticker} · ${item.name}` : "Security",
});

export default async function SecurityDetailPage({ item }: PageProps<"investments/[slug]">) {
  if (!item) notFound();
  const secTrades = await db.query.trades.findMany({ where: { securityId: item.id }, orderBy: { executedOn: "desc" }, limit: 100 });
  const settings = await db.globals.financeSettings.get();

  let qtyMicros = 0;
  let costBaseMinor = 0;
  for (const t of secTrades) {
    if (t.tradeType === "buy") {
      qtyMicros += t.quantityMicros;
      costBaseMinor += t.baseTotalMinor;
    } else if (t.tradeType === "sell") {
      qtyMicros -= t.quantityMicros;
      costBaseMinor -= t.baseTotalMinor;
    }
  }
  const marketMinor = Math.round((qtyMicros * item.lastPriceMinor) / 1_000_000);

  return (
    <>
      <div className="breadcrumb"><Link href="/investments">← Investments</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.ticker} — {item.name}</h1>
          <p className="subtitle">{item.assetClass.toUpperCase()} · {item.isin ?? "No ISIN"} · {item.currency}</p>
        </div>
        <div className="stat-value pos">{formatMinor(marketMinor, item.currency)}</div>
      </div>

      <section className="card">
        <div className="kv-grid">
          <div><div className="kv-label">Position</div><div className="kv-val mono">{formatQtyMicros(qtyMicros)} shares</div></div>
          <div><div className="kv-label">Last Price ({item.lastPricedOn ?? "—"})</div><div className="kv-val mono">{formatMinor(item.lastPriceMinor, item.currency)}</div></div>
          <div><div className="kv-label">Cost Basis ({settings.baseCurrency})</div><div className="kv-val mono">{formatMinor(costBaseMinor, settings.baseCurrency)}</div></div>
        </div>
        {item.notes && <div style={{ marginTop: "12px" }}><Content value={item.notes} /></div>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Trade History ({secTrades.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th className="num">Quantity</th><th className="num">Price</th><th className="num">Fee</th><th className="num">Base Total</th></tr>
            </thead>
            <tbody>
              {secTrades.map((t) => (
                <tr>
                  <td className="mono">{t.executedOn}</td>
                  <td><span className="pill">{t.tradeType}</span></td>
                  <td className="num">{formatQtyMicros(t.quantityMicros)}</td>
                  <td className="num">{formatMinor(t.priceMinor, t.currency)}</td>
                  <td className="num muted">{formatMinor(t.feeMinor, t.currency)}</td>
                  <td className="num">{formatMinor(t.baseTotalMinor, settings.baseCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
