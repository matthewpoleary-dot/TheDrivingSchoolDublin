import type { Metadata } from "next";
import { Container } from "@/components/brand";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminLogin from "@/components/admin/AdminLogin";
import { isAdminRequest, isAdminConfigured } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminConfigured()) {
    return (
      <Container size="narrow" className="py-20">
        <div className="border-2 border-caution bg-caution-wash p-6">
          <h1 className="text-xl font-extrabold">Admin is not configured</h1>
          <p className="mt-2 text-[0.9375rem] leading-relaxed">
            Set <code className="font-mono text-sm">ADMIN_PASSWORD</code> and{" "}
            <code className="font-mono text-sm">ADMIN_SESSION_SECRET</code> in the
            environment, then reload. Full instructions are in{" "}
            <code className="font-mono text-sm">docs/SETUP.md</code>.
          </p>
        </div>
      </Container>
    );
  }

  if (!(await isAdminRequest())) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}
