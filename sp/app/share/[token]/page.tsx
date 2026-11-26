import type { PageProps } from "./$types";
import { notFound } from "spacepress/app";
import { accounts, entries, legalEntities, shareLinks } from "spacepress/server/db";
import { formatMinor, formatSignedMinor } from "../../../lib/money";

export const metadata = { title: "Shared Finance View" };

export default async function ShareViewPage({ params }: PageProps) {
  const matched = await shareLinks.system.list({ where: { token: params.token }, limit: 1 });
  const link = matched[0] ?? null;
  if (!link || link.revokedAt !== null) notFound();
  if (link.expiresAt !== null && link.expiresAt < new Date().toISOString()) notFound();

  const baseCurrency = "EUR";
  const entity = link.entityId !== null ? await legalEntities.system.get(link.entityId) : null;
  const scopedAccounts =
    link.entityId !== null
      ? await accounts.system.list({ where: { entityId: link.entityId }, limit: 100 })
      : await accounts.system.list({ limit: 100 });
  const rawEntries =
    link.entityId !== null
      ? await entries.system.list({ where: { entityId: link.entityId }, orderBy: { postedOn: "desc" }, limit: 250 })
      : await entries.system.list({ orderBy: { postedOn: "desc" }, limit: 250 });

  const filtered = rawEntries.filter((e) => {
    if (link.accountId !== null && e.accountId !== link.accountId) return false;
    if (link.dateFrom !== null && e.postedOn < link.dateFrom) return false;
    if (link.dateTo !== null && e.postedOn > link.dateTo) return false;
    return true;
  });

  let inflowBase = 0;
  let outflowBase = 0;
  for (const e of filtered) {
    if (e.excludeFromTotals) continue;
    if (e.baseAmountMinor >= 0) inflowBase += e.baseAmountMinor;
    else outflowBase += e.baseAmountMinor;
  }

  return (
    <>
      <div className="banner">
        <strong>Read-only shared view:</strong> {link.label}
        {entity ? ` · Scope: ${entity.name}` : " · All entities"}
        {link.dateFrom || link.dateTo ? ` · Window: ${link.dateFrom ?? "start"} to ${link.dateTo ?? "present"}` : ""}
      </div>

      <section className="grid-3">
        <div className="stat-card">
          <div className="stat-label">Scoped Entries</div>
          <div className="stat-value">{filtered.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inflows ({baseCurrency})</div>
          <div className="stat-value pos">{formatMinor(inflowBase, baseCurrency)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outflows ({baseCurrency})</div>
          <div className="stat-value">{formatMinor(outflowBase, baseCurrency)}</div>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Accounts in Scope ({scopedAccounts.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Account</th><th>Type</th><th className="num">Balance</th></tr>
            </thead>
            <tbody>
              {scopedAccounts.map((a) => (
                <tr>
                  <td>{a.name}</td>
                  <td><span className="pill">{a.accountType}</span></td>
                  <td className="num">{formatMinor(a.balanceMinor, a.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Ledger Entries</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Description</th><th>Kind</th><th className="num">Original</th><th className="num">Base ({baseCurrency})</th></tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr>
                  <td className="mono">{e.postedOn}</td>
                  <td>{link.maskCounterparties ? `${e.entryKind} #${e.id}` : e.description}</td>
                  <td><span className="pill">{e.entryKind}</span></td>
                  <td className={e.amountMinor >= 0 ? "num pos" : "num neg"}>{formatSignedMinor(e.amountMinor, e.currency)}</td>
                  <td className="num muted">{formatSignedMinor(e.baseAmountMinor, baseCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
