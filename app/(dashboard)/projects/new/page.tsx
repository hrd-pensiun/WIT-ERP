"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, FolderPlus, Loader2, Save, Search, X,
  Zap, Building2, User, DollarSign, Calendar, FileText,
  ChevronDown, CheckCircle2, Globe, Video,
} from "lucide-react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────
interface Lead {
  id: string
  lead_number: string | null
  title: string | null
  company_name: string | null
  contact_name: string
  estimated_value: number | null
  expected_close_date: string | null
  status: string | null
  notes: string | null
  pic_sales_id: string | null
  project_type_id: string | null
}

interface ProjectType {
  id: string
  name: string
}

interface UserProfile {
  id: string
  full_name: string
  employee_number: string | null
}

interface FormData {
  project_name:       string
  client_name:        string
  company_name:       string
  status:             string
  health:             string
  project_type:       string
  quotation_publish:  string
  po_value:           string
  start_date:         string
  kickoff_date:       string
  start_dev_date:     string
  end_date:           string
  term_of_payment:    string
  project_url:        string
  online_meeting_url: string
  notes:              string
  pic_commercial_id:  string
  pic_adm_id:         string
  pm_id:              string
  lead_id:            string
}

const INITIAL_FORM: FormData = {
  project_name: "", client_name: "", company_name: "",
  status: "draft", health: "green", project_type: "Consultant",
  quotation_publish: "", po_value: "",
  start_date: "", kickoff_date: "", start_dev_date: "", end_date: "",
  term_of_payment: "", project_url: "", online_meeting_url: "",
  notes: "", pic_commercial_id: "", pic_adm_id: "", pm_id: "", lead_id: "",
}

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n)

