import type { PageProps } from "./$types";
import { db } from "spacepress/server";
import { Content, Link, notFound, useFormState } from "spacepress/app";
import {
  computePosition,
  formatMinor,
  formatPctBps,
  formatQtyMicros,
  formatSignedMinor,
  type PositionTradeInput,
} from "../../../lib/money";
import { recordTrade, updateSecurityPrice } from "../../../server";

export const metadata = ({ item }: PageProps) => ({
  title: item ? `${item.ticker} · ${item.name}` : "Security",
});

export default async function SecurityDetailPage({ item }: PageProps) {
  if (!item) notFound();

  const priceForm = useFormState(updateSecurityPrice);
  const tradeForm = useFormState(recordTrade);
  const priceResult = priceForm.result;
  const tradeResult = tradeForm.result;

  const secTrades = await db.query.trades.findMany({ where: { securityId: item.id }, orderBy: { executedOn: "desc" }, limit: 200 });
  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, orderBy: { id: "asc" }, limit: 200 });
  const rates = await db.query.fxRates.findMany({ orderBy: { rateDate: "desc" }, limit: 100 });
  const settings = await db.globals.financeSettings.get();
  const baseCurrency = settings.baseCurrency;

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

  const fxRate = rateFor(item.currency);
  const tradeInputs: PositionTradeInput[] = secTrades.map((t) => ({
    tradeType: t.tradeType,
    executedOn: t.executedOn,
    quantityMicros: t.quantityMicros,
    priceMinor: t.priceMinor,
    feeMinor: t.feeMinor,
    baseTotalMinor: t.baseTotalMinor,
  }));
  const pos = computePosition(tradeInputs, item.lastPriceMinor, fxRate);

  const accountMap = new Map<number, { name: string; slug: string }>();
  for (const a of allAccounts) accountMap.set(a.id, { name: a.name, slug: a.slug ?? String(a.id) });

  const tradesByAccount = new Map<number, PositionTradeInput[]>();
  for (const t of secTrades) {
    const entry: PositionTradeInput = {
      tradeType: t.tradeType,
      executedOn: t.executedOn,
      quantityMicros: t.quantityMicros,
      priceMinor: t.priceMinor,
      feeMinor: t.feeMinor,
      baseTotalMinor: t.baseTotalMinor,
    };
    const existing = tradesByAccount.get(t.accountId);
    if (existing) existing.push(entry);
    else tradesByAccount.set(t.accountId, [entry]);
  }
  const accountPositions = Array.from(tradesByAccount.entries()).map(([accId, list]) => ({
    accId,
    acc: accountMap.get(accId),
    pos: computePosition(list, item.lastPriceMinor, fxRate),
  }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="breadcrumb"><Link href="/investments">← Investments &amp; Holdings</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.ticker} — {item.name}</h1>
          <p className="subtitle">
            {item.assetClass.replace("_", " ").toUpperCase()}
            {item.exchange ? ` · ${item.exchange}` : ""}
            {item.isin ? ` · ${item.isin}` : ""} · {item.currency}
          </p>
        </div>
        <div className="stat-value pos">{formatMinor(pos.marketNativeMinor, item.currency)}</div>
      </div>

      <section className="card">
        <div className="kv-grid">
          <div>
            <div className="kv-label">Quantity Held</div>
            <div className="kv-val mono">{formatQtyMicros(pos.qtyMicros)} {item.unitLabel}</div>
          </div>
          <div>
            <div className="kv-label">Average Cost / Unit</div>
            <div className="kv-val mono">{formatMinor(pos.avgCostMinor, item.currency)}</div>
          </div>
          <div>
            <div className="kv-label">Last Price ({item.lastPricedOn ?? "—"})</div>
            <div className="kv-val mono">{formatMinor(item.lastPriceMinor, item.currency)}</div>
          </div>
          <div>
            <div className="kv-label">Cost Basis ({baseCurrency})</div>
            <div className="kv-val mono">{formatMinor(pos.costBasisBaseMinor, baseCurrency)}</div>
          </div>
          <div>
            <div className="kv-label">Unrealized P&amp;L ({baseCurrency})</div>
            <div className={pos.unrealizedPnlBaseMinor >= 0 ? "kv-val mono pos" : "kv-val mono"}>
              {formatSignedMinor(pos.unrealizedPnlBaseMinor, baseCurrency)} ({formatPctBps(pos.unrealizedPnlPctBps)})
            </div>
          </div>
          <div>
            <div className="kv-label">Dividends Collected ({baseCurrency})</div>
            <div className="kv-val mono pos">{formatMinor(pos.dividendsBaseMinor, baseCurrency)}</div>
          </div>
        </div>
        {item.notes && <div style={{ marginTop: "12px" }}><Content value={item.notes} /></div>}
      </section>

      {accountPositions.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Holdings by Account</h2></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th className="num">Quantity</th>
                  <th className="num">Avg Cost</th>
                  <th className="num">Market Value</th>
                  <th className="num">P&amp;L ({baseCurrency})</th>
                </tr>
              </thead>
              <tbody>
                {accountPositions.map((ap) => (
                  <tr>
                    <td>
                      {ap.acc ? <Link href={`/accounts/${ap.acc.slug}`}>{ap.acc.name}</Link> : `Account #${ap.accId}`}
                    </td>
                    <td className="num">{formatQtyMicros(ap.pos.qtyMicros)} {item.unitLabel}</td>
                    <td className="num muted">{formatMinor(ap.pos.avgCostMinor, item.currency)}</td>
                    <td className="num">{formatMinor(ap.pos.marketNativeMinor, item.currency)}</td>
                    <td className={ap.pos.unrealizedPnlBaseMinor >= 0 ? "num pos" : "num"}>
                      {formatSignedMinor(ap.pos.unrealizedPnlBaseMinor, baseCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h2>Update Market / Valuation Price</h2></div>
          <form action={updateSecurityPrice}>
            <input type="hidden" name="securityId" value={item.id} />
            <div className="form-grid">
              <label className="field">
                Price ({item.currency})
                <input name="lastPrice" required defaultValue={(item.lastPriceMinor / 100).toFixed(2)} />
              </label>
              <label className="field">
                Valued On
                <input name="pricedOn" type="date" defaultValue={today} required />
              </label>
            </div>
            <div style={{ marginTop: "12px" }}>
              <button className="btn">Save Price</button>
            </div>
          </form>
          {priceForm.error && <p role="alert" className="muted">{priceForm.error.message}</p>}
          {priceResult && (
            <p role="status" className="banner">
              Updated {priceResult.ticker} price to {formatMinor(priceResult.lastPriceMinor, item.currency)} ({priceResult.lastPricedOn}).
            </p>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Record Trade / Vest / Dividend</h2></div>
          <form action={recordTrade}>
            <input type="hidden" name="securityId" value={item.id} />
            <div className="form-grid">
              <label className="field">
                Account
                <select name="accountId" required>
                  {allAccounts.map((a) => (
                    <option value={a.id} selected={a.accountType === "brokerage"}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Type
                <select name="tradeType">
                  <option value="buy" selected>Buy</option>
                  <option value="sell">Sell</option>
                  <option value="vest_grant">Vest / Grant</option>
                  <option value="transfer_in">Transfer In</option>
                  <option value="transfer_out">Transfer Out</option>
                  <option value="dividend">Dividend</option>
                  <option value="split">Split</option>
                  <option value="fee">Fee</option>
                </select>
              </label>
              <label className="field">
                Date
                <input name="executedOn" type="date" defaultValue={today} required />
              </label>
              <label className="field">
                Quantity ({item.unitLabel})
                <input name="quantity" required placeholder="10" />
              </label>
              <label className="field">
                Price ({item.currency})
                <input name="price" placeholder={(item.lastPriceMinor / 100).toFixed(2)} />
              </label>
              <label className="field">
                Fee ({item.currency})
                <input name="fee" placeholder="0.00" />
              </label>
            </div>
            <div style={{ marginTop: "12px" }}>
              <button className="btn">Record Activity</button>
            </div>
          </form>
          {tradeForm.error && <p role="alert" className="muted">{tradeForm.error.message}</p>}
          {tradeResult && (
            <p role="status" className="banner">
              Recorded {tradeResult.tradeType} #{tradeResult.id}.
            </p>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Trade &amp; Event History ({secTrades.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Account</th>
                <th>Type</th>
                <th className="num">Quantity</th>
                <th className="num">Price</th>
                <th className="num">Fee</th>
                <th className="num">Base Total</th>
              </tr>
            </thead>
            <tbody>
              {secTrades.map((t) => {
                const acc = accountMap.get(t.accountId);
                return (
                  <tr>
                    <td className="mono">{t.executedOn}</td>
                    <td className="muted">{acc ? <Link href={`/accounts/${acc.slug}`}>{acc.name}</Link> : `#${t.accountId}`}</td>
                    <td><span className="pill">{t.tradeType.replace("_", " ")}</span></td>
                    <td className="num">{t.quantityMicros > 0 ? `${formatQtyMicros(t.quantityMicros)} ${item.unitLabel}` : "—"}</td>
                    <td className="num">{formatMinor(t.priceMinor, t.currency)}</td>
                    <td className="num muted">{formatMinor(t.feeMinor, t.currency)}</td>
                    <td className="num">{formatMinor(t.baseTotalMinor, baseCurrency)}</td>
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
