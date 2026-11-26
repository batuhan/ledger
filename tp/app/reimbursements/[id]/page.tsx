import { db } from "typedpress";
import { Link, notFound, useFormState, type PageProps } from "typedpress/app";
import { ReimbursementActions } from "../../../components/ReimbursementActions";
import { formatMinor, formatSignedMinor } from "../../../lib/money";
import { addReimbursementLine, settleReimbursementClaim } from "../../../server";

export const metadata = { title: "Reimbursement Claim" };

export default async function ReimbursementDetailPage({ params }: PageProps<"reimbursements/[id]">) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const claim = await db.query.reimbursementClaims.findFirst({ where: { id } });
  if (!claim) notFound();

  const addLineForm = useFormState(addReimbursementLine);
  const settleForm = useFormState(settleReimbursementClaim);
  const settledResult = settleForm.result;

  const settings = await db.globals.financeSettings.get();
  const baseCurrency = settings.baseCurrency;

  const lines = await db.query.reimbursementLines.findMany({ where: { claimId: claim.id }, orderBy: { id: "asc" }, limit: 200 });
  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, orderBy: { id: "asc" }, limit: 200 });
  const allCategories = await db.query.categories.findMany({ orderBy: { name: "asc" }, limit: 200 });
  const recentEntries = await db.query.entries.findMany({ orderBy: { postedOn: "desc" }, limit: 100 });

  const businessEntity = claim.businessEntityId
    ? await db.query.legalEntities.findFirst({ where: { id: claim.businessEntityId } })
    : null;
  const counterparty = claim.counterpartyPayeeId
    ? await db.query.payees.findFirst({ where: { id: claim.counterpartyPayeeId } })
    : null;
  const targetAccount = claim.reimburseToAccountId
    ? allAccounts.find((a) => a.id === claim.reimburseToAccountId) ?? null
    : null;

  const entryMap = new Map<number, { description: string; postedOn: string; amountMinor: number; currency: string }>();
  for (const e of recentEntries) {
    entryMap.set(e.id, { description: e.description, postedOn: e.postedOn, amountMinor: e.amountMinor, currency: e.currency });
  }
  const catMap = new Map<number, string>();
  for (const c of allCategories) catMap.set(c.id, c.name);

  let claimedBaseMinor = 0;
  for (const l of lines) claimedBaseMinor += l.baseMinor;

  const expenseEntries = recentEntries.filter((e) => e.amountMinor < 0 && e.entryKind !== "transfer" && e.entryKind !== "fx_conversion");
  const depositEntries = recentEntries.filter((e) => e.amountMinor > 0 && e.entryKind !== "transfer" && e.entryKind !== "fx_conversion");
  const businessAccounts = claim.businessEntityId
    ? allAccounts.filter((a) => a.entityId === claim.businessEntityId)
    : allAccounts;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="breadcrumb"><Link href="/reimbursements">← Reimbursements</Link></div>
      <div className="page-head">
        <div>
          <h1>{claim.title}</h1>
          <p className="subtitle">
            Claim #{claim.id} ·{" "}
            {claim.payerKind === "internal_entity"
              ? `Internal Entity: ${businessEntity?.name ?? "—"}`
              : `External Counterparty: ${counterparty?.name ?? "—"}`}
            {claim.externalRef ? ` · Ref ${claim.externalRef}` : ""}
          </p>
        </div>
        <div className="stat-value pos">{formatMinor(claim.totalMinor, claim.currency)}</div>
      </div>

      <section className="card">
        <div className="card-head"><h2>Workflow Status</h2></div>
        <ReimbursementActions claimId={claim.id} initialState={claim.claimState} />
      </section>

      <section className="card">
        <div className="kv-grid">
          <div>
            <div className="kv-label">Payer</div>
            <div className="kv-val">
              {claim.payerKind === "internal_entity"
                ? (businessEntity ? <Link href={`/entities/${businessEntity.slug}`}>{businessEntity.name}</Link> : "—")
                : (counterparty?.name ?? "—")}
            </div>
          </div>
          <div>
            <div className="kv-label">Reimburse Into Account</div>
            <div className="kv-val">
              {targetAccount ? <Link href={`/accounts/${targetAccount.slug}`}>{targetAccount.name}</Link> : "Not set"}
            </div>
          </div>
          <div>
            <div className="kv-label">Claimed Total ({baseCurrency})</div>
            <div className="kv-val mono">{formatMinor(claimedBaseMinor, baseCurrency)}</div>
          </div>
          <div>
            <div className="kv-label">Actual Reimbursed ({baseCurrency})</div>
            <div className="kv-val mono">
              {claim.reimbursedBaseMinor !== null ? formatMinor(claim.reimbursedBaseMinor, baseCurrency) : "Pending payout"}
            </div>
          </div>
          <div>
            <div className="kv-label">FX Variance ({baseCurrency})</div>
            <div className={claim.fxVarianceMinor > 0 ? "kv-val mono pos" : "kv-val mono"}>
              {claim.claimState === "paid" ? formatSignedMinor(claim.fxVarianceMinor, baseCurrency) : "—"}
            </div>
          </div>
          <div>
            <div className="kv-label">Settlement Record</div>
            <div className="kv-val">
              {claim.payoutEntryId ? (
                <Link href={`/entries/${claim.payoutEntryId}`}>Deposit Entry #{claim.payoutEntryId} →</Link>
              ) : claim.payoutTransferId ? (
                <Link href="/transfers">Inter-Entity Transfer #{claim.payoutTransferId} →</Link>
              ) : (
                "Unsettled"
              )}
            </div>
          </div>
        </div>
        {claim.notes && <p style={{ marginTop: "14px" }}>{claim.notes}</p>}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Expense Lines ({lines.length})</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source Ledger Entry</th>
                <th>Split</th>
                <th>Business Category</th>
                <th className="num">Reimbursable</th>
                <th className="num">Base ({baseCurrency})</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const src = entryMap.get(l.sourceEntryId);
                return (
                  <tr>
                    <td className="mono">{src?.postedOn ?? "—"}</td>
                    <td>
                      <Link href={`/entries/${l.sourceEntryId}`}>{src?.description ?? `Entry #${l.sourceEntryId}`}</Link>
                      {l.notes && <div className="muted" style={{ fontSize: "0.78rem" }}>{l.notes}</div>}
                    </td>
                    <td><span className="pill">{(l.splitBps / 100).toFixed(0)}%</span></td>
                    <td className="muted">{l.businessCategoryId ? (catMap.get(l.businessCategoryId) ?? "—") : "—"}</td>
                    <td className="num">{formatMinor(l.reimbursableMinor, l.currency)}</td>
                    <td className="num">{formatMinor(l.baseMinor, baseCurrency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {claim.claimState !== "paid" && (
        <div className="grid-2">
          <section className="card">
            <div className="card-head"><h2>Attach Expense Entry</h2></div>
            <form action={addReimbursementLine}>
              <input type="hidden" name="claimId" value={claim.id} />
              <div className="form-grid">
                <label className="field">
                  Source Expense Entry
                  <select name="sourceEntryId" required>
                    {expenseEntries.map((e) => (
                      <option value={e.id}>
                        {e.postedOn} · {e.description} ({formatMinor(Math.abs(e.amountMinor), e.currency)})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Split % (1–100)
                  <input name="splitPercent" defaultValue="100" required />
                </label>
                <label className="field">
                  Business Category (for internal deduction)
                  <select name="businessCategoryId">
                    <option value="">— None —</option>
                    {allCategories.map((c) => <option value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  Line Note
                  <input name="notes" placeholder="Optional receipt / split note" />
                </label>
              </div>
              <div style={{ marginTop: "12px" }}>
                <button className="btn">Add Line to Claim</button>
              </div>
            </form>
            {addLineForm.error && <p role="alert" className="muted">{addLineForm.error.message}</p>}
            {addLineForm.result && (
              <p role="status" className="banner">
                Added line #{addLineForm.result.id}. Updated claim total: {formatMinor(addLineForm.result.totalMinor, claim.currency)}.
              </p>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2>{claim.payerKind === "internal_entity" ? "Settle via Inter-Entity Transfer" : "Settle External Payout"}</h2>
            </div>
            <form action={settleReimbursementClaim}>
              <input type="hidden" name="claimId" value={claim.id} />
              <div className="form-grid">
                {claim.payerKind === "internal_entity" && (
                  <label className="field">
                    Paying Business Account
                    <select name="fromBusinessAccountId" required>
                      {businessAccounts.map((a) => <option value={a.id}>{a.name} ({a.currency})</option>)}
                    </select>
                  </label>
                )}
                <label className="field">
                  Receiving Personal Account
                  <select name="toAccountId">
                    {allAccounts.map((a) => (
                      <option value={a.id} selected={a.id === claim.reimburseToAccountId}>
                        {a.name} ({a.currency})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Paid Date
                  <input name="paidOn" type="date" defaultValue={today} required />
                </label>
                <label className="field">
                  Actual Payout Amount (in receiving currency)
                  <input name="payoutAmount" placeholder="Leave blank for exact FX conversion" />
                </label>
                {claim.payerKind === "external_counterparty" && (
                  <label className="field">
                    Or Link Existing Bank Deposit
                    <select name="existingPayoutEntryId">
                      <option value="">— Create new reimbursement deposit —</option>
                      {depositEntries.map((d) => (
                        <option value={d.id}>
                          {d.postedOn} · {d.description} ({formatSignedMinor(d.amountMinor, d.currency)})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="field">
                  Reference
                  <input name="reference" defaultValue={claim.externalRef ?? ""} placeholder="WIRE / RAMP ref" />
                </label>
              </div>
              <div style={{ marginTop: "12px" }}>
                <button className="btn">Record Settlement &amp; Mark Paid</button>
              </div>
            </form>
            {settleForm.error && <p role="alert" className="muted">{settleForm.error.message}</p>}
            {settledResult && (
              <p role="status" className="banner">
                Claim settled! Reimbursed {formatMinor(settledResult.reimbursedBaseMinor, baseCurrency)} (FX variance{" "}
                {formatSignedMinor(settledResult.fxVarianceMinor, baseCurrency)}).
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
}
