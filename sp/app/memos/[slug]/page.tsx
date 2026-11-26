import type { PageProps } from "./$types";
import { db } from "spacepress/server";
import { Content, Link, notFound } from "spacepress/app";

export const metadata = ({ item }: PageProps) => ({
  title: item?.title ?? "Memo",
});

export default async function MemoDetailPage({ item }: PageProps) {
  if (!item) notFound();
  const entity = item.entityId ? await db.query.legalEntities.findFirst({ where: { id: item.entityId } }) : null;

  return (
    <>
      <div className="breadcrumb"><Link href="/memos">← Tax Memos</Link></div>
      <div className="page-head">
        <div>
          <h1>{item.title}</h1>
          <p className="subtitle">
            Period {item.period} · {entity ? <Link href={`/entities/${entity.slug}`}>{entity.name}</Link> : "Workspace-wide"}
          </p>
        </div>
      </div>

      <article className="card">
        <Content value={item.content} />
      </article>
    </>
  );
}
