import { db } from "spacepress/server";
import { Link, useFormState } from "spacepress/app";
import { convertToBaseMinor, formatMinor, formatSignedMinor } from "../../lib/money";
import { createReimbursementClaim } from "../../server";

export const metadata = { title: "Reimbursements" };

export default async function ReimbursementsPage() {
  const form = useFormState(createReimbursementClaim);
  const settings = await db.globals.financeSettings.get();
  const baseCurrency = settings.baseCurrency;

  const claims = await db.query.reimbursementClaims.findMany({ orderBy: { id: "desc" }, limit: 100 });
  const entities = await db.query.legalEntities.findMany({ orderBy: { id: "asc" }, limit: 50 });
  const allPayees = await db.query.payees.findMany({ orderBy: { name: "asc" }, limit: 200 });
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

  const entityMap = new Map<number, string>();
  for (const e of entities) entityMap.set(e.id, e.name);
  const payeeMap = new Map<number, string>();
  for (const p of allPayees) payeeMap.set(p.id, p.name);
  const accountMap = new Map<number, string>();
  for (const a of allAccounts) accountMap.set(a.id, a.name);

  let externalOwedBase = 0;
  let externalOpenCount = 0;
  let internalPendingBase = 0;
  let internalOpenCount = 0;
  let settledTotalBase = 0;
  let settledCount = 0;
  let totalFxVarianceBase = 0;

  for (const c of claims) {
    const baseVal = convertToBaseMinor(c.totalMinor, rateFor(c.currency));
    if (c.claimState === "paid") {
      settledTotalBase += c.reimbursedBaseMinor ?? baseVal;
      settledCount += 1;
      totalFxVarianceBase += c.fxVarianceMinor;
    } else if (c.claimState !== "rejected") {
      if (c.payerKind === "external_counterparty") {
        externalOwedBase += baseVal;
        externalOpenCount += 1;
      } else {
        internalPendingBase += baseVal;
        internalOpenCount += 1;
      }
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reimbursements &amp; Receivables</h1>
          <p className="subtitle">
            Track expenses owed to you by external employers/clients (e.g. Automattic Inc.) and internal out-of-pocket claims for your own legal entities.
          </p>
        </div>
      </div>

      <section className="grid-4">
        <div className="stat-card">
          <div className="stat-label">Owed to You (External)</div>
          <div className="stat-value pos">{formatMinor(externalOwedBase, baseCurrency)}</div>
          <div className="stat-meta">{externalOpenCount} open external claim(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Internal (B.V. / TR)</div>
          <div className="stat-value">{formatMinor(internalPendingBase, baseCurrency)}</div>
          <div className="stat-meta">{internalOpenCount} open inter-entity claim(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Settled Reimbursements</div>
          <div className="stat-value">{formatMinor(settledTotalBase, baseCurrency)}</div>
          <div className="stat-meta">{settledCount} paid claim(s)</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cumulative FX Variance</div>
          <div className={totalFxVarianceBase >= 0 ? "stat-value pos" : "stat-value"}>
            {formatSignedMinor(totalFxVarianceBase, baseCurrency)}
          </div>
          <div className="stat-meta">Payout vs. original spend FX delta</div>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>New Reimbursement Claim</h2></div>
        <form action={createReimbursementClaim}>
          <div className="form-grid">
            <label className="field">
              Claim Title
              <input name="title" required placeholder="Automattic Summit Travel — Oct 2026" />
            </label>
            <label className="field">
              Payer Type
              <select name="payerKind">
                <option value="external_counterparty" selected>External Counterparty (Employer / Client)</option>
                <option value="internal_entity">Internal Legal Entity (e.g. Dutch B.V.)</option>
              </select>
            </label>
            <label className="field">
              Claim Currency
              <select name="currency">
                <option value="EUR" selected>EUR</option>
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </select>
            </label>
            <label className="field">
              External Payer (existing payee)
              <select name="counterpartyPayeeId">
                <option value="">— Select counterparty —</option>
                {allPayees.map((p) => <option value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="field">
              Or New External Counterparty Name
              <input name="newCounterpartyName" placeholder="e.g. Automattic Inc., Acme Client" />
            </label>
            <label className="field">
              Internal Paying Entity (if internal)
              <select name="businessEntityId">
                <option value="">— Select legal entity —</option>
                {entities.map((e) => <option value={e.id}>{e.name} ({e.country})</option>)}
              </select>
            </label>
            <label className="field">
              Reimburse Into Account
              <select name="reimburseToAccountId">
                <option value="">— Choose later —</option>
                {allAccounts.map((a) => <option value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
            </label>
            <label className="field">
              External Ref (Ramp / Expensify ID)
              <input name="externalRef" placeholder="RAMP-REIMB-..." />
            </label>
            <label className="field">
              Notes
              <input name="notes" placeholder="Optional trip / approval notes" />
            </label>
          </div>
          <div style={{ marginTop: "12px" }}>
            <button className="btn">Create Claim</button>
          </div>
        </form>
        {form.error && <p role="alert" className="muted">{form.error.message}</p>}
        {form.result && (
          <p role="status" className="banner">
            Created claim #{form.result.id}. <Link href={`/reimbursements/${form.result.id}`}>Open claim to attach expenses →</Link>
          </p>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>All Reimbursement Claims</h2>
          <span className="muted">{claims.length} total</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Claim</th>
                <th>Type</th>
                <th>Payer</th>
                <th>Target Account</th>
                <th>State</th>
                <th className="num">Claimed</th>
                <th className="num">FX Variance</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr>
                  <td>
                    <Link href={`/reimbursements/${c.id}`}>{c.title}</Link>
                    {c.externalRef && <div className="muted mono" style={{ fontSize: "0.78rem" }}>{c.externalRef}</div>}
                  </td>
                  <td>
                    <span className={c.payerKind === "external_counterparty" ? "pill pill-entity" : "pill"}>
                      {c.payerKind === "external_counterparty" ? "External" : "Internal"}
                    </span>
                  </td>
                  <td>
                    {c.payerKind === "internal_entity"
                      ? (c.businessEntityId ? (entityMap.get(c.businessEntityId) ?? "—") : "—")
                      : (c.counterpartyPayeeId ? (payeeMap.get(c.counterpartyPayeeId) ?? "—") : "—")}
                  </td>
                  <td className="muted">
                    {c.reimburseToAccountId ? (accountMap.get(c.reimburseToAccountId) ?? "—") : "—"}
                  </td>
                  <td>
                    <span
                      className={
                        c.claimState === "paid" || c.claimState === "approved"
                          ? "pill pill-ok"
                          : c.claimState === "rejected"
                            ? "pill pill-danger"
                            : "pill pill-warn"
                      }
                    >
                      {c.claimState}
                    </span>
                  </td>
                  <td className="num">{formatMinor(c.totalMinor, c.currency)}</td>
                  <td className={c.fxVarianceMinor > 0 ? "num pos" : "num muted"}>
                    {c.claimState === "paid" ? formatSignedMinor(c.fxVarianceMinor, baseCurrency) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
