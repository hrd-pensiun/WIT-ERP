"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Save, Loader2, FileText, DollarSign,
  Calendar, User, AlertCircle, Globe, Video,
} from "lucide-react"
import { insForge } from "@/lib/insforge"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────
interface ProjectType { id: string; name: string }
interface UserProfile  { id: string; full_name: string; employee_number: string | null }

interface FormData {
  project_name:      string
  project_code:      string
  company_name:      string
  client_name:       string
  status:            string
  health:            string
  project_type:      string
  po_value:          string
  quotation_publish: string
  start_date:        string
  kickoff_date:      string
  start_dev_date:    string
  end_date:          string
  term_of_payment:   string
  project_url:       string
  online_meeting_url:string
  notetaker_account: string
  notes:             string
  pic_commercial_id: string
  pic_adm_id:        string
  pm_id:             string
}

const STATUS_OPTS = [
  { value: "draft",          label: "Draft" },
  { value: "administration", label: "Administration" },
  { value: "kick-off",       label: "Kick-off" },
  { value: "on-going",       label: "On-Going" },
  { value: "completed",      label: "Completed" },
  { value: "overdue",        label: "Overdue" },
  { value: "hold",           label: "Hold" },
]

const TOP_OPTS = [
  "DP 30% - Pelunasan 70%",
  "DP 50% - Pelunasan 50%",
  "100% di awal",
  "100% di akhir",
  "Bertahap",
]

