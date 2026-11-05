"use client";

import { FormEvent, useEffect, useState } from "react";

type Milestone = {
  id: string; title: string; category: string; organization: string; role: string;
  start_date: string; end_date: string | null; description: string;
  achievements: string[]; technologies: string[]; location: string; logo_url: string;
  position: "left" | "right" | "center"; sort_order: number; is_published: boolean;
};

const emptyForm = { title: "", category: "Experience", organization: "", role: "", start_date: "", end_date: "", description: "", achievements: "", technologies: "", location: "", logo_url: "", position: "left", sort_order: 10, is_published: false };

function toForm(item: Milestone | null) {
  return item ? {
    title: item.title, category: item.category, organization: item.organization, role: item.role,
    start_date: item.start_date, end_date: item.end_date || "", description: item.description,
    achievements: item.achievements.join("\n"), technologies: item.technologies.join(", "),
    location: item.location, logo_url: item.logo_url, position: item.position,
    sort_order: item.sort_order, is_published: item.is_published,
  } : emptyForm;
}

export function TimelineManager() {
  const [items, setItems] = useState<Milestone[]>([]);
  const [editing, setEditing] = useState<Milestone | null>(null);
  const [form, setForm] = useState(toForm(null));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    const response = await fetch("/api/admin/timeline", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Could not load career milestones."); return; }
    setItems(Array.isArray(result.items) ? result.items : []);
    setError("");
  }

  useEffect(() => { void refresh(); }, []);

  function startNew() { setEditing(null); setForm(toForm(null)); setError(""); setNotice(""); }
  function edit(item: Milestone) { setEditing(item); setForm(toForm(item)); setError(""); setNotice(""); }
  function updateField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) { setForm((current) => ({ ...current, [key]: value })); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const payload = {
      ...form,
      achievements: form.achievements.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      technologies: form.technologies.split(",").map((value) => value.trim()).filter(Boolean),
    };
    const response = await fetch("/api/admin/timeline", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...payload, id: editing.id } : payload),
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(result.error || "Could not save the milestone."); return; }
    setNotice(editing ? "Milestone updated." : "Milestone added.");
    setEditing(null); setForm(toForm(null)); await refresh();
  }

  async function uploadLogo(event: FormEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    const body = new FormData(); body.set("file", file);
    const response = await fetch("/api/admin/timeline/logo", { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok) { setError(result.error || "Logo upload failed."); return; }
    updateField("logo_url", result.url);
    input.value = "";
  }

  async function remove(id: string) {
    if (!confirm("Delete this career milestone?")) return;
    const response = await fetch(`/api/admin/timeline?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || "Could not delete the milestone.");
    else { setNotice("Milestone deleted."); await refresh(); }
  }

  async function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]];
    const response = await Promise.all(reordered.map((item, order) => fetch("/api/admin/timeline", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, sort_order: (order + 1) * 10 }),
    })));
    if (response.some((item) => !item.ok)) setError("Some milestones could not be reordered.");
    await refresh();
  }

  return (
    <section className="admin-timeline-manager">
      <div className="admin-section-heading"><div><p className="eyebrow">CAREER JOURNEY · SUPABASE</p><h2>Milestones on the road.</h2></div><button type="button" onClick={startNew}>Add milestone +</button></div>
      <p>Publish education, experience, projects, or achievements. The homepage timeline updates from these records.</p>
      {error && <p className="admin-error" role="alert">{error}</p>}{notice && <p className="admin-success" role="status">{notice}</p>}
      <div className="admin-timeline-layout">
        <form className="admin-timeline-form" onSubmit={save}>
          <h3>{editing ? "Edit milestone" : "New milestone"}</h3>
          <div className="admin-form-row"><label>Title<input required maxLength={180} value={form.title} onChange={(event) => updateField("title", event.target.value)} /></label><label>Category<select value={form.category} onChange={(event) => updateField("category", event.target.value)}><option>Education</option><option>Experience</option><option>Project</option><option>Achievement</option></select></label></div>
          <div className="admin-form-row"><label>Organization<input required maxLength={180} value={form.organization} onChange={(event) => updateField("organization", event.target.value)} /></label><label>Role / degree<input required maxLength={180} value={form.role} onChange={(event) => updateField("role", event.target.value)} /></label></div>
          <div className="admin-form-row"><label>Start date<input type="date" required value={form.start_date} onChange={(event) => updateField("start_date", event.target.value)} /></label><label>End date<input type="date" value={form.end_date} onChange={(event) => updateField("end_date", event.target.value)} /></label></div>
          <div className="admin-form-row"><label>Location<input maxLength={120} value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Roorkee, India" /></label><label>Card position<select value={form.position} onChange={(event) => updateField("position", event.target.value)}><option value="left">Left</option><option value="right">Right</option><option value="center">Alternate</option></select></label></div>
          <label>Description<textarea required maxLength={2400} rows={4} value={form.description} onChange={(event) => updateField("description", event.target.value)} /></label>
          <label>Achievements <small>One item per line</small><textarea rows={4} value={form.achievements} onChange={(event) => updateField("achievements", event.target.value)} /></label>
          <label>Technologies <small>Comma separated</small><input value={form.technologies} onChange={(event) => updateField("technologies", event.target.value)} /></label>
          <div className="admin-logo-upload"><label>Organization logo URL<input maxLength={1000} value={form.logo_url} onChange={(event) => updateField("logo_url", event.target.value)} placeholder="Optional logo image URL" /></label><label className="admin-file-button">{uploading ? "Uploading…" : "Upload logo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => void uploadLogo(event)} /></label></div>
          <label>Sort order<input type="number" min="0" max="10000" step="1" value={form.sort_order} onChange={(event) => updateField("sort_order", Number(event.target.value))} /></label>
          <label className="admin-check"><input type="checkbox" checked={form.is_published} onChange={(event) => updateField("is_published", event.target.checked)} /> Publish on homepage</label>
          <div className="admin-timeline-actions"><button className="button button-dark" disabled={busy || uploading}>{busy ? "Saving…" : editing ? "Save milestone ↗" : "Add milestone ↗"}</button>{editing && <button type="button" onClick={startNew}>Cancel</button>}</div>
        </form>
        <div className="admin-timeline-list">
          {!items.length && <p>No milestones found. Run the career timeline SQL setup, then add your first entry.</p>}
          {items.map((item, index) => <article key={item.id}><div><span>{item.category.toUpperCase()} · {item.is_published ? "PUBLISHED" : "DRAFT"}</span><strong>{item.title}</strong><small>{item.organization} · {item.start_date}{item.end_date ? ` — ${item.end_date}` : " — Present"}</small></div><div className="admin-timeline-item-actions"><button type="button" onClick={() => void move(index, -1)} aria-label="Move milestone up" disabled={index === 0}>↑</button><button type="button" onClick={() => void move(index, 1)} aria-label="Move milestone down" disabled={index === items.length - 1}>↓</button><button type="button" onClick={() => edit(item)}>Edit</button><button type="button" onClick={() => void remove(item.id)} aria-label={`Delete ${item.title}`}>×</button></div></article>)}
        </div>
      </div>
    </section>
  );
}
