import { db } from "spacepress/server";
import { Link } from "spacepress/app";
import { formatMinor } from "../../lib/money";

export const metadata = { title: "Cards" };

export default async function CardsPage() {
  const allCards = await db.query.cards.findMany({ orderBy: { id: "asc" }, limit: 100 });
  const allAccounts = await db.query.accounts.findMany({ limit: 200 });
  const accountMap = new Map<number, { name: string; slug: string }>();
  for (const a of allAccounts) accountMap.set(a.id, { name: a.name, slug: a.slug ?? String(a.id) });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Cards</h1>
          <p className="subtitle">Physical debit/credit cards and virtual SaaS cards across your accounts.</p>
        </div>
      </div>

      <section className="grid-3">
        {allCards.map((c) => (
          <div className="card">
            <div className="card-head">
              <h2><Link href={`/cards/${c.slug}`}>{c.name}</Link></h2>
              <span className={c.cardState === "active" ? "pill pill-ok" : "pill pill-warn"}>{c.cardState}</span>
            </div>
            <p className="mono">{c.network.toUpperCase()} {c.cardType} · •••• {c.last4}</p>
            <p className="muted">
              Account: <Link href={`/accounts/${accountMap.get(c.accountId)?.slug ?? ""}`}>{accountMap.get(c.accountId)?.name ?? ""}</Link>
            </p>
            {c.monthlyLimitMinor && (
              <p className="stat-meta">Limit: {formatMinor(c.monthlyLimitMinor, c.currency)} · Exp {c.expiresOn ?? "—"}</p>
            )}
          </div>
        ))}
      </section>
    </>
  );
}
