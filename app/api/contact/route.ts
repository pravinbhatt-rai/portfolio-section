import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  try { if (!origin || new URL(origin).origin !== new URL(request.url).origin) return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 }); }
  catch { return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 }); }
  if (Number(request.headers.get("content-length") || 0) > 12000) return NextResponse.json({ error: "Message is too large." }, { status: 413 });
  const body = await request.json().catch(() => null);
  if (body?.company) return NextResponse.json({ ok: true });
  const name = String(body?.name || "").trim().replace(/[\r\n]+/g, " ").slice(0, 80);
  const email = String(body?.email || "").trim().slice(0, 254);
  const message = String(body?.message || "").trim().slice(0, 4000);
  if (name.length < 2 || !emailPattern.test(email) || message.length < 12) return NextResponse.json({ error: "Add your name, a valid email, and a message of at least 12 characters." }, { status: 400 });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, CONTACT_TO } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM || !CONTACT_TO) return NextResponse.json({ error: "Email delivery is not configured yet. Please use the email link instead." }, { status: 503 });
  try {
    const port = Number(SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid SMTP port.");
    const transporter = nodemailer.createTransport({ host: SMTP_HOST, port, secure: process.env.SMTP_SECURE === "true", auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
    await transporter.sendMail({ from: SMTP_FROM, to: CONTACT_TO, replyTo: email, subject: `Portfolio message from ${name}`, text: `From: ${name} <${email}>\n\n${message}`, html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The message could not be sent right now. Please try again later." }, { status: 502 });
  }
}
