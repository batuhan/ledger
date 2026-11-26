import { db } from "spacepress";
import { Link } from "spacepress/app";
import { InboxDropzone } from "../../components/InboxDropzone";

export const metadata = { title: "Drop Inbox" };

export default async function InboxPage() {
  const items = await db.query.ingestItems.findMany({ orderBy: { id: "desc" }, limit: 100 });
  const entities = await db.query.legalEntities.findMany({ limit: 50 });
  const entityMap = new Map<number, string>();
  for (const e of entities) entityMap.set(e.id, e.name);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Drop-Anything Ingestion Inbox</h1>
          <p className="subtitle">
            Drop bunq/Wise/HSBC CSVs, credit card PDFs, or receipt photos. A background job parses rows into reviewable proposals.
          </p>
        </div>
      </div>

      <section className="card">
        <InboxDropzone />
      </section>

      <section className="card">
        <div className="card-head"><h2>Import History ({items.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Import</th>
                <th>Source</th>
                <th>Detected</th>
                <th>Entity</th>
                <th>Proposals</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr>
                  <td><Link href={`/inbox/${item.slug}`}>{item.title}</Link></td>
                  <td><span className="pill">{item.sourceKind}</span></td>
                  <td>{item.detectedInstitution ?? "—"}{item.detectedCurrency ? ` · ${item.detectedCurrency}` : ""}</td>
                  <td>{item.entityId !== null ? entityMap.get(item.entityId ?? 0) ?? "" : "Auto"}</td>
                  <td className="mono">{item.proposalCount}</td>
                  <td>
                    <span
                      className={
                        item.ingestState === "applied"
                          ? "pill pill-ok"
                          : item.ingestState === "failed"
                            ? "pill pill-danger"
                            : "pill pill-warn"
                      }
                    >
                      {item.ingestState}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">No files uploaded yet. Drop a CSV or PDF above to test the pipeline.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
