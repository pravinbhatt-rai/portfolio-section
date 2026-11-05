"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase-browser";
import { TimelineManager } from "./timeline-manager";

type Skill = { id: string; name: string; category: string };
type Item = { id: string; type: string; slug: string; title: string; summary: string; body: string; thumbnail_url: string; published: boolean; skill_ids: string[] };
type Comment = { id: string; project_slug: string; author_name: string; message: string; created_at: string };
type Role = { email: string; role: "admin" | "editor" | "viewer"; updated_at: string };
type Data = { items: Item[]; skills: Skill[]; comments: Comment[]; analytics: { views: number; visitors: number; paths: [string, number][] }; role: "owner" | "admin" | "editor" | "viewer" };

export function AdminLogin({ configured, adminAllowlistConfigured }: { configured: boolean; adminAllowlistConfigured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  useEffect(() => { if (new URLSearchParams(window.location.search).has("error")) setError("Google sign-in could not be completed. Check that the Google provider and callback URLs are configured in Supabase."); }, []);
  async function signInWithGoogle() {
    setBusy(true); setError("");
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase Auth is not configured."); setBusy(false); return; }
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` } });
    if (authError) { setError(authError.message.includes("Unsupported provider") ? "Google sign-in is disabled in Supabase. Enable Authentication → Providers → Google, or use an email sign-in link below." : authError.message); setBusy(false); }
  }
  async function sendEmailLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setEmailLinkSent(false);
    const email = String(new FormData(event.currentTarget).get("emailLink") || "").trim();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase Auth is not configured."); setBusy(false); return; }
    const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin` } });
    if (authError) setError(authError.message); else setEmailLinkSent(true);
    setBusy(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError("Supabase Auth is not configured."); setBusy(false); return; }
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (!authError) location.assign("/admin"); else { setError(authError.message); setBusy(false); }
  }
  return <section className="admin-login"><p className="eyebrow">PRIVATE WORKSPACE</p><h1>Portfolio<br/><em>dashboard.</em></h1><p>Sign in to publish work, writing, achievements, and review feedback and audience stats.</p>{configured ? <><button className="google-login-button" type="button" onClick={signInWithGoogle} disabled={busy}><GoogleMark/>{busy ? "Connecting to Google…" : "Continue with Google"}</button><p className="login-divider"><span>OR USE EMAIL</span></p><form onSubmit={submit}><label>Admin email<input type="email" name="email" autoComplete="username" required/></label><label>Password<input type="password" name="password" autoComplete="current-password" required/></label><button className="button button-dark" disabled={busy}>{busy ? "Signing in…" : "Sign in ↗"}</button>{error && <p role="alert" className="admin-error">{error}</p>}</form><form className="admin-email-link" onSubmit={sendEmailLink}><label>Or get a secure email sign-in link<input type="email" name="emailLink" autoComplete="email" required placeholder="you@example.com"/></label><button className="button button-dark" disabled={busy}>{busy ? "Sending…" : "Email me a sign-in link ↗"}</button>{emailLinkSent && <p role="status">Check your inbox for the sign-in link.</p>}</form><p className="admin-login-hint">Google sign-in needs the Google provider enabled in Supabase. Email links work with Supabase email authentication. The owner and assigned portfolio roles can enter the dashboard.</p>{!adminAllowlistConfigured && <p className="admin-notice">Add <code>OWNER_EMAIL=you@example.com</code> to <code>.env.local</code> before signing in as the owner.</p>}</> : <p className="admin-notice">Supabase Auth is not configured yet. Add the public project URL and publishable key to <code>.env.local</code>.</p>}</section>;
}

function GoogleMark() { return <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.38 37.96 46.98 31.87 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a23.97 23.97 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>; }

