"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true); setStatus("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your message could not be sent.");
      setStatus("Message sent. I’ll get back to you soon."); form.reset();
    } catch (error) { setStatus(error instanceof Error ? error.message : "Your message could not be sent."); }
    finally { setSending(false); }
  }
  return <form className="smtp-contact-form" onSubmit={submit}>
    <label>Your name<input name="name" autoComplete="name" maxLength={80} required/></label>
    <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>
    <label>What would you like to talk about?<textarea name="message" rows={5} maxLength={4000} minLength={12} required/></label>
    <label className="contact-honeypot" aria-hidden="true">Leave this field empty<input name="company" tabIndex={-1} autoComplete="off"/></label>
    <button className="button button-dark" disabled={sending}>{sending ? "Sending…" : "Send message"}<span>↗</span></button>
    <p className="smtp-form-status" aria-live="polite">{status}</p>
  </form>;
}
