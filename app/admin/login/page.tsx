import Link from "next/link";
import { canViewPortfolio } from "../../lib/admin-session";
import { redirect } from "next/navigation";
import { AdminLogin } from "../ui";
const authConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
const adminAllowlistConfigured = Boolean(process.env.OWNER_EMAIL || process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL);
export default async function AdminLoginPage() { if (await canViewPortfolio()) redirect("/admin"); return <main className="admin-shell"><Link href="/" className="wordmark">PB<span>®</span></Link><AdminLogin configured={authConfigured} adminAllowlistConfigured={adminAllowlistConfigured}/></main>; }
