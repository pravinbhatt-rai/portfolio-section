"use client";

import { FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "./lib/supabase-browser";
type Comment = { id: string; author_name: string; message: string; created_at: string };

export function ProjectComments({ slug, type = "project" }: { slug: string; type?: "project" | "blog" }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [configured, setConfigured] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [message, setMessage] = useState("");
  const [signinEmail, setSigninEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/projects/${encodeURIComponent(slug)}/comments?type=${type}`;
  async function refresh() {
    const [response, supabase] = [await fetch(endpoint), createSupabaseBrowserClient()];
    const result = await response.json(); setComments(result.comments || []); setConfigured(result.configured !== false); setLiked(Boolean(result.liked)); setLikes(Number(result.count || 0));
    const session = await supabase?.auth.getUser(); setSignedIn(Boolean(session?.data.user));
  }
  useEffect(() => { void refresh(); }, [slug, type]);
  async function signIn() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Sign-in is not configured yet."); return; }
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(location.pathname)}` } });
    if (error) setMessage(error.message.includes("Unsupported provider") ? "Google sign-in is disabled in Supabase. Use the email link below, or enable Google under Authentication → Providers." : error.message);
  }
  async function signInWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Sign-in is not configured yet."); return; }
    const { error } = await supabase.auth.signInWithOtp({ email: signinEmail.trim(), options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(location.pathname)}` } });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }
  async function toggleLike() {
    if (!signedIn) { setMessage("Sign in below to like this page."); return; }
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "like" }) });
    const result = await response.json(); if (!response.ok) { setMessage(result.error || "Could not update your like."); return; }
    setLiked(result.liked); setLikes(value => value + (result.liked ? 1 : -1));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; setBusy(true); setMessage("");
    const form = new FormData(formElement);
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: form.get("message") }) });
    const result = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(result.error || "Your comment could not be sent."); return; }
    formElement.reset(); setMessage("Thanks for the thoughtful feedback. It will appear after review.");
  }
  return <section className="project-feedback" id="feedback"><div className="section-index"><span>YOUR TAKE</span><span>THOUGHTFUL FEEDBACK IS WELCOME</span></div><div className="feedback-grid"><div><h2>What could<br/><em>work better?</em></h2><p>Tell me what feels useful, confusing, or worth improving. Comments are reviewed before they appear here.</p><button className={`engagement-like ${liked ? "is-liked" : ""}`} type="button" onClick={() => void toggleLike()} aria-pressed={liked}>{liked ? "♥" : "♡"} <span>{likes} likes</span></button></div><div>{signedIn ? <form onSubmit={submit}><label>Your feedback<textarea name="message" required minLength={12} maxLength={1200} rows={5} placeholder="A detail I noticed, a question, or an idea…"/></label><button className="button button-dark" disabled={busy || !configured}>{busy ? "Sending…" : "Send feedback ↗"}</button>{message && <p className="feedback-status" role="status">{message}</p>}<small>One comment per page per day. Your signed-in profile name is shown.</small></form> : <div className="comment-signin"><p>Sign in to leave a comment or like this {type}.</p><button className="button button-dark" onClick={() => void signIn()}>Continue with Google ↗</button><form onSubmit={signInWithEmail}><label>Email sign-in link<input type="email" value={signinEmail} onChange={event => setSigninEmail(event.target.value)} required placeholder="you@example.com"/></label><button className="email-signin-button">Send secure link ↗</button></form>{message && <p className="feedback-status" role="status">{message}</p>}<small>Google sign-in may need to be enabled in Supabase. Email links work with Supabase email authentication.</small></div>}</div></div><div className="approved-comments"><h3>Community notes <span>{comments.length.toString().padStart(2, "0")}</span></h3>{comments.length ? comments.map(comment => <article key={comment.id}><div><strong>{comment.author_name}</strong><time>{new Date(comment.created_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</time></div><p>{comment.message}</p></article>) : <p className="no-comments">The first thoughtful note can start here.</p>}</div></section>;
}
