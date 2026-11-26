import { Link } from "spacepress/app";

export const metadata = { title: "Error" };

export default function ErrorPage() {
  return (
    <section className="card" style={{ maxWidth: "560px" }}>
      <h1>Something went wrong</h1>
      <p className="muted">Please sign in or check your workspace permissions and try again.</p>
      <p><Link href="/" className="btn">Back to Overview</Link></p>
    </section>
  );
}
