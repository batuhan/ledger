import { db } from "typedpress";
import { Link, useFormState } from "typedpress/app";
import { InboxDropzone } from "../components/InboxDropzone";
import { computePosition, convertToBaseMinor, formatMinor, formatPctBps, formatQtyMicros, formatSignedMinor } from "../lib/money";
import { seedDemoData } from "../server";

export const guard = "authenticated";
export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const seed = useFormState(seedDemoData);
  const settings = await db.globals.financeSettings.get();
  const baseCurrency = settings.baseCurrency;

  const entities = await db.query.legalEntities.findMany({ orderBy: { id: "asc" }, limit: 50 });
  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, orderBy: { id: "asc" }, limit: 200 });
  const rates = await db.query.fxRates.findMany({ orderBy: { rateDate: "desc" }, limit: 100 });
  const recentEntries = await db.query.entries.findMany({ orderBy: { postedOn: "desc" }, limit: 12 });
  const unreviewed = await db.query.entries.findMany({ where: { reviewStatus: "unreviewed" }, orderBy: { postedOn: "desc" }, limit: 50 });
  const activePlans = await db.query.installmentPlans.findMany({ where: { status: "active" }, limit: 20 });
  const upcomingRecurring = await db.query.recurringItems.findMany({ where: { scheduleState: "active" }, orderBy: { nextDueOn: "asc" }, limit: 10 });
  const pendingInbox = await db.query.ingestItems.findMany({ where: { ingestState: "needs_review" }, limit: 10 });
  const allClaims = await db.query.reimbursementClaims.findMany({ limit: 100 });
  const allSecurities = await db.query.securities.findMany({ orderBy: { ticker: "asc" }, limit: 50 });
  const allTrades = await db.query.trades.findMany({ limit: 500 });

  const rateFor = (from: string): number => {
    if (from === baseCurrency) return 1_000_000;
    const hit = rates.find((r) => r.fromCurrency === from && r.toCurrency === baseCurrency);
    if (hit) return hit.rateMicros;
    if (from === "TRY") return 26_500;
    if (from === "USD") return 920_000;
    if (from === "GBP") return 1_180_000;
    return 1_000_000;
  };

  let netWorthBase = 0;
  let liabilitiesBase = 0;
  const entityTotals = new Map<number, number>();
  for (const a of allAccounts) {
    if (a.excludeFromTotals) continue;
    const baseVal = convertToBaseMinor(a.balanceMinor, rateFor(a.currency));
    netWorthBase += baseVal;
    if (baseVal < 0) liabilitiesBase += baseVal;
    entityTotals.set(a.entityId, (entityTotals.get(a.entityId) ?? 0) + baseVal);
  }

  let receivablesBase = 0;
  let openExternalClaims = 0;
  let openInternalClaims = 0;
  for (const c of allClaims) {
    if (c.claimState === "paid" || c.claimState === "rejected") continue;
    if (c.payerKind === "external_counterparty") {
      receivablesBase += convertToBaseMinor(c.totalMinor, rateFor(c.currency));
      openExternalClaims += 1;
    } else {
      openInternalClaims += 1;
    }
  }

  let portfolioMarketBase = 0;
  let portfolioCostBase = 0;
  const topHoldings = allSecurities
    .map((sec) => {
      const pos = computePosition(
        allTrades
          .filter((t) => t.securityId === sec.id)
          .map((t) => ({
            tradeType: t.tradeType,
            executedOn: t.executedOn,
            quantityMicros: t.quantityMicros,
            priceMinor: t.priceMinor,
            feeMinor: t.feeMinor,
            baseTotalMinor: t.baseTotalMinor,
          })),
        sec.lastPriceMinor,
        rateFor(sec.currency),
      );
      portfolioMarketBase += pos.marketBaseMinor;
      portfolioCostBase += pos.costBasisBaseMinor;
      return { sec, pos };
    })
    .filter((h) => h.pos.qtyMicros > 0)
    .sort((a, b) => b.pos.marketBaseMinor - a.pos.marketBaseMinor);
  const portfolioPnlBase = portfolioMarketBase - portfolioCostBase;
  const portfolioPnlPctBps = portfolioCostBase > 0 ? Math.round((portfolioPnlBase * 10_000) / portfolioCostBase) : 0;

  const entityMap = new Map<number, { name: string; slug: string; country: string }>();
  for (const e of entities) {
    entityMap.set(e.id, { name: e.name, slug: e.slug ?? String(e.id), country: e.country });
  }
  const accountMap = new Map<number, { name: string; slug: string }>();
  for (const a of allAccounts) {
    accountMap.set(a.id, { name: a.name, slug: a.slug ?? String(a.id) });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{settings.workspaceName}</h1>
          <p className="subtitle">
            Consolidated view in {baseCurrency} across {entities.length} legal entities and {allAccounts.length} accounts.
          </p>
        </div>
        <div className="action-bar">
          <Link href="/entries" className="btn">Record Entry</Link>
          <Link href="/transfers" className="btn btn-ghost">New Transfer / FX</Link>
        </div>
      </div>

      {entities.length === 0 && (
        <div className="card">
          <div className="card-head">
            <h2>Start with realistic multi-entity demo data</h2>
          </div>
          <p className="muted">
            Seed Personal, Spacefast Holdings B.V. (NL), and Bosphorus Labs Ltd. (TR) with bunq, Wise, HSBC Turkey
            (including a 6-month taksit plan), IBKR investments, FX rates, and an accountant share link.
          </p>
          <form action={seedDemoData}>
            <button className="btn">Seed Demo Workspace</button>
          </form>
          {seed.result && <p className="banner">{seed.result.message} Refresh to view your seeded workspace.</p>}
          {seed.error && <p className="muted" role="alert">{seed.error.message}</p>}
        </div>
      )}

      <section className="grid-4">
        <div className="stat-card">
          <div className="stat-label">Net Worth ({baseCurrency})</div>
          <div className="stat-value">{formatMinor(netWorthBase, baseCurrency)}</div>
          <div className="stat-meta">{allAccounts.length} active accounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Owed to You (Receivables)</div>
          <div className="stat-value pos">{formatMinor(receivablesBase, baseCurrency)}</div>
          <div className="stat-meta">
            <Link href="/reimbursements">
              {openExternalClaims} external · {openInternalClaims} internal claim(s) →
            </Link>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Card / Debt Balances</div>
          <div className="stat-value">{formatMinor(liabilitiesBase, baseCurrency)}</div>
          <div className="stat-meta">{activePlans.length} active taksit plans</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Review &amp; Inbox Queue</div>
          <div className="stat-value">{unreviewed.length + pendingInbox.length}</div>
          <div className="stat-meta">
            <Link href="/entries?status=unreviewed">{unreviewed.length} entries</Link> ·{" "}
            <Link href="/inbox">{pendingInbox.length} imports</Link>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Quick Drop Inbox</h2>
          <Link href="/inbox">All imports →</Link>
        </div>
        <InboxDropzone />
      </section>

      <section className="grid-3">
        {entities.map((entity) => (
          <div className="card">
            <div className="card-head">
              <h2><Link href={`/entities/${entity.slug}`}>{entity.name}</Link></h2>
              <span className="pill pill-entity">{entity.country} · {entity.entityType}</span>
            </div>
            <div className="stat-value">{formatMinor(entityTotals.get(entity.id) ?? 0, baseCurrency)}</div>
            <div className="stat-meta">Base currency {entity.baseCurrency}{entity.vatNumber ? ` · VAT ${entity.vatNumber}` : ""}</div>
          </div>
        ))}
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Recent Ledger Entries</h2>
            <Link href="/entries">Full ledger →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr>
                    <td className="mono">{entry.postedOn}</td>
                    <td>
                      <Link href={`/entries/${entry.id}`}>{entry.description}</Link>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>
                        {entityMap.get(entry.entityId)?.name ?? ""} · {accountMap.get(entry.accountId)?.name ?? ""}
                      </div>
                    </td>
                    <td>
                      <span className={entry.reviewStatus === "reviewed" ? "pill pill-ok" : entry.reviewStatus === "flagged" ? "pill pill-danger" : "pill pill-warn"}>
                        {entry.reviewStatus}
                      </span>
                    </td>
                    <td className={entry.amountMinor >= 0 ? "num pos" : "num neg"}>
                      {formatSignedMinor(entry.amountMinor, entry.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Upcoming Recurring &amp; Taksit</h2>
            <Link href="/recurring">All schedules →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Next / Progress</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {upcomingRecurring.map((r) => (
                  <tr>
                    <td><Link href={`/recurring/${r.slug}`}>{r.name}</Link></td>
                    <td className="mono">{r.nextDueOn} · {r.cadence}</td>
                    <td className="num">{formatSignedMinor(r.amountMinor, r.currency)}</td>
                  </tr>
                ))}
                {activePlans.map((p) => (
                  <tr>
                    <td><Link href={`/installments/${p.id}`}>{p.merchant}</Link></td>
                    <td><span className="pill">{p.paidInstallments}/{p.totalInstallments} taksit</span></td>
                    <td className="num">{formatMinor(-p.monthlyMinor, p.currency)}/mo</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {topHoldings.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2>
              Portfolio &amp; Holdings — {formatMinor(portfolioMarketBase, baseCurrency)}{" "}
              <span className={portfolioPnlBase >= 0 ? "pill pill-ok" : "pill"}>
                {formatSignedMinor(portfolioPnlBase, baseCurrency)} ({formatPctBps(portfolioPnlPctBps)})
              </span>
            </h2>
            <Link href="/investments">Manage stocks &amp; assets →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Asset</th>
                  <th>Class</th>
                  <th className="num">Quantity</th>
                  <th className="num">Last Price</th>
                  <th className="num">Value ({baseCurrency})</th>
                  <th className="num">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {topHoldings.slice(0, 6).map(({ sec, pos }) => (
                  <tr>
                    <td className="mono"><strong><Link href={`/investments/${sec.slug}`}>{sec.ticker}</Link></strong></td>
                    <td><Link href={`/investments/${sec.slug}`}>{sec.name}</Link></td>
                    <td><span className="pill">{sec.assetClass.replace("_", " ")}</span></td>
                    <td className="num">{formatQtyMicros(pos.qtyMicros)} <span className="muted">{sec.unitLabel}</span></td>
                    <td className="num">{formatMinor(sec.lastPriceMinor, sec.currency)}</td>
                    <td className="num">{formatMinor(pos.marketBaseMinor, baseCurrency)}</td>
                    <td className={pos.unrealizedPnlBaseMinor >= 0 ? "num pos" : "num"}>
                      {formatPctBps(pos.unrealizedPnlPctBps)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
