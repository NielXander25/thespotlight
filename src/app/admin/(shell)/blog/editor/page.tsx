"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { marked } from "marked";
import { DESKS } from "@/content/site";

marked.use({ gfm: true, breaks: true });

type Form = {
  title: string; slug: string; category: string; excerpt: string;
  cover_image: string; cover_alt: string; body: string; tags: string;
  meta_title: string; meta_description: string; status: "draft" | "published";
};
const EMPTY: Form = {
  title: "", slug: "", category: "", excerpt: "", cover_image: "", cover_alt: "",
  body: "", tags: "", meta_title: "", meta_description: "", status: "draft",
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

function Editor() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<"cover" | "inline" | "">("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/posts/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const p = (await res.json()).post;
        setForm({
          title: p.title || "", slug: p.slug || "", category: p.category || "",
          excerpt: p.excerpt || "", cover_image: p.cover_image || "", cover_alt: p.cover_alt || "",
          body: p.body || "", tags: (p.tags || []).join(", "),
          meta_title: p.meta_title || "", meta_description: p.meta_description || "",
          status: p.status === "published" ? "published" : "draft",
        });
        setSlugTouched(true);
      } catch { setError("Couldn't load this post."); } finally { setLoading(false); }
    })();
  }, [id]);

  async function upload(file: File, which: "cover" | "inline") {
    setUploading(which); setError("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      if (which === "cover") set({ cover_image: data.url });
      else insertAtCursor(`\n\n![${file.name.replace(/\.[^.]+$/, "")}](${data.url})\n*Caption*\n\n`);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); }
    finally { setUploading(""); }
  }

  function insertAtCursor(text: string) {
    const ta = bodyRef.current;
    if (!ta) { set({ body: form.body + text }); return; }
    const start = ta.selectionStart, end = ta.selectionEnd;
    const next = form.body.slice(0, start) + text + form.body.slice(end);
    set({ body: next });
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + text.length; });
  }

  const save = useCallback(async (publish?: boolean) => {
    setSaving(true); setError("");
    const payload = { ...form, status: publish === undefined ? form.status : publish ? "published" : "draft" };
    try {
      const res = await fetch(id ? `/api/admin/posts/${id}` : "/api/admin/posts", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      router.push("/admin/blog"); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed."); setSaving(false); }
  }, [form, id, router]);

  if (loading) return <p className="text-sm text-mist">Loading…</p>;

  const effSlug = slugTouched && form.slug ? form.slug : slugify(form.title);

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-beam">{id ? "Edit post" : "New post"}</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/admin/blog")} className="rounded-xl border border-line px-4 py-2 text-sm font-medium text-mist hover:text-beam">Cancel</button>
          <button disabled={saving} onClick={() => save(false)} className="rounded-xl border border-line bg-surface2 px-4 py-2 text-sm font-medium text-beam disabled:opacity-50">Save draft</button>
          <button disabled={saving} onClick={() => save(true)} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-light disabled:opacity-50">
            {saving ? "Saving…" : "Publish"}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* left: content */}
        <div className="space-y-5">
          <Field label="Title">
            <input className={inp} value={form.title}
              onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
              placeholder="Who's in the Spotlight this week?" />
          </Field>
          <Field label="Link (slug)" hint={`/blog/${effSlug || "…"}`}>
            <input className={inp} value={form.slug}
              onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }}
              placeholder="auto from title" />
          </Field>
          <Field label="Excerpt (summary / dek)" hint={`${form.excerpt.length}/320 · used in SEO description & cards`}>
            <textarea className={inp} rows={2} maxLength={320} value={form.excerpt}
              onChange={(e) => set({ excerpt: e.target.value })} placeholder="One or two sentences that pull the reader in." />
          </Field>

          <Field label="Body (Markdown)">
            <div className="mb-2 flex flex-wrap gap-2">
              <ToolbarBtn onClick={() => insertAtCursor("\n\n## Heading\n\n")}>H2</ToolbarBtn>
              <ToolbarBtn onClick={() => insertAtCursor("**bold**")}>Bold</ToolbarBtn>
              <ToolbarBtn onClick={() => insertAtCursor("*italic*")}>Italic</ToolbarBtn>
              <ToolbarBtn onClick={() => insertAtCursor("\n\n> Quote\n\n")}>Quote</ToolbarBtn>
              <ToolbarBtn onClick={() => insertAtCursor("\n\n- List item\n")}>List</ToolbarBtn>
              <ToolbarBtn onClick={() => insertAtCursor("[link text](https://)")}>Link</ToolbarBtn>
              <label className="cursor-pointer rounded-lg bg-brand/20 px-2.5 py-1.5 text-xs font-medium text-brand-light hover:bg-brand/30">
                {uploading === "inline" ? "Uploading…" : "＋ Image"}
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "inline"); e.currentTarget.value = ""; }} />
              </label>
            </div>
            <textarea ref={bodyRef} className={`${inp} min-h-[340px] font-mono text-[13px] leading-relaxed`}
              value={form.body} onChange={(e) => set({ body: e.target.value })}
              placeholder="Write the story in Markdown. Use the Image button to upload and insert pictures." />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-mist">Live preview</p>
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="prose" style={{ ["--prose-ink" as string]: "#1b1c22" }}
                dangerouslySetInnerHTML={{ __html: marked.parse(form.body || "_Nothing yet._", { async: false }) as string }} />
            </div>
          </div>
        </div>

        {/* right: meta */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-surface/60 p-5 space-y-4">
            <Field label="Cover image">
              {form.cover_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.cover_image} alt="" className="mb-2 aspect-[16/10] w-full rounded-lg object-cover" />
              ) : (
                <div className="mb-2 flex aspect-[16/10] w-full items-center justify-center rounded-lg border border-dashed border-line text-xs text-mist">No cover yet</div>
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer rounded-lg bg-brand/20 px-3 py-1.5 text-xs font-medium text-brand-light hover:bg-brand/30">
                  {uploading === "cover" ? "Uploading…" : "Upload"}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, "cover"); e.currentTarget.value = ""; }} />
                </label>
                {form.cover_image && <button onClick={() => set({ cover_image: "" })} className="rounded-lg px-3 py-1.5 text-xs text-mist hover:text-red-300">Remove</button>}
              </div>
            </Field>
            <Field label="Cover caption / alt text" hint="Describes the image (SEO + accessibility)">
              <input className={inp} value={form.cover_alt} onChange={(e) => set({ cover_alt: e.target.value })} />
            </Field>
          </div>

          <div className="rounded-2xl border border-line bg-surface/60 p-5 space-y-4">
            <Field label="Category">
              <select className={inp} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                <option value="">None</option>
                <option value="Spotlight Profiles">Spotlight Profiles</option>
                {DESKS.map((d) => <option key={d.slug} value={d.name}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Tags" hint="comma separated">
              <input className={inp} value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="student, research, AI" />
            </Field>
          </div>

          <div className="rounded-2xl border border-line bg-surface/60 p-5 space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-mist">Search / social (optional)</p>
            <Field label="Meta title" hint="defaults to the title">
              <input className={inp} value={form.meta_title} onChange={(e) => set({ meta_title: e.target.value })} />
            </Field>
            <Field label="Meta description" hint={`${form.meta_description.length}/160 recommended`}>
              <textarea className={inp} rows={2} value={form.meta_description} onChange={(e) => set({ meta_description: e.target.value })} placeholder="defaults to the excerpt" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-xl border border-line bg-surface/80 px-3.5 py-2.5 text-sm text-beam placeholder:text-mist/50 focus:border-brand/60 focus:outline-none";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-mist">
        <span>{label}</span>{hint && <span className="text-xs font-normal text-mist/60">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
function ToolbarBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="rounded-lg bg-surface2 px-2.5 py-1.5 text-xs font-medium text-beam hover:bg-surface2/70">{children}</button>;
}

export default function EditorPage() {
  return <Suspense fallback={<p className="text-sm text-mist">Loading…</p>}><Editor /></Suspense>;
}
