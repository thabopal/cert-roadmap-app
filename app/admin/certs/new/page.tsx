import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { CertForm } from "@/components/CertForm";

export const dynamic = "force-dynamic";

export default async function NewCertPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <CertForm mode="create" />;
}
