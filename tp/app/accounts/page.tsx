import { db } from "typedpress";
import { Link } from "typedpress/app";
import { formatMinor } from "../../lib/money";

export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  const allAccounts = await db.query.accounts.findMany({ orderBy: { id: "asc" }, limit: 200 });
  const entities = await db.query.legalEntities.findMany({ limit: 50 });
  const insts = await db.query.institutions.findMany({ limit: 50 });

  const entityMap = new Map<number, { name: string; slug: string }>();
  for (const e of entities) entityMap.set(e.id, { name: e.name, slug: e.slug ?? String(e.id) });
  const instMap = new Map<number, string>();
  for (const i of insts) instMap.set(i.id, i.name);

  const parents = allAccounts.filter((a) => a.parentAccountId === null);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Accounts &amp; Sub-Accounts</h1>
          <p className="subtitle">Bank accounts, multi-currency Wise balances, virtual VAT pots, credit cards, and brokerages.</p>
        </div>
        <Link href="/transfers" className="btn">Record Transfer / FX</Link>
      </div>

      <section className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Institution</th>
                <th>Entity</th>
                <th>Type</th>
                <th>IBAN / Mask</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((acc) => {
                const subs = allAccounts.filter((s) => s.parentAccountId === acc.id);
                return (
                  <>
                    <tr>
                      <td><strong><Link href={`/accounts/${acc.slug}`}>{acc.name}</Link></strong></td>
                      <td>{instMap.get(acc.institutionId) ?? ""}</td>
                      <td>
                        <Link href={`/entities/${entityMap.get(acc.entityId)?.slug ?? ""}`}>
                          <span className="pill pill-entity">{entityMap.get(acc.entityId)?.name ?? ""}</span>
                        </Link>
                      </td>
                      <td><span className="pill">{acc.accountType}</span></td>
                      <td className="mono">{acc.ibanOrMask ?? "—"}</td>
                      <td className={acc.balanceMinor >= 0 ? "num pos" : "num neg"}>{formatMinor(acc.balanceMinor, acc.currency)}</td>
                    </tr>
                    {subs.map((sub) => (
                      <tr>
                        <td style={{ paddingLeft: "28px" }}>↳ <Link href={`/accounts/${sub.slug}`}>{sub.name}</Link></td>
                        <td>{instMap.get(sub.institutionId) ?? ""}</td>
                        <td>
                          <Link href={`/entities/${entityMap.get(sub.entityId)?.slug ?? ""}`}>
                            <span className="pill pill-entity">{entityMap.get(sub.entityId)?.name ?? ""}</span>
                          </Link>
                        </td>
                        <td><span className="pill">{sub.accountType}</span></td>
                        <td className="mono">{sub.ibanOrMask ?? "—"}</td>
                        <td className={sub.balanceMinor >= 0 ? "num pos" : "num neg"}>{formatMinor(sub.balanceMinor, sub.currency)}</td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
