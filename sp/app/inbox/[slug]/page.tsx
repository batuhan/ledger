import type { PageProps } from "./$types";
import { db } from "spacepress/server";
import { Content, Link, notFound } from "spacepress/app";
import { ApplyAllButton, ProposalActions } from "../../../components/ProposalActions";
import { formatSignedMinor } from "../../../lib/money";

export const metadata = ({ item }: PageProps) => ({
  title: item?.title ?? "Import Detail",
});

export default async function InboxDetailPage({ item }: PageProps) {
  if (!item) notFound();
  const proposals = await db.query.ingestProposals.findMany({
    where: { ingestItemId: item.id },
    orderBy: { postedOn: "desc" },
    limit: 500,
  });
  const withFile = await db.query.ingestItems.findFirst({
    where: { id: item.id },
    columns: { id: true },
    with: { fileId: true },
  });
  const attachedFile =
    withFile && withFile.fileId !== null && typeof withFile.fileId !== "number" ? withFile.fileId : null;
  const pendingCount = proposals.filter((p) => p.status === "pending").length;

  return (
    <>
      <div className="breadcrumb"><Link href="/inbox">← Drop Inbox</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.title}</h1>
          <p className="subtitle">
            {item.sourceKind} · {item.detectedInstitution ?? "Pending detection"}
            {item.detectedCurrency ? ` · ${item.detectedCurrency}` : ""} · Status: {item.ingestState}
          </p>
        </div>
        <ApplyAllButton ingestItemId={item.id} pendingCount={pendingCount} />
      </div>

      {item.errorMessage && (
        <div className="card" role="alert">
          <strong>Ingestion notice:</strong> {item.errorMessage}
        </div>
      )}

      <section className="card">
        <div className="kv-grid">
          <div><div className="kv-label">Status</div><div className="kv-val"><span className="pill">{item.ingestState}</span></div></div>
          <div><div className="kv-label">Proposals</div><div className="kv-val mono">{proposals.length} ({pendingCount} pending)</div></div>
          <div>
            <div className="kv-label">Source File</div>
            <div className="kv-val">
              {attachedFile ? (
                <a href={attachedFile.url}>Download {attachedFile.filename} (signed link)</a>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
        {item.summary && <div style={{ marginTop: "12px" }}><Content value={item.summary} /></div>}
      </section>

      <section className="card">
        <div className="card-head"><h2>Extracted Proposals ({proposals.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Kind</th>
                <th>Confidence</th>
                <th className="num">Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr>
                  <td className="mono">{p.postedOn}</td>
                  <td>
                    {p.description}
                    {p.installmentCount && (
                      <span className="pill pill-warn" style={{ marginLeft: "6px" }}>
                        {p.installmentCount}x taksit
                      </span>
                    )}
                    {p.appliedEntryId && (
                      <div style={{ fontSize: "0.78rem" }}>
                        <Link href={`/entries/${p.appliedEntryId}`}>Applied as entry #{p.appliedEntryId} →</Link>
                      </div>
                    )}
                  </td>
                  <td><span className="pill">{p.entryKind}</span></td>
                  <td className="mono">{Math.round(p.confidenceBps / 100)}%</td>
                  <td className={p.amountMinor >= 0 ? "num pos" : "num neg"}>
                    {formatSignedMinor(p.amountMinor, p.currency)}
                  </td>
                  <td>
                    <ProposalActions proposalId={p.id} initialStatus={p.status} />
                  </td>
                </tr>
              ))}
              {proposals.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">No proposals yet. Background job runs via WordPress Action Scheduler.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
