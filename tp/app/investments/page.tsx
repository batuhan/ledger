import { db } from "typedpress";
import { Link } from "typedpress/app";
import { formatMinor, formatQtyMicros } from "../../lib/money";

export const metadata = { title: "Investments" };

export default async function InvestmentsPage() {
  const allSecurities = await db.query.securities.findMany({ orderBy: { ticker: "asc" }, limit: 100 });
  const allTrades = await db.query.trades.findMany({ orderBy: { executedOn: "desc" }, limit: 500 });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Investments &amp; Holdings</h1>
          <p className="subtitle">Equities, UCITS ETFs, and trade ledger across brokerage accounts.</p>
        </div>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Security</th>
                <th>Asset Class</th>
                <th className="num">Shares</th>
                <th className="num">Last Price</th>
                <th className="num">Market Value</th>
              </tr>
            </thead>
            <tbody>
              {allSecurities.map((sec) => {
                const secTrades = allTrades.filter((t) => t.securityId === sec.id);
                let qtyMicros = 0;
                for (const t of secTrades) {
                  if (t.tradeType === "buy") qtyMicros += t.quantityMicros;
                  else if (t.tradeType === "sell") qtyMicros -= t.quantityMicros;
                }
                const valueMinor = Math.round((qtyMicros * sec.lastPriceMinor) / 1_000_000);
                return (
                  <tr>
                    <td className="mono"><strong><Link href={`/investments/${sec.slug}`}>{sec.ticker}</Link></strong></td>
                    <td><Link href={`/investments/${sec.slug}`}>{sec.name}</Link></td>
                    <td><span className="pill">{sec.assetClass}</span></td>
                    <td className="num">{formatQtyMicros(qtyMicros)}</td>
                    <td className="num">{formatMinor(sec.lastPriceMinor, sec.currency)}</td>
                    <td className="num pos">{formatMinor(valueMinor, sec.currency)}</td>
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
