import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getCerts } from "@/lib/roadmap";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const [year1, year2plus] = await Promise.all([getCerts("year1"), getCerts("year2plus")]);

  return (
    <div className="admin-shell wide">
      <div className="admin-topbar">
        <h1>Roadmap admin</h1>
        <div className="btn-row" style={{ margin: 0 }}>
          <Link className="ctrl-link" href="/">
            View public page
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <div className="admin-topbar" style={{ marginBottom: 0 }}>
          <h1 style={{ fontSize: 16 }}>Page content</h1>
          <Link className="btn secondary" href="/admin/meta">
            Edit title, intro & footer
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-topbar">
          <h1 style={{ fontSize: 16 }}>Certifications ({year1.length + year2plus.length})</h1>
          <Link className="btn" href="/admin/certs/new">
            + New cert
          </Link>
        </div>

        <p className="field" style={{ marginBottom: 4 }}>
          <span className="hint">Year 1 — core five</span>
        </p>
        <ul className="admin-list">
          {year1.map((c) => (
            <li key={c.id}>
              <div>
                <div className="row-title">
                  {c.num}. {c.title}
                </div>
                <div className="row-meta">{c.id}</div>
              </div>
              <Link className="btn secondary" href={`/admin/certs/${c.id}`}>
                Edit
              </Link>
            </li>
          ))}
        </ul>

        <p className="field" style={{ marginBottom: 4, marginTop: 20 }}>
          <span className="hint">Year 2+ — conditional / optional</span>
        </p>
        <ul className="admin-list">
          {year2plus.map((c) => (
            <li key={c.id}>
              <div>
                <div className="row-title">
                  {c.num}. {c.title}
                </div>
                <div className="row-meta">{c.id}</div>
              </div>
              <Link className="btn secondary" href={`/admin/certs/${c.id}`}>
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
