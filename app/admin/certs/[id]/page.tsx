import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getCertById } from "@/lib/roadmap";
import { CertForm } from "@/components/CertForm";

export const dynamic = "force-dynamic";

export default async function EditCertPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const { id } = await params;
  const cert = await getCertById(id);
  if (!cert) {
    return (
      <div className="admin-shell">
        <p className="load-error">No cert found with id &quot;{id}&quot;.</p>
      </div>
    );
  }

  return <CertForm mode="edit" initial={cert} />;
}
