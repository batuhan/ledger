import { db } from "spacepress";
import { Link } from "spacepress/app";

export const metadata = { title: "Tax Memos" };

export default async function MemosPage() {
  const memos = await db.query.financeMemos.findMany({ orderBy: { id: "desc" }, limit: 100 });
  const entities = await db.query.legalEntities.findMany({ limit: 50 });
  const entityMap = new Map<number, { name: string; slug: string }>();
  for (const e of entities) entityMap.set(e.id, { name: e.name, slug: e.slug ?? String(e.id) });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tax Memos &amp; Accountant Briefs</h1>
          <p className="subtitle">Quarterly BTW/KDV notes, closing checklists, and investment theses stored as WordPress collections.</p>
        </div>
      </div>

      <section className="grid-2">
        {memos.map((m) => (
          <div className="card">
            <div className="card-head">
              <h2><Link href={`/memos/${m.slug}`}>{m.title}</Link></h2>
              <span className="pill">{m.period}</span>
            </div>
            <p className="muted">
              {m.entityId !== null && entityMap.has(m.entityId ?? 0) ? (
                <Link href={`/entities/${entityMap.get(m.entityId ?? 0)?.slug ?? ""}`}>{entityMap.get(m.entityId ?? 0)?.name ?? ""}</Link>
              ) : (
                "All entities"
              )}
            </p>
            <Link href={`/memos/${m.slug}`}>Read memo →</Link>
          </div>
        ))}
      </section>
    </>
  );
}
