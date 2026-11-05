"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./lib/supabase-browser";

type AccountProfile = { email: string; name: string; avatarUrl: string | null };

function profileFromUser(user: Session["user"] | null | undefined): AccountProfile | null {
  if (!user?.email) return null;
  const metadata = user.user_metadata || {};
  return {
    email: user.email,
    name: String(metadata.full_name || metadata.name || metadata.user_name || user.email.split("@")[0]),
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : null,
  };
}

export function HomeMenu({ homePage = true }: { homePage?: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setAuthReady(true); return; }
    void supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => { setProfile(profileFromUser(data.session?.user)); setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => { setProfile(profileFromUser(session?.user)); setAvatarFailed(false); setAuthReady(true); });
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
      <div className={`home-menu-profile${profile ? " is-signed-in" : ""}`} title={profile ? `${profile.name} · ${profile.email}` : authReady ? "Not signed in" : "Checking sign-in status"} aria-label={profile ? `Signed in as ${profile.name}, ${profile.email}` : authReady ? "Not signed in" : "Checking sign-in status"}>
        <span className="home-menu-avatar" aria-hidden="true">
          {profile?.avatarUrl && !avatarFailed && <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />}
          <span>{profile ? profile.name.trim().slice(0, 1).toUpperCase() : "○"}</span>
        </span>
        <span className="home-menu-profile-copy"><strong>{profile ? profile.name : authReady ? "Guest" : "Checking"}</strong><small>{profile ? "SIGNED IN" : authReady ? "SIGNED OUT" : "ACCOUNT"}</small></span>
      </div>
      <button className="home-menu-trigger" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span className={`home-menu-glyph${open ? " is-open" : ""}`} aria-hidden="true"><i /><i /></span>
      </button>
      {open && <div className="home-menu-panel">
        <div className="home-menu-account-card">
          <span className="home-menu-avatar home-menu-avatar-large" aria-hidden="true">
            {profile?.avatarUrl && !avatarFailed && <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />}
            <span>{profile ? profile.name.trim().slice(0, 1).toUpperCase() : "○"}</span>
          </span>
          <div><div className="home-menu-status"><i className={profile ? "is-online" : ""} /><span>{profile ? "SIGNED IN" : authReady ? "SIGNED OUT" : "CHECKING ACCOUNT"}</span></div>{profile ? <><strong className="home-menu-name">{profile.name}</strong><p className="home-menu-email">{profile.email}</p></> : <p className="home-menu-email">Sign in to like projects and leave feedback.</p>}</div>
        </div>
        <nav aria-label="Quick navigation">
          <Link href={homePage ? "#intro" : "/#intro"} onClick={closeMenu}>Home <span>01</span></Link>
          <Link href={homePage ? "#story" : "/#story"} onClick={closeMenu}>About <span>02</span></Link>
          <Link href={homePage ? "#skills" : "/#skills"} onClick={closeMenu}>Toolkit <span>03</span></Link>
          <Link href={homePage ? "#work" : "/#work"} onClick={closeMenu}>Projects <span>04</span></Link>
          <Link href={homePage ? "#journey" : "/#journey"} onClick={closeMenu}>Journey <span>05</span></Link>
          <Link href={homePage ? "#contact" : "/#contact"} onClick={closeMenu}>Contact <span>06</span></Link>
        </nav>
        {profile ? <button className="home-menu-auth" type="button" onClick={() => void signOut()}>Sign out ↗</button> : <div className="home-menu-login">
          <button className="home-menu-auth" type="button" disabled={busy} onClick={() => void signInWithGoogle()}>{busy ? "Connecting…" : "Continue with Google ↗"}</button>
          <form onSubmit={sendEmailLink}><label htmlFor="home-menu-email">Or use an email link</label><div><input id="home-menu-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /><button type="submit" disabled={busy} aria-label="Send email sign-in link">↗</button></div></form>
        </div>}
        {message && <p className="home-menu-message" role="status">{message}</p>}
        <Link className="home-menu-admin" href="/admin/login" onClick={closeMenu}>Portfolio admin ↗</Link>
      </div>}
    </div>
  );
}
