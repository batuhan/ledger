import type { PageProps } from "./$types";
import { select } from "spacepress";
import { db } from "spacepress/server";
import { Link, useFormState } from "spacepress/app";
import { formatSignedMinor } from "../../lib/money";
import { recordEntry } from "../../server";

export const search = {
  status: select(["unreviewed", "reviewed", "flagged"]).optional(),
};

export const metadata = { title: "Ledger Entries" };

export default async function EntriesPage({ search }: PageProps<"/entries", { status?: "unreviewed" | "reviewed" | "flagged" }>) {
  const form = useFormState(recordEntry);
  const settings = await db.globals.financeSettings.get();
  const statusFilter =
    search.status === "unreviewed"
      ? ("unreviewed" as const)
      : search.status === "reviewed"
        ? ("reviewed" as const)
        : search.status === "flagged"
          ? ("flagged" as const)
          : null;

  const list = statusFilter
    ? await db.query.entries.findMany({ where: { reviewStatus: statusFilter }, orderBy: { postedOn: "desc" }, limit: 100 })
    : await db.query.entries.findMany({ orderBy: { postedOn: "desc" }, limit: 100 });

  const allAccounts = await db.query.accounts.findMany({ where: { archived: false }, orderBy: { id: "asc" }, limit: 200 });
  const allCategories = await db.query.categories.findMany({ orderBy: { id: "asc" }, limit: 200 });
  const allEntities = await db.query.legalEntities.findMany({ limit: 50 });

  const accountMap = new Map<number, { name: string; slug: string }>();
  for (const a of allAccounts) accountMap.set(a.id, { name: a.name, slug: a.slug ?? String(a.id) });
  const categoryMap = new Map<number, { name: string; slug: string }>();
  for (const c of allCategories) categoryMap.set(c.id, { name: c.name, slug: c.slug ?? String(c.id) });
  const entityMap = new Map<number, { name: string; slug: string }>();
  for (const e of allEntities) entityMap.set(e.id, { name: e.name, slug: e.slug ?? String(e.id) });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ledger Entries</h1>
          <p className="subtitle">Multi-currency transaction ledger normalized to {settings.baseCurrency}.</p>
        </div>
        <div className="action-bar">
          <Link href="/entries" className={statusFilter === null ? "btn btn-sm" : "btn btn-sm btn-ghost"}>All</Link>
          <Link href="/entries?status=unreviewed" className={statusFilter === "unreviewed" ? "btn btn-sm" : "btn btn-sm btn-ghost"}>Unreviewed</Link>
          <Link href="/entries?status=flagged" className={statusFilter === "flagged" ? "btn btn-sm" : "btn btn-sm btn-ghost"}>Flagged</Link>
          <Link href="/entries?status=reviewed" className={statusFilter === "reviewed" ? "btn btn-sm" : "btn btn-sm btn-ghost"}>Reviewed</Link>
        </div>
      </div>

      <section className="card">
        <div className="card-head"><h2>Record Entry</h2></div>
        <form action={recordEntry}>
          <div className="form-grid">
            <label className="field">
              Account
              <select name="accountId" required>
                {allAccounts.map((a) => (
                  <option value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </label>
            <label className="field">
              Category
              <select name="categoryId">
                <option value="">Uncategorized</option>
                {allCategories.map((c) => (
                  <option value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Posted Date
              <input name="postedOn" type="date" defaultValue={today} required />
            </label>
            <label className="field">
              Description
              <input name="description" required placeholder="e.g. Hetzner Cloud Invoice" />
            </label>
            <label className="field">
              Amount (negative = outflow)
              <input name="amount" required placeholder="-49.90" />
            </label>
            <label className="field">
              Entry Kind
              <select name="entryKind">
                <option value="expense" selected>Expense</option>
                <option value="income">Income</option>
                <option value="fee">Fee</option>
                <option value="tax">Tax</option>
                <option value="investment">Investment</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: "12px" }}>
            <button className="btn">Save Entry</button>
          </div>
        </form>
        {form.error && <p role="alert" className="muted">{form.error.message}</p>}
        {form.result && <p role="status" className="banner">Saved entry <Link href={`/entries/${form.result.id}`}>#{form.result.id}</Link>.</p>}
      </section>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Entity / Account</th>
                <th>Category</th>
                <th>Status</th>
                <th className="num">Original</th>
                <th className="num">Base ({settings.baseCurrency})</th>
              </tr>
            </thead>
            <tbody>
              {list.map((entry) => (
                <tr>
                  <td className="mono">{entry.postedOn}</td>
                  <td>
                    <Link href={`/entries/${entry.id}`}>{entry.description}</Link>
                    {entry.isPending && <span className="pill pill-warn" style={{ marginLeft: "6px" }}>pending</span>}
                  </td>
                  <td>
                    <Link href={`/entities/${entityMap.get(entry.entityId)?.slug ?? ""}`}>{entityMap.get(entry.entityId)?.name ?? ""}</Link>
                    <div className="muted" style={{ fontSize: "0.78rem" }}>
                      <Link href={`/accounts/${accountMap.get(entry.accountId)?.slug ?? ""}`}>{accountMap.get(entry.accountId)?.name ?? ""}</Link>
                    </div>
                  </td>
                  <td>
                    {entry.categoryId !== null && categoryMap.has(entry.categoryId ?? 0) ? (
                      <Link href={`/categories/${categoryMap.get(entry.categoryId ?? 0)?.slug ?? ""}`}>{categoryMap.get(entry.categoryId ?? 0)?.name ?? ""}</Link>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td>
                    <span className={entry.reviewStatus === "reviewed" ? "pill pill-ok" : entry.reviewStatus === "flagged" ? "pill pill-danger" : "pill pill-warn"}>
                      {entry.reviewStatus}
                    </span>
                  </td>
                  <td className={entry.amountMinor >= 0 ? "num pos" : "num neg"}>{formatSignedMinor(entry.amountMinor, entry.currency)}</td>
                  <td className="num muted">{formatSignedMinor(entry.baseAmountMinor, settings.baseCurrency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
