import { db } from "spacepress";
import { Link, useFormState } from "spacepress/app";
import { RefreshPricesButton } from "../../components/RefreshPricesButton";
import { computePosition, formatMinor, formatPctBps, formatQtyMicros, formatSignedMinor } from "../../lib/money";
import { createSecurity, recordTrade } from "../../server";

export const metadata = { title: "Investments & Holdings" };

export default async function InvestmentsPage() {
  const addAssetForm = useFormState(createSecurity);
  const tradeForm = useFormState(recordTrade);
  const addAssetResult = addAssetForm.result;
  const tradeResult = tradeForm.result;

  const settings = await db.globals.financeSettings.get();
  const baseCurrency = settings.baseCurrency;

  const allSecurities = await db.query.securities.findMany({ orderBy: { ticker: "asc" }, limit: 200 });
  const allTrades = await db.query.trades.findMany({ orderBy: { executedOn: "desc" }, limit: 1000 });
  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, orderBy: { id: "asc" }, limit: 200 });
  const rates = await db.query.fxRates.findMany({ orderBy: { rateDate: "desc" }, limit: 100 });

  const rateFor = (from: string): number => {
    if (from === baseCurrency) return 1_000_000;
    const hit = rates.find((r) => r.fromCurrency === from && r.toCurrency === baseCurrency);
    if (hit) return hit.rateMicros;
    if (from === "TRY") return 26_500;
    if (from === "USD") return 920_000;
    if (from === "GBP") return 1_180_000;
    if (from === "CHF") return 1_060_000;
    return 1_000_000;
  };

  let totalMarketBase = 0;
  let totalCostBase = 0;
  let totalDividendsBase = 0;
  let activeHoldingsCount = 0;
  const classTotals = new Map<string, number>();

  const rows = allSecurities.map((sec) => {
    const secTrades = allTrades
      .filter((t) => t.securityId === sec.id)
      .map((t) => ({
        tradeType: t.tradeType,
        executedOn: t.executedOn,
        quantityMicros: t.quantityMicros,
        priceMinor: t.priceMinor,
        feeMinor: t.feeMinor,
        baseTotalMinor: t.baseTotalMinor,
      }));
    const pos = computePosition(secTrades, sec.lastPriceMinor, rateFor(sec.currency));
    if (pos.qtyMicros > 0) activeHoldingsCount += 1;
    totalMarketBase += pos.marketBaseMinor;
    totalCostBase += pos.costBasisBaseMinor;
    totalDividendsBase += pos.dividendsBaseMinor;
    classTotals.set(sec.assetClass, (classTotals.get(sec.assetClass) ?? 0) + pos.marketBaseMinor);
    return { sec, pos };
  });

  const totalPnlBase = totalMarketBase - totalCostBase;
  const totalPnlPctBps = totalCostBase > 0 ? Math.round((totalPnlBase * 10_000) / totalCostBase) : 0;
  const classEntries: Array<{ cls: string; val: number }> = [];
  for (const [cls, val] of classTotals.entries()) {
    classEntries.push({ cls, val });
  }
  classEntries.sort((a, b) => b.val - a.val);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Investments, Stocks &amp; Holdings</h1>
          <p className="subtitle">
            Track exact share counts, crypto balances, private equity / RSUs, cost basis, dividends, and unrealized P&amp;L.
          </p>
        </div>
        <RefreshPricesButton />
      </div>

      <section className="grid-4">
        <div className="stat-card">
          <div className="stat-label">Portfolio Value ({baseCurrency})</div>
          <div className="stat-value">{formatMinor(totalMarketBase, baseCurrency)}</div>
          <div className="stat-meta">{activeHoldingsCount} active holding(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cost Basis ({baseCurrency})</div>
          <div className="stat-value">{formatMinor(totalCostBase, baseCurrency)}</div>
          <div className="stat-meta">{allTrades.length} recorded trade(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unrealized P&amp;L</div>
          <div className={totalPnlBase >= 0 ? "stat-value pos" : "stat-value"}>
            {formatSignedMinor(totalPnlBase, baseCurrency)}
          </div>
          <div className="stat-meta">{formatPctBps(totalPnlPctBps)} overall return</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dividends Collected</div>
          <div className="stat-value pos">{formatMinor(totalDividendsBase, baseCurrency)}</div>
          <div className="stat-meta">{classEntries.length} asset class(es)</div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Holdings ({rows.length})</h2>
          <span className="muted">Normalized to {baseCurrency}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Asset</th>
                <th>Class</th>
                <th className="num">Quantity</th>
                <th className="num">Avg Cost</th>
                <th className="num">Last Price</th>
                <th className="num">Market Value</th>
                <th className="num">P&amp;L ({baseCurrency})</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ sec, pos }) => {
                const weightPct = totalMarketBase > 0 ? Math.round((pos.marketBaseMinor * 100) / totalMarketBase) : 0;
                return (
                  <tr>
                    <td className="mono">
                      <strong><Link href={`/investments/${sec.slug}`}>{sec.ticker}</Link></strong>
                      {sec.exchange && <div className="muted" style={{ fontSize: "0.74rem" }}>{sec.exchange}</div>}
                    </td>
                    <td>
                      <Link href={`/investments/${sec.slug}`}>{sec.name}</Link>
                      {sec.isin && <div className="muted mono" style={{ fontSize: "0.74rem" }}>{sec.isin}</div>}
                    </td>
                    <td><span className="pill">{sec.assetClass.replace("_", " ")}</span></td>
                    <td className="num">
                      <strong>{formatQtyMicros(pos.qtyMicros)}</strong>{" "}
                      <span className="muted">{sec.unitLabel}</span>
                    </td>
                    <td className="num muted">{formatMinor(pos.avgCostMinor, sec.currency)}</td>
                    <td className="num">{formatMinor(sec.lastPriceMinor, sec.currency)}</td>
                    <td className="num">
                      <div><strong>{formatMinor(pos.marketNativeMinor, sec.currency)}</strong></div>
                      {sec.currency !== baseCurrency && (
                        <div className="muted" style={{ fontSize: "0.76rem" }}>
                          {formatMinor(pos.marketBaseMinor, baseCurrency)}
                        </div>
                      )}
                    </td>
                    <td className={pos.unrealizedPnlBaseMinor >= 0 ? "num pos" : "num"}>
                      <div>{formatSignedMinor(pos.unrealizedPnlBaseMinor, baseCurrency)}</div>
                      <div style={{ fontSize: "0.76rem" }}>{formatPctBps(pos.unrealizedPnlPctBps)}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.78rem" }} className="mono">{weightPct}%</div>
                      <div className="progress"><div className="progress-fill" style={{ width: `${weightPct}%` }} /></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {classEntries.length > 0 && (
        <section className="grid-4">
          {classEntries.map(({ cls, val }) => {
            const pct = totalMarketBase > 0 ? Math.round((val * 100) / totalMarketBase) : 0;
            return (
              <div className="stat-card">
                <div className="stat-label">{cls.replace("_", " ")}</div>
                <div className="stat-value">{formatMinor(val, baseCurrency)}</div>
                <div className="stat-meta">{pct}% of portfolio</div>
              </div>
            );
          })}
        </section>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h2>Add Stock, ETF, Crypto or Other Asset</h2></div>
          <form action={createSecurity}>
            <div className="form-grid">
              <label className="field">
                Ticker / Symbol
                <input name="ticker" required placeholder="AAPL, VWCE.DE, BTC, GOLD" />
              </label>
              <label className="field">
                Asset Name
                <input name="name" required placeholder="Apple Inc." />
              </label>
              <label className="field">
                Asset Class
                <select name="assetClass">
                  <option value="stock" selected>Stock</option>
                  <option value="etf">ETF</option>
                  <option value="crypto">Crypto</option>
                  <option value="private_equity">Private Equity</option>
                  <option value="rsu_option">RSU / Options</option>
                  <option value="commodity">Commodity (Gold/Silver)</option>
                  <option value="bond">Bond</option>
                  <option value="fund">Fund</option>
                  <option value="money_market">Money Market</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="field">
                Currency
                <select name="currency">
                  <option value="USD" selected>USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </label>
              <label className="field">
                Exchange / Venue
                <input name="exchange" placeholder="NASDAQ, XETRA, BIST, PRIVATE" />
              </label>
              <label className="field">
                Unit Label
                <input name="unitLabel" placeholder="shares, BTC, oz, grams" />
              </label>
              <label className="field">
                Current Price / Unit
                <input name="lastPrice" placeholder="225.50" />
              </label>
              <label className="field">
                Starting Quantity (optional)
                <input name="initialQuantity" placeholder="e.g. 50 or 0.25" />
              </label>
              <label className="field">
                Avg Buy / Vest Price (optional)
                <input name="initialAvgPrice" placeholder="Defaults to current price" />
              </label>
              <label className="field">
                Holding Account (for starting lot)
                <select name="accountId">
                  {allAccounts.map((a) => (
                    <option value={a.id} selected={a.accountType === "brokerage"}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Starting Lot Type
                <select name="initialTradeType">
                  <option value="buy" selected>Buy</option>
                  <option value="vest_grant">Vest / Equity Grant</option>
                  <option value="transfer_in">Transfer In</option>
                </select>
              </label>
              <label className="field">
                ISIN (optional)
                <input name="isin" placeholder="US0378331005" />
              </label>
            </div>
            <div style={{ marginTop: "12px" }}>
              <button className="btn">Add Asset</button>
            </div>
          </form>
          {addAssetForm.error && <p role="alert" className="muted">{addAssetForm.error.message}</p>}
          {addAssetResult && (
            <p role="status" className="banner">
              Added <strong>{addAssetResult.ticker}</strong>.{" "}
              <Link href={`/investments/${addAssetResult.slug}`}>Open holding →</Link>
            </p>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Record Trade, Vest, Dividend or Split</h2></div>
          <form action={recordTrade}>
            <div className="form-grid">
              <label className="field">
                Asset / Security
                <select name="securityId" required>
                  {allSecurities.map((s) => (
                    <option value={s.id}>{s.ticker} — {s.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Account / Broker
                <select name="accountId" required>
                  {allAccounts.map((a) => (
                    <option value={a.id} selected={a.accountType === "brokerage"}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Event Type
                <select name="tradeType">
                  <option value="buy" selected>Buy</option>
                  <option value="sell">Sell</option>
                  <option value="vest_grant">Vest / Stock Grant</option>
                  <option value="transfer_in">Transfer In</option>
                  <option value="transfer_out">Transfer Out</option>
                  <option value="dividend">Dividend</option>
                  <option value="split">Stock Split (multiplier)</option>
                  <option value="fee">Custody / Broker Fee</option>
                </select>
              </label>
              <label className="field">
                Date
                <input name="executedOn" type="date" defaultValue={today} required />
              </label>
              <label className="field">
                Quantity (or split ratio)
                <input name="quantity" required placeholder="e.g. 25, 0.15, or 4 for 4:1 split" />
              </label>
              <label className="field">
                Price / Unit (or Dividend Total)
                <input name="price" placeholder="135.00" />
              </label>
              <label className="field">
                Commission / Fee
                <input name="fee" placeholder="0.00" />
              </label>
              <label className="field">
                Notes
                <input name="notes" placeholder="Optional order / lot note" />
              </label>
            </div>
            <div style={{ marginTop: "12px" }}>
              <button className="btn">Record Activity</button>
            </div>
          </form>
          {tradeForm.error && <p role="alert" className="muted">{tradeForm.error.message}</p>}
          {tradeResult && (
            <p role="status" className="banner">
              Recorded {tradeResult.tradeType} event #{tradeResult.id} ({formatMinor(tradeResult.baseTotalMinor, baseCurrency)}).
            </p>
          )}
        </section>
      </div>
    </>
  );
}
