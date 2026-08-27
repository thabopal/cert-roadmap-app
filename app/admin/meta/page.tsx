import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getPageMeta } from "@/lib/roadmap";
import { MetaForm } from "@/components/MetaForm";

export const dynamic = "force-dynamic";

export default async function EditMetaPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const meta = await getPageMeta();
  if (!meta) {
    return (
      <div className="admin-shell">
        <p className="load-error">
          No page content yet — run <code>npm run seed</code> first.
        </p>
      </div>
    );
  }

  return <MetaForm initial={meta} />;
}