// ── Component ──────────────────────────────────────────────────────────────
export default function NewProjectPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lead picker state
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadSearch, setLeadSearch] = useState("")
  const [leadOpen, setLeadOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loadingLeads, setLoadingLeads] = useState(false)

  // Project types from master data
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])

  // Users for PIC selects
  const [users, setUsers] = useState<UserProfile[]>([])

  // ── Fetch leads ────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    if (!insForge) return
    setLoadingLeads(true)
    try {
      const tenantId = getTenantId()
      const { data } = await insForge
        .from("crm_leads")
        .select("id,lead_number,title,company_name,contact_name,estimated_value,expected_close_date,status,notes,pic_sales_id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(200)
      setLeads((data as Lead[]) ?? [])
    } catch { /* ignore */ } finally {
      setLoadingLeads(false)
    }
  }, [])

  // ── Fetch users ────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (!insForge) return
    try {
      const tenantId = getTenantId()
      const { data } = await insForge
        .from("user_profiles")
        .select("id,full_name,employee_number")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("full_name", { ascending: true })
      setUsers((data as UserProfile[]) ?? [])
    } catch { /* ignore */ }
  }, [])

  // ── Fetch project types ────────────────────────────────────────────────
  const fetchProjectTypes = useCallback(async () => {
    if (!insForge) return
    const { data } = await insForge
      .from("commercial_project_types")
      .select("id,name")
      .order("name", { ascending: true })
    setProjectTypes((data as ProjectType[]) ?? [])
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchUsers()
    fetchProjectTypes()
  }, [fetchLeads, fetchUsers, fetchProjectTypes])

  // ── Import from lead ───────────────────────────────────────────────────
  const importFromLead = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadOpen(false)
    setLeadSearch("")
    // Resolve project_type_id → name
    const resolvedType = lead.project_type_id
      ? (projectTypes.find((t) => t.id === lead.project_type_id)?.name ?? "")
      : ""
    setForm((prev) => ({
      ...prev,
      lead_id: lead.id,
      project_name: lead.title || prev.project_name,
      client_name: lead.contact_name || prev.client_name,
      company_name: lead.company_name || prev.company_name,
      quotation_publish: lead.estimated_value ? String(lead.estimated_value) : prev.quotation_publish,
      end_date: lead.expected_close_date || prev.end_date,
      notes: lead.notes || prev.notes,
      pic_commercial_id: lead.pic_sales_id || prev.pic_commercial_id,
      project_type: resolvedType || prev.project_type,
    }))
  }

  const clearLead = () => {
    setSelectedLead(null)
    setForm((prev) => ({ ...prev, lead_id: "" }))
  }

  // ── Filter leads ───────────────────────────────────────────────────────
  const filteredLeads = leads.filter((l) => {
    if (!leadSearch) return true
    const q = leadSearch.toLowerCase()
    return (
      (l.title ?? "").toLowerCase().includes(q) ||
      (l.lead_number ?? "").toLowerCase().includes(q) ||
      (l.company_name ?? "").toLowerCase().includes(q) ||
      l.contact_name.toLowerCase().includes(q)
    )
  })

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!insForge) return
    if (!form.project_name.trim()) {
      setError("Nama proyek wajib diisi.")
      return
    }
    setError(null)
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        project_name:       form.project_name.trim(),
        client_name:        form.client_name.trim() || null,
        company_name:       form.company_name.trim() || null,
        status:             form.status,
        health:             form.health,
        project_type:       form.project_type || null,
        quotation_publish:  form.quotation_publish ? parseFloat(form.quotation_publish) : 0,
        po_value:           form.po_value ? parseFloat(form.po_value) : 0,
        start_date:         form.start_date || null,
        kickoff_date:       form.kickoff_date || null,
        start_dev_date:     form.start_dev_date || null,
        end_date:           form.end_date || null,
        term_of_payment:    form.term_of_payment || null,
        project_url:        form.project_url.trim() || null,
        online_meeting_url: form.online_meeting_url.trim() || null,
        notes:              form.notes.trim() || null,
        pic_commercial_id:  form.pic_commercial_id || null,
        pic_adm_id:         form.pic_adm_id || null,
        pm_id:              form.pm_id || null,
        lead_id:            form.lead_id || null,
      }

      // Jika dari lead, simpan snapshot
      if (selectedLead) {
        payload.lead_data_snapshot = {
          lead_number: selectedLead.lead_number,
          title: selectedLead.title,
          company_name: selectedLead.company_name,
          contact_name: selectedLead.contact_name,
          estimated_value: selectedLead.estimated_value,
          status: selectedLead.status,
          notes: selectedLead.notes,
        }
      }

      const { data, error: insertErr } = await insForge
        .from("commercial_projects")
        .insert([payload])
        .select("id")
        .single()

      if (insertErr) throw insertErr
      router.push(`/projects/${(data as { id: string }).id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan proyek")
    } finally {
      setSaving(false)
    }
  }

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  // ── UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <button className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-emerald-500" />
            Proyek Baru
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Buat proyek baru secara manual atau impor data dari Lead
          </p>
        </div>
      </div>

      {/* ── Import dari Lead ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Import dari Lead</h2>
          <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">Opsional</span>
        </div>
        <div className="p-5">
          {selectedLead ? (
            // Lead terpilih — tampilkan ringkasan
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedLead.title || selectedLead.contact_name}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  {selectedLead.lead_number && (
                    <span className="text-[0.65rem] text-zinc-500"># {selectedLead.lead_number}</span>
                  )}
                  {selectedLead.company_name && (
                    <span className="text-[0.65rem] text-zinc-500">{selectedLead.company_name}</span>
                  )}
                  {selectedLead.estimated_value && (
                    <span className="text-[0.65rem] text-emerald-600 dark:text-emerald-400 font-medium">
                      {fmtIDR(selectedLead.estimated_value)}
                    </span>
                  )}
                </div>
                <p className="text-[0.65rem] text-zinc-400 mt-0.5">Data lead telah diisikan ke form di bawah</p>
              </div>
              <button
                type="button"
                onClick={clearLead}
                className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                title="Lepas lead"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            // Picker lead
            <div className="relative">
              <button
                type="button"
                onClick={() => setLeadOpen((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-500 hover:border-amber-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">Cari dan pilih lead untuk diimpor...</span>
                <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", leadOpen && "rotate-180")} />
              </button>

              {leadOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg overflow-hidden">
                  {/* Search inside dropdown */}
                  <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                      <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        placeholder="Nama lead, no. lead, perusahaan..."
                        className="flex-1 text-xs bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                      />
                      {leadSearch && (
                        <button onClick={() => setLeadSearch("")} className="text-zinc-400 hover:text-zinc-600">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* List */}
                  <div className="max-h-64 overflow-y-auto">
                    {loadingLeads ? (
                      <div className="flex items-center justify-center py-6 gap-2 text-xs text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Memuat leads...
                      </div>
                    ) : filteredLeads.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        {leadSearch ? "Lead tidak ditemukan" : "Belum ada lead"}
                      </div>
                    ) : (
                      filteredLeads.map((lead) => (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => importFromLead(lead)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left border-b border-zinc-50 dark:border-zinc-800/50 last:border-0"
                        >
                          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                {lead.title || lead.contact_name}
                              </p>
                              {lead.lead_number && (
                                <span className="text-[0.6rem] text-zinc-400 font-mono shrink-0">#{lead.lead_number}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lead.company_name && (
                                <span className="text-[0.65rem] text-zinc-500 truncate">{lead.company_name}</span>
                              )}
                              {lead.estimated_value && (
                                <span className="text-[0.65rem] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
                                  {fmtIDR(lead.estimated_value)}
                                </span>
                              )}
                            </div>
                          </div>
                          {lead.status && (
                            <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0 capitalize">
                              {lead.status}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                  {/* Close */}
                  <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setLeadOpen(false)}
                      className="w-full text-xs text-zinc-400 hover:text-zinc-600 py-1"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Section: Identitas Proyek */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Identitas Proyek</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama Proyek */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Nama Proyek <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.project_name}
                onChange={set("project_name")}
                required
                placeholder="cth. Implementasi WMS PT. ABC"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Nama Klien */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <User className="w-3 h-3" /> Nama Klien
              </label>
              <input
                type="text"
                value={form.client_name}
                onChange={set("client_name")}
                placeholder="Nama kontak / PIC klien"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Perusahaan */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> Perusahaan / Company
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={set("company_name")}
                placeholder="Nama perusahaan klien"
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Tipe */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tipe Proyek</label>
              <select
                value={form.project_type}
                onChange={set("project_type")}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
              >
                <option value="">— Pilih Tipe —</option>
                {projectTypes.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors"
              >
                <option value="draft">Draft</option>
                <option value="administration">Administration</option>
                <option value="kick-off">Kick-off</option>
                <option value="on-going">On-Going</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="hold">Hold</option>
              </select>
            </div>

            {/* Health */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Health</label>
              <div className="flex items-center gap-2">
                {(["green", "yellow", "red"] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, health: h }))}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-colors",
                      form.health === h
                        ? h === "green"
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                          : h === "yellow"
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                          : "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300"
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      h === "green" ? "bg-emerald-500" : h === "yellow" ? "bg-amber-400" : "bg-red-500"
                    )} />
                    {h.charAt(0).toUpperCase() + h.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Keuangan */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Keuangan</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Quotation / Harga Penawaran (Rp)</label>
              <input
                type="number"
                value={form.quotation_publish}
                onChange={set("quotation_publish")}
                placeholder="0"
                min={0}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nilai PO (Rp)</label>
              <input
                type="number"
                value={form.po_value}
                onChange={set("po_value")}
                placeholder="0"
                min={0}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Term of Payment</label>
              <select
                value={form.term_of_payment}
                onChange={set("term_of_payment")}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
              >
                <option value="">— Pilih TOP —</option>
                <option value="DP 30%">DP 30%</option>
                <option value="DP 50%">DP 50%</option>
                <option value="100% di awal">100% di awal</option>
                <option value="100% di akhir">100% di akhir</option>
                <option value="Bertahap">Bertahap</option>
              </select>
            </div>
          </div>
        </section>

        {/* Section: Jadwal */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Jadwal</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tanggal Mulai</label>
              <input type="date" value={form.start_date} onChange={set("start_date")}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Kick-off Date</label>
              <input type="date" value={form.kickoff_date} onChange={set("kickoff_date")}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Start Dev Date</label>
              <input type="date" value={form.start_dev_date} onChange={set("start_dev_date")}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tanggal Selesai / Target</label>
              <input type="date" value={form.end_date} onChange={set("end_date")}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-purple-400 dark:focus:border-purple-500 transition-colors" />
            </div>
          </div>
        </section>

        {/* Section: URL & Meeting */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">URL & Meeting</h2>
            <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-medium">Opsional</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Project URL
              </label>
              <input type="url" value={form.project_url} onChange={set("project_url")} placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Video className="w-3 h-3" /> Online Meeting URL
              </label>
              <input type="url" value={form.online_meeting_url} onChange={set("online_meeting_url")} placeholder="https://meet.google.com/..."
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors" />
            </div>
          </div>
        </section>

        {/* Section: Tim Penanggung Jawab */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tim Penanggung Jawab</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {(
              [
                { key: "pic_commercial_id", label: "PIC Commercial" },
                { key: "pic_adm_id", label: "PIC Admin" },
                { key: "pm_id", label: "Project Manager" },
              ] as { key: keyof FormData; label: string }[]
            ).map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
                <select
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors"
                >
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
        </section>

        {/* Section: Catatan */}
        <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Catatan</h2>
          </div>
          <div className="p-5">
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={4}
              placeholder="Informasi tambahan, scope of work, requirement, dll."
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
            />
          </div>
        </section>

        {/* Footer Aksi */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/projects">
            <button type="button" className="px-5 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              Batal
            </button>
          </Link>
          <button
            type="submit"
            disabled={saving || !form.project_name.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4" /> Simpan Proyek</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
