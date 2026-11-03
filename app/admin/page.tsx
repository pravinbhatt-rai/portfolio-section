import { redirect } from "next/navigation";
import { canViewPortfolio } from "../lib/admin-session";
import { cmsConfigured } from "../lib/supabase-rest";
import { AdminDashboard } from "./ui";

export default async function AdminPage() {
  if (!(await canViewPortfolio())) redirect("/admin/login");
  return <AdminDashboard configured={cmsConfigured}/>;
}
