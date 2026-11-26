import { Link, type LayoutProps } from "typedpress/app";
import "./site.css";

export const template = "blank";

export const metadata = {
  title: { default: "Ledger", template: "%s · Ledger" },
  description: "Multi-entity, multi-currency personal & business finance workspace.",
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Link href="/" className="brand-title">
            Ledger
          </Link>
          <span className="brand-sub">Multi-Entity · Multi-Currency</span>
        </div>

        <nav className="nav-group" aria-label="Workspace">
          <span className="nav-label">Workspace</span>
          <Link href="/" className="nav-link">Overview</Link>
          <Link href="/inbox" className="nav-link">Drop Inbox</Link>
          <Link href="/entries" className="nav-link">Ledger Entries</Link>
          <Link href="/transfers" className="nav-link">Transfers &amp; FX</Link>
          <Link href="/reimbursements" className="nav-link">Reimbursements</Link>
        </nav>

        <nav className="nav-group" aria-label="Structure">
          <span className="nav-label">Structure</span>
          <Link href="/entities" className="nav-link">Legal Entities</Link>
          <Link href="/accounts" className="nav-link">Accounts</Link>
          <Link href="/cards" className="nav-link">Cards</Link>
          <Link href="/categories" className="nav-link">Categories &amp; VAT</Link>
        </nav>

        <nav className="nav-group" aria-label="Planning">
          <span className="nav-label">Planning &amp; Portfolio</span>
          <Link href="/recurring" className="nav-link">Recurring</Link>
          <Link href="/installments" className="nav-link">Taksit / Installments</Link>
          <Link href="/investments" className="nav-link">Investments</Link>
          <Link href="/memos" className="nav-link">Tax Memos</Link>
        </nav>

        <nav className="nav-group" aria-label="Collaboration">
          <span className="nav-label">Collaboration</span>
          <Link href="/sharing" className="nav-link">Sharing &amp; Grants</Link>
        </nav>
      </aside>

      <main className="main">{children}</main>
    </div>
  );
}
