import { home_url, is_user_logged_in, wp_login_url } from "php/wordpress";
import { Link, notFound, useFormState, type PageProps } from "typedpress/app";
import { invitations, legalEntities } from "typedpress:db";
import { acceptInvitation } from "../../../server";

export const metadata = { title: "Accept Invitation" };

export default async function InvitePage({ params }: PageProps<"invite/[token]">) {
  const form = useFormState(acceptInvitation);
  const matched = await invitations.system.list({ where: { token: params.token }, limit: 1 });
  const inv = matched[0] ?? null;
  if (!inv) notFound();
  const entity = inv.entityId !== null ? await legalEntities.system.get(inv.entityId) : null;
  const signedIn = is_user_logged_in();

  return (
    <section className="card" style={{ maxWidth: "560px" }}>
      <h1>Workspace Invitation</h1>
      <p>
        You have been invited as <strong>{inv.role}</strong> ({inv.scope}) for{" "}
        <strong>{entity ? entity.name : "all entities"}</strong>.
      </p>
      <p className="muted">Status: <span className="pill">{inv.status}</span> · Expires {inv.expiresAt.slice(0, 10)}</p>

      {inv.status === "pending" && !signedIn && (
        <p>
          <a className="btn" href={wp_login_url(home_url(`/invite/${params.token}/`))}>
            Sign in to accept invitation
          </a>
        </p>
      )}

      {inv.status === "pending" && signedIn && (
        <form action={acceptInvitation}>
          <input type="hidden" name="token" value={params.token} />
          <button className="btn">Accept &amp; Activate Access Grant</button>
        </form>
      )}

      {form.error && <p role="alert" className="muted">{form.error.message}</p>}
      {form.result && (
        <p className="banner">
          Invitation accepted ({form.result.role}). <Link href="/">Open workspace →</Link>
        </p>
      )}
    </section>
  );
}
