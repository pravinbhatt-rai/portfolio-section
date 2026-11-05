"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./lib/supabase-browser";

export function HomeMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setAuthReady(true); return; }
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => { setSignedInEmail(data.session?.user.email || null); setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { setSignedInEmail(session?.user.email || null); setAuthReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Account sign-in is not configured yet."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/` } });
    if (error) { setMessage(error.message.includes("Unsupported provider") ? "Google sign-in is disabled in Supabase. Use the email link below." : error.message); setBusy(false); }
  }

  async function sendEmailLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Account sign-in is not configured yet."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` } });
    setMessage(error ? error.message : "Check your inbox for a secure sign-in link.");
    setBusy(false);
  }

  async function signOut() {
    await createSupabaseBrowserClient()?.auth.signOut();
    setMessage("You are signed out.");
  }

  function closeMenu() { setOpen(false); }

  return (
    <div className="home-menu">
      <span className="home-menu-badge" title={signedInEmail || (authReady ? "Signed out" : "Checking account status")}><i className={signedInEmail ? "is-online" : ""} /><span>{signedInEmail ? "SIGNED IN" : authReady ? "GUEST" : "CHECKING"}</span></span>
      <button className="home-menu-trigger" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className={`home-menu-glyph${open ? " is-open" : ""}`} aria-hidden="true"><i /><i /></span>
      </button>
      {open && <div className="home-menu-panel">
        <div className="home-menu-status"><i className={signedInEmail ? "is-online" : ""} /><span>{signedInEmail ? "SIGNED IN" : "GUEST"}</span></div>
        {signedInEmail && <p className="home-menu-email">{signedInEmail}</p>}
        <nav aria-label="Quick navigation">
          <Link href="#intro" onClick={closeMenu}>Home <span>01</span></Link>
          <Link href="#story" onClick={closeMenu}>About <span>02</span></Link>
          <Link href="#skills" onClick={closeMenu}>Toolkit <span>03</span></Link>
          <Link href="#work" onClick={closeMenu}>Projects <span>04</span></Link>
          <Link href="#journey" onClick={closeMenu}>Journey <span>05</span></Link>
          <Link href="#contact" onClick={closeMenu}>Contact <span>06</span></Link>
        </nav>
        {signedInEmail ? <button className="home-menu-auth" type="button" onClick={() => void signOut()}>Sign out ↗</button> : <div className="home-menu-login">
          <button className="home-menu-auth" type="button" disabled={busy} onClick={() => void signInWithGoogle()}>{busy ? "Connecting…" : "Continue with Google ↗"}</button>
          <form onSubmit={sendEmailLink}><label htmlFor="home-menu-email">Or use an email link</label><div><input id="home-menu-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /><button type="submit" disabled={busy} aria-label="Send email sign-in link">↗</button></div></form>
        </div>}
        {message && <p className="home-menu-message" role="status">{message}</p>}
        <Link className="home-menu-admin" href="/admin/login" onClick={closeMenu}>Portfolio admin ↗</Link>
      </div>}
    </div>
  );
}
