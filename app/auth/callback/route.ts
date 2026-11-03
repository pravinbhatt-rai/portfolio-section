import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "../../lib/admin-session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const requestedNext = request.nextUrl.searchParams.get("next");
  const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/admin";
  const supabase = await createSupabaseServerClient();
  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, request.url));
  }
  return NextResponse.redirect(new URL("/admin/login?error=google_auth", request.url));
}