const HEALTH_OPTS = [
  { value: "green",  dot: "bg-emerald-500", label: "Green",  active: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" },
  { value: "yellow", dot: "bg-amber-400",   label: "Yellow", active: "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" },
  { value: "red",    dot: "bg-red-500",     label: "Red",    active: "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" },
]

// ── Shared field styles ────────────────────────────────────────────────────
const rowCls = "flex items-center px-4 py-2.5 gap-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
const labelCls = "text-xs text-zinc-400 w-36 shrink-0"
const inputCls = "flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 border-b border-transparent focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors py-0.5"
const selectCls = "flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 border-b border-transparent focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors py-0.5 cursor-pointer"

// ── Component ──────────────────────────────────────────────────────────────
export default function ProjectEditClient({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [users, setUsers]               = useState<UserProfile[]>([])

  const [form, setForm] = useState<FormData>({
    project_name: "", project_code: "", company_name: "", client_name: "",
    status: "draft", health: "green", project_type: "",
    po_value: "", quotation_publish: "",
    start_date: "", kickoff_date: "", start_dev_date: "", end_date: "",
    term_of_payment: "", project_url: "", online_meeting_url: "", notetaker_account: "",
    notes: "", pic_commercial_id: "", pic_adm_id: "", pm_id: "",
  })

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!insForge) { setLoading(false); return }
    try {
      const [projRes, typesRes, usersRes] = await Promise.all([
        insForge.from("commercial_projects").select("*").eq("id", id).is("deleted_at", null).single(),
        insForge.from("commercial_project_types").select("id,name").order("name", { ascending: true }),
        insForge.from("user_profiles").select("id,full_name,employee_number").is("deleted_at", null).order("full_name", { ascending: true }),
      ])
      if (typesRes.data) setProjectTypes(typesRes.data as ProjectType[])
      if (usersRes.data) setUsers(usersRes.data as UserProfile[])
      if (projRes.data) {
        const d = projRes.data as Record<string, unknown>
        setForm({
          project_name:      String(d.project_name ?? ""),
          project_code:      String(d.project_code ?? ""),
          company_name:      String(d.company_name ?? ""),
          client_name:       String(d.client_name ?? ""),
          status:            String(d.status ?? "draft"),
          health:            String(d.health ?? "green"),
          project_type:      String(d.project_type ?? ""),
          po_value:          d.po_value ? String(d.po_value) : "",
          quotation_publish: d.quotation_publish ? String(d.quotation_publish) : "",
          start_date:        String(d.start_date ?? ""),
          kickoff_date:      String(d.kickoff_date ?? ""),
          start_dev_date:    String(d.start_dev_date ?? ""),
          end_date:          String(d.end_date ?? ""),
          term_of_payment:   String(d.term_of_payment ?? ""),
          project_url:       String(d.project_url ?? ""),
          online_meeting_url:String(d.online_meeting_url ?? ""),
          notetaker_account: String(d.notetaker_account ?? ""),
          notes:             String(d.notes ?? ""),
          pic_commercial_id: String(d.pic_commercial_id ?? ""),
          pic_adm_id:        String(d.pic_adm_id ?? ""),
          pm_id:             String(d.pm_id ?? ""),
        })
      }
    } catch (err) {
      console.error(err)
      setError("Gagal memuat data project")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!insForge || !form.project_name.trim()) return
    setSaving(true); setError(null)
    try {
      const { error: err } = await insForge.from("commercial_projects").update({
        project_name:       form.project_name.trim(),
        company_name:       form.company_name.trim() || null,
        client_name:        form.client_name.trim() || null,
        status:             form.status,
        health:             form.health,
        project_type:       form.project_type || null,
        po_value:           form.po_value ? parseFloat(form.po_value) : 0,
        quotation_publish:  form.quotation_publish ? parseFloat(form.quotation_publish) : 0,
        start_date:         form.start_date || null,
        kickoff_date:       form.kickoff_date || null,
        start_dev_date:     form.start_dev_date || null,
        end_date:           form.end_date || null,
        term_of_payment:    form.term_of_payment || null,
        project_url:        form.project_url.trim() || null,
        online_meeting_url: form.online_meeting_url.trim() || null,
        notetaker_account:  form.notetaker_account.trim() || null,
        notes:              form.notes.trim() || null,
        pic_commercial_id:  form.pic_commercial_id || null,
        pic_adm_id:         form.pic_adm_id || null,
        pm_id:              form.pm_id || null,
      }).eq("id", id)
      if (err) throw err
      router.push(`/projects/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof FormData, v: string) => setForm((p) => ({ ...p, [k]: v }))
  const userName = (uid: string) => users.find((u) => u.id === uid)?.full_name ?? ""

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href={`/projects/${id}`}>
            <button className="mt-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{form.project_name || "Edit Project"}</h1>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{form.project_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/projects/${id}`}>
            <button className="text-xs px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              Batal
            </button>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !form.project_name.trim()}
            className="flex items-center gap-1.5 text-xs px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Simpan
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── 2-column layout (same as detail page) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Detail Proyek */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Detail Proyek</span>
            </div>
            <div>
              {/* Nama Proyek */}
              <div className={rowCls}>
                <span className={labelCls}>Nama Proyek <span className="text-red-400">*</span></span>
                <input value={form.project_name} onChange={(e) => set("project_name", e.target.value)} className={inputCls} placeholder="Nama proyek" />
              </div>
              {/* Kode (read-only) */}
              <div className={rowCls}>
                <span className={labelCls}>Kode Proyek</span>
                <span className="text-sm font-mono text-zinc-400">{form.project_code || "—"}</span>
              </div>
              {/* Perusahaan */}
              <div className={rowCls}>
                <span className={labelCls}>Perusahaan</span>
                <input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} className={inputCls} placeholder="—" />
              </div>
              {/* Klien */}
              <div className={rowCls}>
                <span className={labelCls}>Klien / Kontak</span>
                <input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} className={inputCls} placeholder="—" />
              </div>
              {/* Tipe */}
              <div className={rowCls}>
                <span className={labelCls}>Tipe Proyek</span>
                <select value={form.project_type} onChange={(e) => set("project_type", e.target.value)} className={selectCls}>
                  <option value="">— Pilih tipe —</option>
                  {projectTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              {/* Term of Payment */}
              <div className={rowCls}>
                <span className={labelCls}>Term of Payment</span>
                <select value={form.term_of_payment} onChange={(e) => set("term_of_payment", e.target.value)} className={selectCls}>
                  <option value="">— Pilih TOP —</option>
                  {TOP_OPTS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Tanggal Mulai */}
              <div className={rowCls}>
                <span className={labelCls}>Tanggal Mulai</span>
                <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputCls} />
              </div>
              {/* Kick-off Date */}
              <div className={rowCls}>
                <span className={labelCls}>Kick-off Date</span>
                <input type="date" value={form.kickoff_date} onChange={(e) => set("kickoff_date", e.target.value)} className={inputCls} />
              </div>
              {/* Start Dev Date */}
              <div className={rowCls}>
                <span className={labelCls}>Start Dev Date</span>
                <input type="date" value={form.start_dev_date} onChange={(e) => set("start_dev_date", e.target.value)} className={inputCls} />
              </div>
              {/* Tanggal Selesai */}
              <div className={rowCls}>
                <span className={labelCls}>Tanggal Selesai</span>
                <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inputCls} />
              </div>

              {/* Project URL */}
              <div className={rowCls}>
                <span className={labelCls}><Globe className="w-3 h-3 inline mr-1 opacity-50" />Project URL</span>
                <input value={form.project_url} onChange={(e) => set("project_url", e.target.value)} className={inputCls} placeholder="https://..." />
              </div>
              {/* Online Meeting URL */}
              <div className={rowCls}>
                <span className={labelCls}><Video className="w-3 h-3 inline mr-1 opacity-50" />Meeting URL</span>
                <input value={form.online_meeting_url} onChange={(e) => set("online_meeting_url", e.target.value)} className={inputCls} placeholder="https://meet.google.com/..." />
              </div>
              {/* Notetaker Account */}
              <div className={rowCls}>
                <span className={labelCls}>Notetaker Acct</span>
                <input value={form.notetaker_account} onChange={(e) => set("notetaker_account", e.target.value)} className={inputCls} placeholder="email@company.com" />
              </div>

              {/* PIC rows */}
              {(
                [
                  { key: "pic_commercial_id" as keyof FormData, label: "PIC Commercial" },
                  { key: "pic_adm_id"        as keyof FormData, label: "PIC Admin" },
                  { key: "pm_id"             as keyof FormData, label: "Project Manager" },
                ]
              ).map(({ key, label }) => (
                <div key={key} className={rowCls}>
                  <span className={labelCls}>{label}</span>
                  <select value={form[key]} onChange={(e) => set(key, e.target.value)} className={selectCls}>
                    <option value="">— Pilih —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}{u.employee_number ? ` (${u.employee_number})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Status & Health */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Status & Health</span>
            </div>
            <div className="p-4 space-y-4">
              {/* Status */}
              <div>
                <p className="text-xs text-zinc-400 mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("status", opt.value)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors",
                        form.status === opt.value
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Health */}
              <div>
                <p className="text-xs text-zinc-400 mb-2">Health</p>
                <div className="flex gap-2">
                  {HEALTH_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => set("health", opt.value)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-colors",
                        form.health === opt.value ? opt.active : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-300"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", opt.dot)} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Catatan */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Catatan</span>
            </div>
            <div className="p-4">
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={4}
                placeholder="Informasi tambahan, scope, requirement..."
                className="w-full text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">
          {/* Keuangan */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Keuangan</span>
            </div>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              <div className="flex items-center px-4 py-2.5 gap-3">
                <span className="text-xs text-zinc-400 w-28 shrink-0">Quotation (Rp)</span>
                <input
                  type="number" min={0}
                  value={form.quotation_publish}
                  onChange={(e) => set("quotation_publish", e.target.value)}
                  placeholder="0"
                  className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 border-b border-transparent focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors py-0.5 tabular-nums"
                />
              </div>
              <div className="flex items-center px-4 py-2.5 gap-3">
                <span className="text-xs text-zinc-400 w-28 shrink-0">Nilai PO (Rp)</span>
                <input
                  type="number" min={0}
                  value={form.po_value}
                  onChange={(e) => set("po_value", e.target.value)}
                  placeholder="0"
                  className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 border-b border-transparent focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors py-0.5 tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Panduan edit */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">Tips</p>
            <ul className="space-y-1.5">
              {[
                "Klik field untuk mulai mengedit",
                "Nilai finansial lain (HPP, margin) dikelola via Raw Calculator",
                "Milestones & Tasks dapat dikelola dari halaman detail",
              ].map((tip) => (
                <li key={tip} className="text-[0.65rem] text-zinc-400 flex items-start gap-1.5">
                  <span className="text-emerald-500 shrink-0 mt-0.5">·</span> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer save (mobile) */}
      <div className="flex items-center justify-end gap-3 pt-2 lg:hidden">
        <Link href={`/projects/${id}`}>
          <button className="text-xs px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500">Batal</button>
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || !form.project_name.trim()}
          className="flex items-center gap-1.5 text-xs px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </div>
    </div>
  )
}
