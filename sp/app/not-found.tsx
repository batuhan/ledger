import { Link } from "spacepress/app";

export const metadata = { title: "Not Found" };

export default function NotFoundPage() {
  return (
    <section className="card" style={{ maxWidth: "560px" }}>
      <h1>Not Found</h1>
      <p className="muted">The record or link you requested does not exist or has been revoked.</p>
      <p><Link href="/" className="btn">Back to Overview</Link></p>
    </section>
  );
}
