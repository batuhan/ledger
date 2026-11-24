import { db } from "typedpress";
import { Link, useFormState } from "typedpress/app";
import { createInvitation, createShareLink, revokeGrant, revokeShareLink } from "../../server";

export const metadata = { title: "Sharing & Grants" };

export default async function SharingPage() {
  const linkForm = useFormState(createShareLink);
  const inviteForm = useFormState(createInvitation);
  const entities = await db.query.legalEntities.findMany({ orderBy: { id: "asc" }, limit: 50 });
  const links = await db.query.shareLinks.findMany({ orderBy: { id: "desc" }, limit: 50 });
  const invs = await db.query.invitations.findMany({ orderBy: { id: "desc" }, limit: 50 });
  const activeGrants = await db.query.grants.findMany({ orderBy: { id: "desc" }, limit: 50 });

  const entityMap = new Map<number, string>();
  for (const e of entities) entityMap.set(e.id, e.name);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Sharing, Accountant Links &amp; Access Grants</h1>
          <p className="subtitle">
            Issue entity- and date-scoped read-only share links or invite accountants with row-level DB access grants.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h2>Create Revocable Share Link</h2></div>
          <form action={createShareLink}>
            <div className="form-grid">
              <label className="field">
                Label
                <input name="label" required placeholder="e.g. NL BTW Q4 Review" />
              </label>
              <label className="field">
                Entity Scope
                <select name="entityId">
                  <option value="">All Entities</option>
                  {entities.map((e) => <option value={e.id}>{e.name}</option>)}
                </select>
              </label>
              <label className="field">
                Mask Counterparties
                <select name="maskCounterparties">
                  <option value="false" selected>Show descriptions</option>
                  <option value="true">Mask merchant names</option>
                </select>
              </label>
              <label className="field">
                Date From
                <input name="dateFrom" type="date" />
              </label>
              <label className="field">
                Date To
                <input name="dateTo" type="date" />
              </label>
            </div>
            <div style={{ marginTop: "12px" }}>
              <button className="btn">Generate Share Link</button>
            </div>
          </form>
          {linkForm.error && <p role="alert" className="muted">{linkForm.error.message}</p>}
          {linkForm.result && (
            <p className="banner">
              Share link ready: <Link href={`/share/${linkForm.result.token}`}>/share/{linkForm.result.token}</Link>
            </p>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Invite Collaborator / Accountant</h2></div>
          <form action={createInvitation}>
            <div className="form-grid">
              <label className="field">
                Email
                <input name="recipientEmail" type="email" required placeholder="accountant@firm.nl" />
              </label>
              <label className="field">
                Entity Scope
                <select name="entityId">
                  <option value="">All Entities</option>
                  {entities.map((e) => <option value={e.id}>{e.name}</option>)}
                </select>
              </label>
              <label className="field">
                Role
                <select name="role">
                  <option value="accountant" selected>Accountant (read-only)</option>
                  <option value="viewer">Viewer (read-only)</option>
                  <option value="editor">Editor (read &amp; write)</option>
                </select>
              </label>
            </div>
            <div style={{ marginTop: "12px" }}>
              <button className="btn">Create Invitation</button>
            </div>
          </form>
          {inviteForm.error && <p role="alert" className="muted">{inviteForm.error.message}</p>}
          {inviteForm.result && (
            <p className="banner">
              Invite URL: <Link href={`/invite/${inviteForm.result.token}`}>/invite/{inviteForm.result.token}</Link>
            </p>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h2>Share Links ({links.length})</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Label</th><th>Scope</th><th>Date Range</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr>
                  <td><Link href={`/share/${l.token}`}>{l.label}</Link></td>
                  <td>{l.entityId !== null ? entityMap.get(l.entityId ?? 0) ?? "" : "All Entities"}</td>
                  <td className="mono">{l.dateFrom ?? "∞"} → {l.dateTo ?? "∞"}</td>
                  <td><span className={l.revokedAt ? "pill pill-danger" : "pill pill-ok"}>{l.revokedAt ? "revoked" : "active"}</span></td>
                  <td>
                    {!l.revokedAt && (
                      <form action={revokeShareLink}>
                        <input type="hidden" name="linkId" value={l.id} />
                        <button className="btn btn-sm btn-ghost">Revoke</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head"><h2>Invitations ({invs.length})</h2></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Email</th><th>Role</th><th>Status</th><th>Link</th></tr>
              </thead>
              <tbody>
                {invs.map((i) => (
                  <tr>
                    <td>{i.recipientEmail}</td>
                    <td><span className="pill">{i.role}</span></td>
                    <td><span className="pill">{i.status}</span></td>
                    <td><Link href={`/invite/${i.token}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-head"><h2>Active Row-Level Grants ({activeGrants.length})</h2></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User ID</th><th>Entity</th><th>Role</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {activeGrants.map((g) => (
                  <tr>
                    <td className="mono">#{g.userId}</td>
                    <td>{g.entityId !== null ? entityMap.get(g.entityId ?? 0) ?? "" : "All Entities"}</td>
                    <td><span className="pill">{g.role}</span></td>
                    <td><span className={g.revokedAt ? "pill pill-danger" : "pill pill-ok"}>{g.revokedAt ? "revoked" : "active"}</span></td>
                    <td>
                      {!g.revokedAt && (
                        <form action={revokeGrant}>
                          <input type="hidden" name="grantId" value={g.id} />
                          <button className="btn btn-sm btn-ghost">Revoke</button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
