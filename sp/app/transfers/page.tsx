import { db } from "spacepress";
import { Link, useFormState } from "spacepress/app";
import { formatMinor, formatRateMicros } from "../../lib/money";
import { recordTransfer } from "../../server";

export const metadata = { title: "Transfers & FX" };

export default async function TransfersPage() {
  const form = useFormState(recordTransfer);
  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, orderBy: { id: "asc" }, limit: 200 });
  const list = await db.query.transfers.findMany({ orderBy: { executedOn: "desc" }, limit: 100 });
  const accountMap = new Map<number, { name: string; slug: string }>();
  for (const a of allAccounts) accountMap.set(a.id, { name: a.name, slug: a.slug ?? String(a.id) });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Transfers, FX &amp; Card Payments</h1>
          <p className="subtitle">Atomic double-entry transfers across accounts, currencies, credit cards, and legal entities.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-head"><h2>Record Transfer / FX Conversion</h2></div>
        <form action={recordTransfer}>
          <div className="form-grid">
            <label className="field">
              From Account
              <select name="fromAccountId" required>
                {allAccounts.map((a) => <option value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
            </label>
            <label className="field">
              To Account
              <select name="toAccountId" required>
                {allAccounts.map((a) => <option value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
            </label>
            <label className="field">
              Executed Date
              <input name="executedOn" type="date" defaultValue={today} required />
            </label>
            <label className="field">
              Source Amount
              <input name="fromAmount" required placeholder="1500.00" />
            </label>
            <label className="field">
              Destination Amount (for FX)
              <input name="toAmount" placeholder="Leave blank if same currency" />
            </label>
            <label className="field">
              Transfer Fee
              <input name="feeAmount" placeholder="0.00" />
            </label>
            <label className="field">
              Reference / Wise ID
              <input name="reference" placeholder="WISE-TR-..." />
            </label>
          </div>
          <div style={{ marginTop: "12px" }}>
            <button className="btn">Record Transfer</button>
          </div>
        </form>
        {form.error && <p role="alert" className="muted">{form.error.message}</p>}
        {form.result && <p role="status" className="banner">Recorded {form.result.kind} transfer #{form.result.id}.</p>}
      </section>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Kind</th>
                <th>From → To</th>
                <th className="num">Sent</th>
                <th className="num">Received</th>
                <th className="num">Rate</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr>
                  <td className="mono">{t.executedOn}</td>
                  <td><span className="pill">{t.transferKind}</span></td>
                  <td>
                    <Link href={`/accounts/${accountMap.get(t.fromAccountId)?.slug ?? ""}`}>{accountMap.get(t.fromAccountId)?.name ?? ""}</Link>
                    {" → "}
                    <Link href={`/accounts/${accountMap.get(t.toAccountId)?.slug ?? ""}`}>{accountMap.get(t.toAccountId)?.name ?? ""}</Link>
                  </td>
                  <td className="num">{formatMinor(t.fromAmountMinor, t.fromCurrency)}</td>
                  <td className="num pos">{formatMinor(t.toAmountMinor, t.toCurrency)}</td>
                  <td className="num muted">{formatRateMicros(t.fxRateMicros)}</td>
                  <td className="mono">{t.reference ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
