"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, FileText, User, AlertCircle, Trash2 } from "lucide-react"
import { insForge } from "@/lib/insforge"
import { cn } from "@/lib/utils"

interface UserProfile { id: string; full_name: string; employee_number: string | null }

const rowCls = "flex items-center px-4 py-2.5 gap-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
const labelCls = "text-xs text-zinc-400 w-36 shrink-0"
const inputCls = "flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 border-b border-transparent focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors py-0.5"
const selectCls = "flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 border-b border-transparent focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors py-0.5 cursor-pointer"

export default function EditProjectTaskPage() {
  const router = useRouter()
  const params = useParams<{ id: string; taskId: string }>()
  const { id, taskId } = params

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    status: "todo",
    priority: "medium",
    start_date: "",
    due_date: "",
    estimated_hours: "",
    actual_hours: "",
    progress_percent: "0",
  })

  const fetchAll = useCallback(async () => {
    if (!insForge) { setLoading(false); return }
    try {
      const [taskRes, usersRes] = await Promise.all([
        (insForge as any).from("project_tasks").select("*").eq("id", taskId).single(),
        insForge.from("user_profiles").select("id,full_name,employee_number").is("deleted_at", null).order("full_name", { ascending: true }),
      ])
      if (usersRes.data) setUsers(usersRes.data as UserProfile[])
      if (taskRes.data) {
        const d = taskRes.data as Record<string, unknown>
        setForm({
          title:            String(d.title ?? ""),
          description:      String(d.description ?? ""),
          assigned_to:      String(d.assigned_to ?? ""),
          status:           String(d.status ?? "todo"),
          priority:         String(d.priority ?? "medium"),
          start_date:       String(d.start_date ?? ""),
          due_date:         String(d.due_date ?? ""),
          estimated_hours:  d.estimated_hours != null ? String(d.estimated_hours) : "",
          actual_hours:     d.actual_hours != null ? String(d.actual_hours) : "",
          progress_percent: String(d.progress_percent ?? 0),
        })
      }
    } catch (err) {
      console.error(err)
      setError("Gagal memuat data task")
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!insForge || !form.title.trim()) return
    setSaving(true); setError(null)
    try {
      const { error: err } = await (insForge as any).from("project_tasks").update({
        title:            form.title.trim(),
        description:      form.description.trim() || null,
        assigned_to:      form.assigned_to || null,
        status:           form.status,
        priority:         form.priority,
        start_date:       form.start_date || null,
        due_date:         form.due_date || null,
        estimated_hours:  form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        actual_hours:     form.actual_hours ? parseFloat(form.actual_hours) : null,
        progress_percent: parseInt(form.progress_percent) || 0,
        updated_at:       new Date().toISOString(),
      }).eq("id", taskId)
      if (err) throw err
      router.push(`/projects/${id}?tab=tasks`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan task")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!insForge || !confirm("Hapus task ini?")) return
    setDeleting(true)
    try {
      await (insForge as any).from("project_tasks").update({ deleted_at: new Date().toISOString() }).eq("id", taskId)
      router.push(`/projects/${id}?tab=tasks`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus task")
      setDeleting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link href={`/projects/${id}?tab=tasks`}>
            <button className="mt-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{form.title || "Edit Task"}</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Edit task project</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Hapus
          </button>
          <Link href={`/projects/${id}?tab=tasks`}>
            <button className="text-xs px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              Batal
            </button>
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
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

      {/* Detail Task */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Detail Task</span>
        </div>
        <div>
          <div className={rowCls}>
            <span className={labelCls}>Judul <span className="text-red-400">*</span></span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputCls}
              placeholder="Judul task"
            />
          </div>
          <div className={cn(rowCls, "items-start")}>
            <span className={cn(labelCls, "pt-1")}>Deskripsi</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Deskripsi task (opsional)"
              className="flex-1 text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 border-b border-transparent focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors py-0.5 resize-none"
            />
          </div>
          <div className={rowCls}>
            <span className={labelCls}><User className="w-3 h-3 inline mr-1 opacity-50" />Assignee</span>
            <select value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)} className={selectCls}>
              <option value="">— Tidak ditugaskan —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}{u.employee_number ? ` (${u.employee_number})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status & Priority */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Status & Prioritas</span>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-zinc-400 mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {[
                { v: "todo",        l: "Todo",        c: "border-zinc-300 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
                { v: "in_progress", l: "In Progress", c: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                { v: "review",      l: "Review",      c: "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                { v: "done",        l: "Done",        c: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
              ].map(({ v, l, c }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("status", v)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors",
                    form.status === v ? c : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-300"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-400 mb-2">Prioritas</p>
            <div className="flex flex-wrap gap-2">
              {[
                { v: "low",    l: "Low",    c: "border-zinc-300 bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" },
                { v: "medium", l: "Medium", c: "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                { v: "high",   l: "High",   c: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
                { v: "urgent", l: "Urgent", c: "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
              ].map(({ v, l, c }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("priority", v)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors",
                    form.priority === v ? c : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-300"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Jadwal & Estimasi */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Jadwal & Jam</span>
        </div>
        <div>
          <div className={rowCls}>
            <span className={labelCls}>Tanggal Mulai</span>
            <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputCls} />
          </div>
          <div className={rowCls}>
            <span className={labelCls}>Due Date</span>
            <input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} className={inputCls} />
          </div>
          <div className={rowCls}>
            <span className={labelCls}>Estimasi Jam</span>
            <input
              type="number" min={0} step={0.5}
              value={form.estimated_hours}
              onChange={(e) => set("estimated_hours", e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div className={rowCls}>
            <span className={labelCls}>Actual Jam</span>
            <input
              type="number" min={0} step={0.5}
              value={form.actual_hours}
              onChange={(e) => set("actual_hours", e.target.value)}
              placeholder="0"
              className={inputCls}
            />
          </div>
          <div className={rowCls}>
            <span className={labelCls}>Progress (%)</span>
            <div className="flex-1 flex items-center gap-3">
              <input
                type="range" min={0} max={100}
                value={form.progress_percent}
                onChange={(e) => set("progress_percent", e.target.value)}
                className="flex-1 accent-emerald-500"
              />
              <input
                type="number" min={0} max={100}
                value={form.progress_percent}
                onChange={(e) => set("progress_percent", String(Math.min(100, Math.max(0, parseInt(e.target.value) || 0))))}
                className="w-14 text-sm text-center bg-transparent outline-none border-b border-transparent focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 py-0.5"
              />
              <span className="text-xs text-zinc-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile footer save */}
      <div className="flex items-center justify-end gap-3 pt-2 lg:hidden">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 disabled:opacity-50"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "Hapus"}
        </button>
        <Link href={`/projects/${id}?tab=tasks`}>
          <button className="text-xs px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500">Batal</button>
        </Link>
        <button
          onClick={handleSave}
          disabled={saving || !form.title.trim()}
          className="flex items-center gap-1.5 text-xs px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Simpan
        </button>
      </div>
    </div>
  )
}