export function AdminDashboard({ configured }: { configured: boolean }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [contentType, setContentType] = useState("project");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [roleMessage, setRoleMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/content");
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Unable to load dashboard."); return; }
    setError(""); setData(result);
    const roleResponse = await fetch("/api/admin/roles");
    if (roleResponse.ok) { const roleResult = await roleResponse.json(); setRoles(roleResult.roles || []); }
  }
  useEffect(() => { if (configured) void refresh(); }, [configured]);

  function startNew() { setEditing(null); setContentType("project"); setSkillIds([]); setNotice(""); }
  function editItem(item: Item) { setEditing(item); setContentType(item.type); setSkillIds(item.skill_ids || []); setNotice(""); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const value = { type: contentType, title: form.get("title"), slug: form.get("slug"), summary: form.get("summary"), body: form.get("body"), thumbnail_url: form.get("thumbnail_url"), published: form.get("published") === "on", skill_ids: skillIds };
    const response = await fetch("/api/admin/content", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? { ...value, id: editing.id } : value) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setError(result.error || "Could not save item."); return; }
    setEditing(null); setContentType("project"); setSkillIds([]); setNotice("Saved. Published entries are available on the portfolio."); await refresh();
  }
  async function remove(id: string) { if (!confirm("Delete this item permanently?")) return; const response = await fetch(`/api/admin/content?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!response.ok) setError("Could not delete the item."); await refresh(); }
  async function reviewComment(id: string, status: "approved" | "rejected") { const response = await fetch("/api/admin/comments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); if (!response.ok) setError("Could not update comment status."); else setNotice(status === "approved" ? "Comment published." : "Comment declined."); await refresh(); }
  async function deleteComment(id: string) { const response = await fetch(`/api/admin/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!response.ok) setError("Could not delete comment."); await refresh(); }
  async function logout() { await createSupabaseBrowserClient()?.auth.signOut(); location.assign("/admin/login"); }
  async function saveRole(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const response = await fetch("/api/admin/roles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), role: form.get("role") }) }); const result = await response.json(); setRoleMessage(response.ok ? "Role saved. The user can sign in with this email." : result.error || "Could not save role."); if (response.ok) { event.currentTarget.reset(); await refresh(); } }
  async function removeRole(email: string) { const response = await fetch(`/api/admin/roles?email=${encodeURIComponent(email)}`, { method: "DELETE" }); if (response.ok) await refresh(); }
  function toggleSkill(id: string) { setSkillIds((current) => current.includes(id) ? current.filter((skillId) => skillId !== id) : [...current, id]); }

  return <main className="admin-shell admin-dashboard"><header className="admin-header"><Link href="/" className="wordmark">PB<span>®</span></Link><span>PRIVATE PORTFOLIO STUDIO</span><button onClick={logout}>Sign out ↗</button></header><div className="admin-title"><div><p className="eyebrow">CONTROL ROOM</p><h1>Your portfolio,<br/><em>in motion.</em></h1></div><Link href="/" className="under-link">View live site ↗</Link></div>
    {!configured ? <div className="admin-notice"><strong>Connect Supabase to start publishing.</strong><p>Add your project URL, anon key, and service role key to the local environment, then run the setup SQL in <code>supabase/schema.sql</code>. The service role key stays on the server.</p></div> : <>
      {error && <p className="admin-error">{error}</p>}{notice && <p className="admin-success">{notice}</p>}
      <div className="admin-stats"><article><span>PAGE VIEWS</span><strong>{data?.analytics.views ?? "—"}</strong><small>Recorded page visits</small></article><article><span>VISITORS</span><strong>{data?.analytics.visitors ?? "—"}</strong><small>Distinct browser / day</small></article><article><span>CONTENT ITEMS</span><strong>{data?.items.length ?? "—"}</strong><small>Drafts and published</small></article></div>
      <div className="admin-columns">{data?.role !== "viewer" && <section className="admin-editor"><div className="admin-section-heading"><div><p className="eyebrow">PUBLISH SOMETHING</p><h2>{editing ? "Edit entry" : "New entry"}</h2></div>{editing && <button onClick={startNew}>Cancel</button>}</div><form key={editing?.id || "new"} onSubmit={save}><div className="admin-form-row"><label>Content type<select name="type" value={contentType} onChange={(event) => setContentType(event.target.value)}><option value="project">Project</option><option value="blog">Blog post</option><option value="achievement">Achievement</option></select></label><label>URL slug<input name="slug" defaultValue={editing?.slug} placeholder="thoughtful-project-name" required/></label></div><label>Title<input name="title" defaultValue={editing?.title} required maxLength={180}/></label><label>Short description<input name="summary" defaultValue={editing?.summary} maxLength={500}/></label><label>Thumbnail image URL<input name="thumbnail_url" defaultValue={editing?.thumbnail_url} placeholder="https://…"/></label><label>Story / details<textarea name="body" defaultValue={editing?.body} rows={6}/></label>{contentType === "project" && <fieldset className="admin-skill-field"><legend>Skills used</legend><div className="admin-skill-choices">{data?.skills.map((skill) => <label key={skill.id}><input type="checkbox" checked={skillIds.includes(skill.id)} onChange={() => toggleSkill(skill.id)}/>{skill.name}</label>)}</div></fieldset>}<label className="admin-check"><input name="published" type="checkbox" defaultChecked={editing?.published}/> Publish this entry</label><button className="button button-dark" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes ↗" : "Add to portfolio ↗"}</button></form></section>}
      <section className="admin-content"><div className="admin-section-heading"><div><p className="eyebrow">YOUR CONTENT</p><h2>Everything shared.</h2></div>{editing && <button onClick={startNew}>New entry +</button>}</div><div className="admin-items">{data?.items.map((item) => <article key={item.id}><div><span>{item.type.toUpperCase()} · {item.published ? "PUBLISHED" : "DRAFT"}</span><strong>{item.title}</strong><small>/{item.slug}</small></div><button onClick={() => editItem(item)}>Edit</button><button onClick={() => void remove(item.id)} aria-label={`Delete ${item.title}`}>×</button></article>)}{data?.items.length === 0 && <p>No entries yet. Add your first project, note, or milestone.</p>}</div><p className="eyebrow admin-popular-title">POPULAR PAGES</p><div className="admin-paths">{data?.analytics.paths.map(([path, count]) => <div key={path}><span>{path}</span><strong>{count}</strong></div>)}</div></section></div>
      {data?.role !== "viewer" && <TimelineManager/>}
      {data?.role === "owner" || data?.role === "admin" ? <section className="admin-comment-queue"><div className="admin-section-heading"><div><p className="eyebrow">COMMUNITY FEEDBACK</p><h2>Comments to review · {data?.comments.length ?? 0}</h2></div></div>{data?.comments.length ? data.comments.map((comment) => <article key={comment.id}><div><span>/{comment.project_slug} · {new Date(comment.created_at).toLocaleDateString()}</span><strong>{comment.author_name}</strong><p>{comment.message}</p></div><div className="admin-comment-actions"><button onClick={() => void reviewComment(comment.id, "approved")}>Approve</button><button onClick={() => void reviewComment(comment.id, "rejected")}>Decline</button><button onClick={() => void deleteComment(comment.id)}>Delete</button></div></article>) : <p>No comments are waiting for review.</p>}</section> : null}
      {roles && <section className="admin-role-manager"><div className="admin-section-heading"><div><p className="eyebrow">ACCESS CONTROL · OWNER ONLY</p><h2>Team roles</h2></div></div><p>Editors can publish content. Admins can also review comments. Viewers can open the dashboard without editing.</p><form onSubmit={saveRole}><label>Email<input name="email" type="email" required placeholder="teammate@example.com"/></label><label>Role<select name="role"><option value="editor">Editor</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select></label><button className="button button-dark">Save role ↗</button></form>{roleMessage && <p role="status">{roleMessage}</p>}<div className="admin-items">{roles.map(item => <article key={item.email}><div><strong>{item.email}</strong><small>{item.role.toUpperCase()}</small></div><button onClick={() => void removeRole(item.email)}>Remove</button></article>)}</div></section>}
      <p className="admin-privacy">Analytics use a first-party random browser ID and store page and day only. No IP address or personal profile is collected.</p>
    </>}
  </main>;
}
