"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Target, Plus, FileText, Upload, ExternalLink, Calculator,
  Trash2, Loader2, User, X,
  Calendar, DollarSign, Flag, CheckCircle2, Circle, ArrowRight,
  Edit3, Users, CheckSquare, ClipboardList, BarChart3, Receipt,
  Clock, Activity, Clock9, Building2, Mail, Phone, Link as LinkIcon
} from "lucide-react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import { useAuth } from "@/hooks/useAuth"
import RichTextEditor from "./rich-text-editor"

// ============================================================
// Types
// ============================================================
interface MOM { id: string; title: string; meeting_date: string | null; participants: string | null; notes: string | null; created_at: string }
interface ProjectBrief { id: string; description: string | null; file_name: string | null; file_url: string | null; file_size: number | null; created_at: string }
interface Quotation { id: string; quotation_number: string; title: string; amount: number; status: string; notes: string | null; valid_until: string | null; created_at: string }
interface TechnicalAnalysis { id: string; title: string | null; content: string | null; link_attachment: string | null; created_by: string | null; created_at: string }
interface QuotationSummary { id: string; total_amount: number; notes: string | null }

// ============================================================
// Utils
// ============================================================
const fmtCurrency = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0)

const STATUS_STYLES: Record<string, string> = {
  raw: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  qualified: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  proposal: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  negotiation: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  closed_won: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed_lost: "bg-red-500/10 text-red-400 border-red-500/20",
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-zinc-500/10 text-zinc-400", medium: "bg-yellow-500/10 text-yellow-400",
  high: "bg-orange-500/10 text-orange-400", urgent: "bg-red-500/10 text-red-400",
}

// ============================================================
// Progress / Checklist Section
// ============================================================
function LeadProgress({ lead, hasBrief, hasQuotation, hasTechnical, hasCost }: {
  lead: any; hasBrief: boolean; hasQuotation: boolean; hasTechnical: boolean; hasCost: boolean
}) {
  const checks = [
    { label: "Contact Info", done: !!(lead.contact_name && (lead.contact_email || lead.contact_phone)) },
    { label: "Company Info", done: !!lead.company_name },
    { label: "BANT", done: [lead.budget_confirmed, lead.authority_confirmed, lead.need_confirmed, lead.timeline_confirmed].filter(Boolean).length >= 2 },
    { label: "PIC Assigned", done: !!lead.pic_sales_id },
    { label: "Project Brief", done: hasBrief },
    { label: "Quotation", done: hasQuotation },
    { label: "Tech Analysis", done: hasTechnical },
    { label: "Cost Analysis", done: hasCost },
  ]
  const doneCount = checks.filter(c => c.done).length
  const total = checks.length
  const pct = Math.round((doneCount / total) * 100)

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-950/10">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-500" /> Lead Checklist
          </h3>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
            {doneCount}/{total}
          </Badge>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {checks.map((c) => (
            <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {c.done ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 shrink-0" />}
              {c.label}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// Convert to Project Dialog
// ============================================================
export function ConvertProjectDialog({ lead, open, onOpenChange }: { lead: any; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [projectName, setProjectName] = useState(lead?.title || `Project: ${lead?.contact_name || ""}`)
  const [clientName, setClientName] = useState(lead?.company_name || lead?.contact_name || "")
  const [clientEmail] = useState(lead?.contact_email || "")
  const [clientPhone] = useState(lead?.contact_phone || "")
  const [desc, setDesc] = useState(lead?.notes || "")
  const [converting, setConverting] = useState(false)

  useEffect(() => {
    if (lead) {
      setProjectName(lead.title || `Project: ${lead.contact_name || ""}`)
      setClientName(lead.company_name || lead.contact_name || "")
      setDesc(lead.notes || "")
    }
  }, [lead])

  const handleConvert = async () => {
    if (!insForge || !projectName.trim()) return
    setConverting(true)
    try {
      // Generate project code
      const { data: lastProject } = await insForge.from("projects")
        .select("project_code")
        .order("created_at", { ascending: false })
        .limit(1)
      let seq = 1
      if (lastProject && lastProject.length > 0) {
        const match = lastProject[0].project_code?.match(/\d+/)
        if (match) seq = parseInt(match[0]) + 1
      }
      const projectCode = `PRJ-${String(seq).padStart(3, "0")}`

      // Get opportunity linked to this lead
      const { data: opp } = await insForge.from("crm_opportunities")
        .select("id")
        .eq("lead_id", lead.id)
        .limit(1)

      const { data: project } = await insForge.from("projects").insert({
        tenant_id: getTenantId(),
        project_code: projectCode,
        project_name: projectName.trim(),
        description: desc || null,
        opportunity_id: opp?.[0]?.id || null,
        client_name: clientName || null,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        priority: lead.priority || "medium",
        status: "planning",
        health: "green",
        budget: lead.estimated_value || null,
        created_by: lead.pic_sales_id || null,
      }).select().single()

      // Update lead status to closed_won
      await insForge.from("crm_leads").update({ status: "closed_won" }).eq("id", lead.id)

      onOpenChange(false)
      if (project?.id) router.push(`/projects/${project.id}/edit`)
    } catch (err) {
      console.error("Failed to convert to project:", err)
    } finally {
      setConverting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ArrowRight className="w-5 h-5 text-emerald-500" /> Convert Lead ke Project
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nama Project <span className="text-red-500">*</span></Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="bg-background border-border text-foreground text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Klien</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-background border-border text-foreground text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email Klien</Label>
              <Input value={clientEmail} disabled className="bg-muted border-border text-foreground text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Deskripsi</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="bg-background border-border text-foreground text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs h-9">Batal</Button>
            <Button onClick={handleConvert} disabled={!projectName.trim() || converting} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9 gap-1.5">
              {converting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting...</> : <><ArrowRight className="w-3.5 h-3.5" /> Convert ke Project</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Activity Timeline
// ============================================================
interface ActivityEntry {
  id: string
  type: string
  label: string
  description: string
  timestamp: string
  icon: any
}

function ActivityTimeline({ leadId, createdAt }: { leadId: string; createdAt: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimeline = async () => {
      if (!insForge) return
      const all: ActivityEntry[] = []

      // Lead created
      all.push({ id: "lead-created", type: "lead", label: "Lead dibuat", description: "Lead ini dibuat", timestamp: createdAt, icon: Target })

      // MOM
      const { data: moms } = await insForge.from("lead_mom").select("id,title,created_at").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(5)
      moms?.forEach((m: any) => all.push({ id: `mom-${m.id}`, type: "mom", label: "MOM", description: m.title, timestamp: m.created_at, icon: Users }))

      // Project Briefs
      const { data: briefs } = await insForge.from("lead_project_briefs").select("id,file_name,created_at").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(3)
      briefs?.forEach((b: any) => all.push({ id: `brief-${b.id}`, type: "brief", label: "Project Brief", description: b.file_name ? `File: ${b.file_name}` : "Deskripsi diupdate", timestamp: b.created_at, icon: FileText }))

      // Quotations
      const { data: quotes } = await insForge.from("lead_quotations").select("id,quotation_number,title,created_at").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(5)
      quotes?.forEach((q: any) => all.push({ id: `quote-${q.id}`, type: "quotation", label: "Quotation", description: `${q.quotation_number} — ${q.title}`, timestamp: q.created_at, icon: Receipt }))

      // Technical Analysis
      const { data: techs } = await insForge.from("lead_technical_analyses").select("id,created_at").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1)
      techs?.forEach((t: any) => all.push({ id: `tech-${t.id}`, type: "tech", label: "Tech Analysis", description: "Analisis teknis disimpan", timestamp: t.created_at, icon: ClipboardList }))

      // Summary
      const { data: sums } = await insForge.from("lead_quotation_summaries").select("id,created_at").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1)
      sums?.forEach((s: any) => all.push({ id: `sum-${s.id}`, type: "summary", label: "Summary Quotation", description: "Ringkasan quotation diupdate", timestamp: s.created_at, icon: BarChart3 }))

      // Opportunities
      const { data: opps } = await insForge.from("crm_opportunities").select("id,stage,created_at").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(3)
      opps?.forEach((o: any) => all.push({ id: `opp-${o.id}`, type: "opportunity", label: "Pipeline", description: `Stage: ${o.stage}`, timestamp: o.created_at, icon: Target }))

      all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setEntries(all.slice(0, 10))
      setLoading(false)
    }
    fetchTimeline()
  }, [leadId, createdAt])

  const timeAgo = (t: string) => {
    const diff = Date.now() - new Date(t).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "baru saja"
    if (mins < 60) return `${mins}m lalu`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}j lalu`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}h lalu`
    return new Date(t).toLocaleDateString("id-ID", { month: "short", day: "numeric" })
  }

  if (loading) return <div className="text-center py-6 text-xs text-muted-foreground">Memuat aktivitas...</div>

  return (
    <div className="space-y-0">
      {entries.map((e, i) => (
        <div key={e.id} className="flex gap-3 pb-4 relative">
          {/* Timeline line */}
          {i < entries.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border" />}
          {/* Icon */}
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 relative z-10">
            <e.icon className="w-3 h-3 text-muted-foreground" />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">{e.label}</p>
            <p className="text-[0.6rem] text-muted-foreground truncate">{e.description}</p>
            <p className="text-[0.55rem] text-muted-foreground/60 mt-0.5">{timeAgo(e.timestamp)}</p>
          </div>
        </div>
      ))}
      {entries.length === 0 && <p className="text-xs text-muted-foreground py-6 text-center">Belum ada aktivitas</p>}
    </div>
  )
}

// ============================================================
// Info Tab — 3 Column Layout (40/30/30)
// ============================================================
function InfoTab({ lead, leadId, hasBrief, hasQuotation, hasTechnical, hasCost }: {
  lead: any; leadId: string;
  hasBrief: boolean; hasQuotation: boolean; hasTechnical: boolean; hasCost: boolean;
}) {
  const [projectTypeName, setProjectTypeName] = useState<string>("")

  useEffect(() => {
    if (!insForge) return
    if (lead.project_type_id) {
      insForge.from("commercial_project_types").select("name").eq("id", lead.project_type_id).single()
        .then(({ data }: any) => { if (data) setProjectTypeName(data.name) })
    }
  }, [lead.project_type_id])

  const hasBant = lead.budget_confirmed || lead.authority_confirmed || lead.need_confirmed || lead.timeline_confirmed

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: PIC, Brief, Status, Type, BANT */}
        <div className="lg:col-span-5 space-y-4">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-blue-500" /></div>
              <div className="min-w-0"><p className="text-sm font-semibold text-foreground truncate">{lead.pic_name || "Belum ditugaskan"}</p><p className="text-[0.6rem] text-muted-foreground">PIC Sales</p></div>
            </div>
          </CardContent></Card>
          {lead.notes && <Card><CardContent className="p-4">
            <h4 className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Brief Awal</h4>
            <p className="text-xs text-foreground line-clamp-4">{lead.notes}</p>
          </CardContent></Card>}
          <Card><CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Status Lead</span>
              <Badge className={`${STATUS_STYLES[lead.status] || ""} text-[0.6rem]`}>{lead.status?.replace(/_/g, " ") || "new"}</Badge>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Tipe Proyek</span><span className="text-xs text-foreground text-right">{projectTypeName || "-"}</span></div>
            {lead.lead_number && <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Lead Number</span><code className="text-xs font-mono text-emerald-500">{lead.lead_number}</code></div>}
          </CardContent></Card>
          {hasBant && (
            <Card><CardContent className="p-4 space-y-2">
              <h4 className="text-[0.6rem] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">BANT Detail</h4>
              {[
                { label: "Budget", confirmed: lead.budget_confirmed, detail: lead.budget_value },
                { label: "Authority", confirmed: lead.authority_confirmed, detail: lead.authority_detail },
                { label: "Need", confirmed: lead.need_confirmed, detail: lead.need_detail },
                { label: "Timeline", confirmed: lead.timeline_confirmed, detail: lead.timeline_detail },
              ].map((b) => (
                <div key={b.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {b.confirmed ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Circle className="w-3 h-3 text-muted-foreground/40" />}
                    <span className="text-[0.6rem] text-muted-foreground">{b.label}</span>
                  </div>
                  {b.detail ? <span className="text-[0.55rem] text-foreground/70 text-right max-w-[120px] truncate">{b.detail}</span> : <span className="text-[0.55rem] text-muted-foreground/50">{b.confirmed ? "Ya" : "Tidak"}</span>}
                </div>
              ))}
            </CardContent></Card>
          )}
        </div>

        {/* MIDDLE: Activity Timeline */}
        <div className="lg:col-span-4">
          <Card><CardContent className="p-4">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3"><Activity className="w-3.5 h-3.5 text-emerald-500" /> Timeline Aktivitas</h3>
            <ActivityTimeline leadId={leadId} createdAt={lead.created_at} />
          </CardContent></Card>
        </div>

        {/* RIGHT: Lead Checklist */}
        <div className="lg:col-span-3 space-y-4">
          <LeadProgress lead={lead} hasBrief={hasBrief} hasQuotation={hasQuotation} hasTechnical={hasTechnical} hasCost={hasCost} />
        </div>
      </div>
    </div>
  )
}

// ============================================================
// MOM Tab — Left: List, Right: Inline Editor
// ============================================================
function MOMTab({ leadId }: { leadId: string }) {
  const [items, setItems] = useState<MOM[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [meetingDate, setMeetingDate] = useState("")
  const [participants, setParticipants] = useState("")
  const [notes, setNotes] = useState("")
  const [linkAttachment, setLinkAttachment] = useState("")
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    if (!insForge) return
    const { data } = await insForge.from("lead_mom").select("*").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false })
    if (data) setItems(data); setLoading(false)
  }, [leadId])
  useEffect(() => { fetch() }, [fetch])

  const clearForm = () => {
    setEditId(null)
    setTitle("")
    setMeetingDate("")
    setParticipants("")
    setNotes("")
    setLinkAttachment("")
  }

  const selectItem = (item: MOM) => {
    setEditId(item.id)
    setTitle(item.title)
    setMeetingDate(item.meeting_date?.split("T")[0] || "")
    setParticipants(item.participants || "")
    setNotes(item.notes || "")
    setLinkAttachment((item as any).link_attachment || "")
  }

  const handleSave = async () => {
    if (!title.trim() || !insForge) return; setSaving(true)
    try {
      const p = { tenant_id: getTenantId(), lead_id: leadId, title: title.trim(), meeting_date: meetingDate || null, participants: participants || null, notes: notes || null, link_attachment: linkAttachment || null }
      if (editId) await insForge.from("lead_mom").update(p).eq("id", editId); else await insForge.from("lead_mom").insert(p)
      clearForm(); fetch()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus MOM ini?")) return; if (!insForge) return
    await insForge.from("lead_mom").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (editId === id) clearForm()
    fetch()
  }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>

  const formDirty = title || meetingDate || participants || notes || linkAttachment

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: MOM List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{items.length} MOM</p>
          <Button size="sm" variant="outline" onClick={clearForm} className="border-border h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Tambah Baru
          </Button>
        </div>
        {items.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada MOM. Buat MOM baru di panel sebelah kanan.</CardContent></Card>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {items.map((item) => {
              const isSelected = editId === item.id
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:border-emerald-500/30 ${isSelected ? "ring-2 ring-emerald-500/50 border-emerald-500/50" : ""}`}
                  onClick={() => selectItem(item)}
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground text-sm truncate">{item.title}</h4>
                          {item.meeting_date && (
                            <Badge variant="outline" className="text-[0.55rem] border-border text-muted-foreground shrink-0 px-1.5 py-0">
                              <Calendar className="w-2.5 h-2.5 mr-0.5" />
                              {new Date(item.meeting_date).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                            </Badge>
                          )}
                        </div>
                        {item.participants && <p className="text-[0.65rem] text-muted-foreground truncate flex items-center gap-1"><Users className="w-2.5 h-2.5 shrink-0" />{item.participants}</p>}
                        {(item as any).link_attachment && <p className="text-[0.6rem] text-blue-400 truncate flex items-center gap-1"><LinkIcon className="w-2.5 h-2.5 shrink-0" />{(item as any).link_attachment}</p>}
                        {item.notes && <p className="text-[0.6rem] text-muted-foreground line-clamp-1" dangerouslySetInnerHTML={{ __html: item.notes.replace(/<[^>]*>/g, "").substring(0, 80) }} />}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                        className="p-1 rounded shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Editor Form */}
      <div>
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
              {editId ? "Edit MOM" : "MOM Baru"}
            </h3>

            <div className="space-y-3">
              {/* Title */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Judul <span className="text-red-500">*</span></Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Topik meeting" className="bg-background border-border text-sm h-9" />
              </div>

              {/* Meeting Date + Participants */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tanggal Meeting</Label>
                  <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="bg-background border-border text-sm h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Peserta</Label>
                  <Input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Nama, pisahkan koma" className="bg-background border-border text-sm h-9" />
                </div>
              </div>

              {/* Link Attachment */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-emerald-500" /> Link Attachment
                </Label>
                <Input value={linkAttachment} onChange={(e) => setLinkAttachment(e.target.value)} placeholder="Zoom link, Google Docs, Notion, dll..." className="bg-background border-border text-sm h-9" />
                <p className="text-[0.55rem] text-muted-foreground">Tempelkan link rekaman Zoom, catatan meeting eksternal, atau referensi lainnya</p>
              </div>

              {/* WYSIWYG Notes */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Catatan / Hasil Meeting</Label>
                <RichTextEditor value={notes} onChange={setNotes} placeholder="Tulis notulen meeting di sini..." />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {formDirty && (
                  <Button variant="ghost" onClick={clearForm} className="text-xs h-9" disabled={saving}>
                    Batal
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!title.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9 gap-1">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {editId ? "Simpan" : "Tambah"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// Project Brief Tab
// ============================================================
function ProjectBriefTab({ leadId, onStatusChange }: { leadId: string; onStatusChange?: (has: boolean) => void }) {
  const [brief, setBrief] = useState<ProjectBrief | null>(null); const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState(""); const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false); const [editing, setEditing] = useState(false)

  const fetch = useCallback(async () => {
    if (!insForge) return
    const { data } = await insForge.from("lead_project_briefs").select("*").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1)
    if (data && data.length > 0) { setBrief(data[0]); setDescription(data[0].description || "") }
    setLoading(false)
  }, [leadId])
  useEffect(() => { fetch() }, [fetch])

  useEffect(() => { onStatusChange?.(!!brief) }, [brief, onStatusChange])

  const handleSave = async () => {
    if (!insForge) return; setUploading(true)
    try {
      let fileUrl = brief?.file_url || null, fileName = brief?.file_name || null, fileSize = brief?.file_size || null
      if (file) {
        const { data: up } = await insForge.storage.from("lead-documents").upload(`project-briefs/${leadId}/${file.name}`, file)
        if (up) { fileUrl = up.url; fileName = file.name; fileSize = file.size }
      }
      const p = { tenant_id: getTenantId(), lead_id: leadId, description: description || null, file_name: fileName, file_url: fileUrl, file_size: fileSize }
      if (brief?.id) await insForge.from("lead_project_briefs").update(p).eq("id", brief.id); else await insForge.from("lead_project_briefs").insert(p)
      setEditing(false); setFile(null); fetch()
    } catch (err) { console.error(err) } finally { setUploading(false) }
  }
  const handleDelete = async () => {
    if (!brief?.id || !confirm("Hapus project brief ini?")) return; if (!insForge) return
    await insForge.from("lead_project_briefs").update({ deleted_at: new Date().toISOString() }).eq("id", brief.id)
    setBrief(null); setDescription(""); setEditing(false)
  }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>
  if (!editing && !brief) return (
    <Card><CardContent className="p-8 text-center"><FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground mb-3">Belum ada Project Brief</p><Button size="sm" onClick={() => setEditing(true)} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Buat Project Brief</Button></CardContent></Card>
  )

  if (!editing && brief) return (
    <div className="space-y-3">
      {brief.description && <Card><CardContent className="p-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Deskripsi</h4><p className="text-sm text-foreground whitespace-pre-wrap">{brief.description}</p></CardContent></Card>}
      {brief.file_url && <Card><CardContent className="p-4"><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">File Deck</h4>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"><FileText className="w-8 h-8 text-emerald-500 shrink-0" />
          <div className="flex-1 min-w-0"><p className="text-sm text-foreground truncate">{brief.file_name || "File"}</p><p className="text-xs text-muted-foreground">{brief.file_size ? `${(brief.file_size / 1024).toFixed(1)} KB` : ""}</p></div>
          <a href={brief.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"><ExternalLink className="w-4 h-4" /></a>
        </div></CardContent></Card>}
      <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(true)} className="border-border h-8 text-xs gap-1.5"><Edit3 className="w-3.5 h-3.5" /> Edit</Button><Button size="sm" variant="outline" onClick={handleDelete} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 text-xs gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Hapus</Button></div>
    </div>
  )

  return (
    <Card><CardContent className="p-4 space-y-4">
      <h4 className="text-sm font-medium text-foreground">{brief ? "Edit" : "Buat"} Project Brief</h4>
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">Deskripsi</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Deskripsi project..." className="bg-background border-border text-sm" /></div>
      <div className="space-y-2"><Label className="text-xs text-muted-foreground">File Deck (PDF, PPT, DOC)</Label><Input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-background border-border text-sm" />{file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}</div>
      <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => { setEditing(false); setFile(null) }} className="text-xs h-9" disabled={uploading}>Batal</Button><Button onClick={handleSave} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9">{uploading ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Upload...</> : "Simpan"}</Button></div>
    </CardContent></Card>
  )
}

// ============================================================
// Quotation Tab
// ============================================================
function QuotationTab({ leadId, onStatusChange }: { leadId: string; onStatusChange?: (has: boolean) => void }) {
  const [items, setItems] = useState<Quotation[]>([]); const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ quotation_number: "", title: "", amount: "", status: "draft", notes: "", valid_until: "" }); const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    if (!insForge) return
    const { data } = await insForge.from("lead_quotations").select("*").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false })
    if (data) setItems(data); setLoading(false)
  }, [leadId])
  useEffect(() => { fetch() }, [fetch])

  useEffect(() => { onStatusChange?.(items.length > 0) }, [items, onStatusChange])

  const genNum = async () => {
    if (!insForge) return `Q-${Date.now().toString().slice(-6)}`
    const { data } = await insForge.from("lead_quotations").select("quotation_number").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(1)
    if (data && data.length > 0) { const n = parseInt(data[0].quotation_number.replace(/[^0-9]/g, "")) || 0; return `Q-${String(n + 1).padStart(4, "0")}` }
    return "Q-0001"
  }
  const openAdd = async () => { setEditId(null); setForm({ quotation_number: await genNum(), title: "", amount: "", status: "draft", notes: "", valid_until: "" }); setDialogOpen(true) }
  const openEdit = (item: Quotation) => { setEditId(item.id); setForm({ quotation_number: item.quotation_number, title: item.title, amount: String(item.amount || 0), status: item.status, notes: item.notes || "", valid_until: item.valid_until?.split("T")[0] || "" }); setDialogOpen(true) }

  const handleSave = async () => {
    if (!form.title.trim() || !form.quotation_number.trim() || !insForge) return; setSaving(true)
    try {
      const p = { tenant_id: getTenantId(), lead_id: leadId, quotation_number: form.quotation_number.trim(), title: form.title.trim(), amount: parseFloat(form.amount) || 0, status: form.status, notes: form.notes || null, valid_until: form.valid_until || null }
      if (editId) await insForge.from("lead_quotations").update(p).eq("id", editId); else await insForge.from("lead_quotations").insert(p)
      setDialogOpen(false); fetch()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }
  const handleDelete = async (id: string) => { if (!confirm("Hapus quotation ini?")) return; if (!insForge) return; await insForge.from("lead_quotations").update({ deleted_at: new Date().toISOString() }).eq("id", id); fetch() }

  const QSTATUS: Record<string, string> = { draft: "bg-zinc-500/10 text-zinc-400", sent: "bg-blue-500/10 text-blue-400", approved: "bg-emerald-500/10 text-emerald-400", rejected: "bg-red-500/10 text-red-400", revised: "bg-amber-500/10 text-amber-400" }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{items.length} Quotation</p><Button size="sm" onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Tambah Quotation</Button></div>
      {items.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada Quotation.</CardContent></Card> : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">{item.quotation_number}</code>
                    <h4 className="font-medium text-foreground text-sm truncate">{item.title}</h4>
                    <Badge className={`${QSTATUS[item.status] || "bg-zinc-500/10 text-zinc-400"} text-[0.6rem]`}>{item.status}</Badge>
                  </div>
                  <p className="text-base font-semibold text-emerald-400">{fmtCurrency(item.amount)}</p>
                  {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  {item.valid_until && <p className="text-xs text-muted-foreground">Valid until: {new Date(item.valid_until).toLocaleDateString("id-ID")}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0"><button onClick={() => openEdit(item)} className="p-1.5 rounded text-muted-foreground hover:text-amber-500"><Edit3 className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(item.id)} className="p-1.5 rounded text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <QuotationDialog {...{ dialogOpen, setDialogOpen, editId, form, setForm, saving, handleSave }} />
    </div>
  )
}

function QuotationDialog({ dialogOpen, setDialogOpen, editId, form, setForm, saving, handleSave }: any) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editId ? "Edit Quotation" : "Tambah Quotation"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs text-muted-foreground">No. Quotation</Label><Input value={form.quotation_number} onChange={(e) => setForm({ ...form, quotation_number: e.target.value })} className="bg-background border-border text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Status</Label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-foreground"><option value="draft">Draft</option><option value="sent">Sent</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="revised">Revised</option></select></div></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Judul <span className="text-red-500">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul quotation" className="bg-background border-border text-sm" /></div>
          <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Nilai (Rp)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-background border-border text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Valid Until</Label><Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="bg-background border-border text-sm" /></div></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Catatan</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="bg-background border-border text-sm" /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-xs h-9">Batal</Button><Button onClick={handleSave} disabled={!form.title.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9">{saving ? "Menyimpan..." : editId ? "Simpan" : "Tambah"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Technical Analysis Tab
// ============================================================
function TechnicalAnalysisTab({ leadId, onStatusChange }: { leadId: string; onStatusChange?: (has: boolean) => void }) {
  const { user } = useAuth()
  const [items, setItems] = useState<TechnicalAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [linkAttachment, setLinkAttachment] = useState("")
  const [saving, setSaving] = useState(false)
  const [userMap, setUserMap] = useState<Record<string, string>>({})

  const fetch = useCallback(async () => {
    if (!insForge) return
    const { data } = await insForge.from("lead_technical_analyses").select("*").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false })
    if (data) setItems(data); setLoading(false)

    // Build user name map from created_by
    const uids = [...new Set((data || []).map((i: any) => i.created_by).filter(Boolean))]
    if (uids.length > 0) {
      const { data: profiles } = await insForge.from("user_profiles").select("user_id, full_name").in("user_id", uids)
      if (profiles) {
        const map: Record<string, string> = {}
        for (const p of profiles) map[p.user_id] = p.full_name
        setUserMap(map)
      }
    }
  }, [leadId])
  useEffect(() => { fetch() }, [fetch])

  useEffect(() => { onStatusChange?.(items.length > 0) }, [items, onStatusChange])

  const clearForm = () => {
    setEditId(null); setTitle(""); setContent(""); setLinkAttachment("")
  }

  const selectItem = (item: TechnicalAnalysis) => {
    setEditId(item.id); setTitle(item.title || ""); setContent(item.content || ""); setLinkAttachment(item.link_attachment || "")
  }

  const handleSave = async () => {
    if (!title.trim() || !insForge) return; setSaving(true)
    try {
      const p: any = { tenant_id: getTenantId(), lead_id: leadId, title: title.trim(), content: content || null, link_attachment: linkAttachment || null }
      if (!editId) p.created_by = user?.id || null
      if (editId) await insForge.from("lead_technical_analyses").update(p).eq("id", editId)
      else await insForge.from("lead_technical_analyses").insert(p)
      clearForm(); fetch()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus analisis teknis ini?")) return; if (!insForge) return
    await insForge.from("lead_technical_analyses").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (editId === id) clearForm()
    fetch()
  }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>

  const formDirty = title || content || linkAttachment

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Tech Analysis List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{items.length} Analisis</p>
          <Button size="sm" variant="outline" onClick={clearForm} className="border-border h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Tambah Baru
          </Button>
        </div>
        {items.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada analisis teknis. Buat analisis baru di panel sebelah kanan.</CardContent></Card>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {items.map((item) => {
              const isSelected = editId === item.id
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:border-emerald-500/30 ${isSelected ? "ring-2 ring-emerald-500/50 border-emerald-500/50" : ""}`}
                  onClick={() => selectItem(item)}
                >
                  <CardContent className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-medium text-foreground text-sm truncate">{item.title || "Tanpa Judul"}</h4>
                        {item.content && (
                          <p className="text-[0.6rem] text-muted-foreground line-clamp-1" dangerouslySetInnerHTML={{ __html: item.content.replace(/<[^>]*>/g, "").substring(0, 80) }} />
                        )}
                        {item.link_attachment && <p className="text-[0.6rem] text-blue-400 truncate flex items-center gap-1"><LinkIcon className="w-2.5 h-2.5 shrink-0" />{item.link_attachment}</p>}
                        <div className="flex items-center gap-2 text-[0.55rem] text-muted-foreground">
                          {item.created_by && userMap[item.created_by] && (
                            <span className="flex items-center gap-1">
                              <User className="w-2.5 h-2.5" /> {userMap[item.created_by]}
                            </span>
                          )}
                          <span>{new Date(item.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" })}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                        className="p-1 rounded shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Editor Form */}
      <div>
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
              {editId ? "Edit Analisis Teknis" : "Analisis Teknis Baru"}
            </h3>

            <div className="space-y-3">
              {/* Title */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Judul <span className="text-red-500">*</span></Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul analisis teknis" className="bg-background border-border text-sm h-9" />
              </div>

              {/* Submitted by (auto) */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-500" /> Submitted by
                </Label>
                <div className="text-sm text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2.5">
                  {user?.email || user?.id || "—"}
                </div>
                <p className="text-[0.55rem] text-muted-foreground">Terisi otomatis berdasarkan user yang login</p>
              </div>

              {/* Link Attachment */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-emerald-500" /> Link Attachment
                </Label>
                <Input value={linkAttachment} onChange={(e) => setLinkAttachment(e.target.value)} placeholder="Link referensi, dokumentasi, dll..." className="bg-background border-border text-sm h-9" />
                <p className="text-[0.55rem] text-muted-foreground">Tempelkan link referensi teknis, dokumentasi, atau sumber lainnya</p>
              </div>

              {/* Description (WYSIWYG) */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                <RichTextEditor value={content} onChange={setContent} placeholder="Tulis analisis teknis di sini..." />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {formDirty && (
                  <Button variant="ghost" onClick={clearForm} className="text-xs h-9" disabled={saving}>
                    Batal
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!title.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9 gap-1">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {editId ? "Simpan" : "Tambah"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// Cost Analysis Tab
// ============================================================
function CostAnalysisTab({ leadId, onStatusChange }: { leadId: string; onStatusChange?: (has: boolean) => void }) {
  useEffect(() => { onStatusChange?.(false) }, [onStatusChange])
  return (
    <Card><CardContent className="p-8 text-center space-y-4">
      <Calculator className="w-12 h-12 text-emerald-500 mx-auto" />
      <div><h3 className="text-lg font-semibold text-foreground">Cost Analysis</h3><p className="text-sm text-muted-foreground mt-1">Hitung HPP, margin, dan pricing menggunakan Commercial Calculator</p></div>
      <Link href="/commercial" target="_blank"><Button className="bg-emerald-600 hover:bg-emerald-700 gap-2"><Calculator className="w-4 h-4" /> Buka Commercial Calculator <ExternalLink className="w-3.5 h-3.5" /></Button></Link>
    </CardContent></Card>
  )
}

// ============================================================
// Summary Quotation Tab
// ============================================================
function SummaryQuotationTab({ leadId }: { leadId: string }) {
  const [summary, setSummary] = useState<QuotationSummary | null>(null); const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true); const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    if (!insForge) return
    const { data: q } = await insForge.from("lead_quotations").select("*").eq("lead_id", leadId).is("deleted_at", null)
    if (q) setQuotations(q)
    const { data: s } = await insForge.from("lead_quotation_summaries").select("*").eq("lead_id", leadId).is("deleted_at", null).limit(1)
    if (s && s.length > 0) { setSummary(s[0]); setNotes(s[0].notes || "") }; setLoading(false)
  }, [leadId])
  useEffect(() => { fetch() }, [fetch])

  const total = quotations.reduce((s, q) => s + (q.amount || 0), 0)
  const approved = quotations.filter(q => q.status === "approved").reduce((s, q) => s + (q.amount || 0), 0)

  const handleSave = async () => {
    if (!insForge) return; setSaving(true)
    try {
      const p = { tenant_id: getTenantId(), lead_id: leadId, total_amount: total, notes: notes || null }
      if (summary?.id) await insForge.from("lead_quotation_summaries").update(p).eq("id", summary.id); else await insForge.from("lead_quotation_summaries").insert(p)
      fetch()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Total Quotations</p><p className="text-2xl font-bold text-foreground mt-1">{quotations.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Total Nilai</p><p className="text-2xl font-bold text-emerald-400 mt-1">{fmtCurrency(total)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Approved</p><p className="text-2xl font-bold text-blue-400 mt-1">{fmtCurrency(approved)}</p></CardContent></Card>
      </div>
      <Card><CardContent className="p-4 space-y-4">
        <h4 className="text-sm font-medium text-foreground">Catatan Summary</h4>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Catatan ringkasan quotation..." className="bg-background border-border text-sm" />
        <div className="flex justify-end"><Button size="sm" onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">{saving ? "Menyimpan..." : "Simpan Summary"}</Button></div>
      </CardContent></Card>
    </div>
  )
}

// ============================================================
// Edit Lead Dialog (exported for use in client.tsx)
// ============================================================
export function EditLeadDialog({ leadId, lead, open, onOpenChange }: {
  leadId: string; lead: any; open: boolean; onOpenChange: (v: boolean) => void
}) {
  const [projectTypes, setProjectTypes] = useState<{ id: string; name: string }[]>([])
  const [userProfiles, setUserProfiles] = useState<{ id: string; full_name: string }[]>([])
  const [leadStatuses, setLeadStatuses] = useState<{ name: string; color: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingClients, setExistingClients] = useState<string[]>([])
  const [existingCompanies, setExistingCompanies] = useState<string[]>([])
  const [showNewClient, setShowNewClient] = useState(false)
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [editForm, setEditForm] = useState({
    contact_name: "", company_name: "", contact_email: "", contact_phone: "", contact_position: "",
    lead_source: "website", estimated_value: "", priority: "medium", status: "new",
    notes: "", project_type_id: "", pic_sales_id: "",
    budget_confirmed: false, authority_confirmed: false, need_confirmed: false, timeline_confirmed: false,
    budget_value: "", authority_detail: "", need_detail: "", timeline_detail: "",
  })

  useEffect(() => {
    if (!insForge) return
    insForge.from("commercial_project_types").select("id,name").eq("is_active", true).order("name")
      .then(({ data }: any) => { if (data) setProjectTypes(data) })
    insForge.from("user_profiles").select("id,full_name").order("full_name")
      .then(({ data }: any) => { if (data) setUserProfiles(data) })
    insForge.from("commercial_lead_status").select("name,color").eq("is_active", true).order("sort_order")
      .then(({ data }: any) => { if (data) setLeadStatuses(data) })
    const fetchExisting = async () => {
      if (!insForge) return
      const names = new Set<string>()
      const { data: leads } = await insForge.from("crm_leads").select("contact_name").not("contact_name", "is", null)
      leads?.forEach((l: any) => { if (l.contact_name) names.add(l.contact_name) })
      setExistingClients(Array.from(names).sort())
      const cnames = new Set<string>()
      const { data: companyLeads } = await insForge.from("crm_leads").select("company_name").not("company_name", "is", null)
      companyLeads?.forEach((l: any) => { if (l.company_name) cnames.add(l.company_name) })
      setExistingCompanies(Array.from(cnames).sort())
    }
    fetchExisting()
  }, [])

  // Sync form with lead when dialog opens
  useEffect(() => {
    if (open && lead) {
      setEditForm({
        contact_name: lead.contact_name || "",
        company_name: lead.company_name || "",
        contact_email: lead.contact_email || "",
        contact_phone: lead.contact_phone || "",
        contact_position: lead.contact_position || "",
        lead_source: lead.lead_source || "website",
        estimated_value: lead.estimated_value ? String(lead.estimated_value) : "",
        priority: lead.priority || "medium",
        status: lead.status || "new",
        notes: lead.notes || "",
        project_type_id: lead.project_type_id || "",
        pic_sales_id: lead.pic_sales_id || "",
        budget_confirmed: lead.budget_confirmed ?? false,
        authority_confirmed: lead.authority_confirmed ?? false,
        need_confirmed: lead.need_confirmed ?? false,
        timeline_confirmed: lead.timeline_confirmed ?? false,
        budget_value: lead.budget_value || "",
        authority_detail: lead.authority_detail || "",
        need_detail: lead.need_detail || "",
        timeline_detail: lead.timeline_detail || "",
      })
      setShowNewClient(false)
      setShowNewCompany(false)
      setError(null)
    }
  }, [open, lead])

  const handleSave = async () => {
    if (!insForge) return
    setSaving(true)
    setError(null)
    try {
      await insForge.from("crm_leads").update({
        contact_name: editForm.contact_name,
        company_name: editForm.company_name || null,
        contact_email: editForm.contact_email || null,
        contact_phone: editForm.contact_phone || null,
        contact_position: editForm.contact_position || null,
        lead_source: editForm.lead_source,
        estimated_value: editForm.estimated_value ? parseFloat(editForm.estimated_value) : null,
        priority: editForm.priority,
        status: editForm.status,
        notes: editForm.notes || null,
        project_type_id: editForm.project_type_id || null,
        pic_sales_id: editForm.pic_sales_id || null,
        budget_confirmed: editForm.budget_confirmed,
        authority_confirmed: editForm.authority_confirmed,
        need_confirmed: editForm.need_confirmed,
        timeline_confirmed: editForm.timeline_confirmed,
        budget_value: editForm.budget_value || null,
        authority_detail: editForm.authority_detail || null,
        need_detail: editForm.need_detail || null,
        timeline_detail: editForm.timeline_detail || null,
      }).eq("id", leadId)
      onOpenChange(false)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Edit3 className="w-4 h-4 text-emerald-500" /> Ubah Data Lead
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
          {/* Nama Klien */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-500" /> Nama Klien <span className="text-red-400">*</span>
            </Label>
            {!showNewClient ? (
              <Select
                value={editForm.contact_name}
                onValueChange={(value) => {
                  if (value === "__new__") {
                    setShowNewClient(true)
                    setEditForm({...editForm, contact_name: ""})
                  } else {
                    setEditForm({...editForm, contact_name: value})
                  }
                }}
              >
                <SelectTrigger className="bg-background border-border text-foreground text-sm h-9">
                  <SelectValue placeholder="Pilih klien atau buat baru..." />
                </SelectTrigger>
                <SelectContent>
                  {existingClients.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-emerald-600 font-medium border-t border-border mt-1">
                    + Tambah Klien Baru
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2 items-center">
                <Input
                  value={editForm.contact_name}
                  onChange={(e) => setEditForm({...editForm, contact_name: e.target.value})}
                  placeholder="Nama klien baru"
                  autoFocus
                  className="flex-1 bg-background border-border text-sm h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => { setShowNewClient(false); setEditForm({...editForm, contact_name: ""}) }}
                  className="text-muted-foreground shrink-0 h-9 w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          {/* Nama Perusahaan */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-500" /> Nama Perusahaan
            </Label>
            {!showNewCompany ? (
              <Select
                value={editForm.company_name}
                onValueChange={(value) => {
                  if (value === "__new__") {
                    setShowNewCompany(true)
                    setEditForm({...editForm, company_name: ""})
                  } else {
                    setEditForm({...editForm, company_name: value})
                  }
                }}
              >
                <SelectTrigger className="bg-background border-border text-foreground text-sm h-9">
                  <SelectValue placeholder="Pilih atau ketik baru..." />
                </SelectTrigger>
                <SelectContent>
                  {existingCompanies.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-emerald-600 font-medium border-t border-border mt-1">
                    + Tambah Perusahaan Baru
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2 items-center">
                <Input
                  value={editForm.company_name}
                  onChange={(e) => setEditForm({...editForm, company_name: e.target.value})}
                  placeholder="Nama perusahaan baru"
                  autoFocus
                  className="flex-1 bg-background border-border text-sm h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => { setShowNewCompany(false); setEditForm({...editForm, company_name: ""}) }}
                  className="text-muted-foreground shrink-0 h-9 w-9"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3 text-emerald-500" /> Email PIC Perusahaan</Label><Input type="email" value={editForm.contact_email} onChange={(e) => setEditForm({...editForm, contact_email: e.target.value})} className="bg-background border-border text-sm h-9" /></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> Telepon</Label><Input value={editForm.contact_phone} onChange={(e) => setEditForm({...editForm, contact_phone: e.target.value})} className="bg-background border-border text-sm h-9" /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Jabatan</Label><Input value={editForm.contact_position} onChange={(e) => setEditForm({...editForm, contact_position: e.target.value})} className="bg-background border-border text-sm h-9" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sumber Lead</Label>
              <Select value={editForm.lead_source} onValueChange={(v) => setEditForm({...editForm, lead_source: v})}>
                <SelectTrigger className="bg-background border-border text-foreground text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["website","referral","social_media","email","phone","event","walk_in","partner","other"].map((s) => (<SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Prioritas</Label>
              <Select value={editForm.priority} onValueChange={(v) => setEditForm({...editForm, priority: v})}>
                <SelectTrigger className="bg-background border-border text-foreground text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Rendah</SelectItem><SelectItem value="medium">Sedang</SelectItem><SelectItem value="high">Tinggi</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({...editForm, status: v})}>
                <SelectTrigger className="bg-background border-border text-foreground text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {leadStatuses.length > 0
                    ? leadStatuses.map((st) => {
                        const slug = st.name.toLowerCase().replace(/\s+/g, "_")
                        return <SelectItem key={slug} value={slug}>{st.name}</SelectItem>
                      })
                    : ["new","contacted","qualified","proposal","negotiation","closed_won","closed_lost"].map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipe Proyek</Label>
              <Select value={editForm.project_type_id} onValueChange={(v) => setEditForm({...editForm, project_type_id: v})}>
                <SelectTrigger className="bg-background border-border text-foreground text-sm h-9"><SelectValue placeholder="-" /></SelectTrigger>
                <SelectContent>
                  {projectTypes.map((pt) => (<SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Estimasi Nilai (Rp)</Label>
            <Input type="number" value={editForm.estimated_value} onChange={(e) => setEditForm({...editForm, estimated_value: e.target.value})} className="bg-background border-border text-sm h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">PIC Sales</Label>
            <Select value={editForm.pic_sales_id} onValueChange={(v) => setEditForm({...editForm, pic_sales_id: v})}>
              <SelectTrigger className="bg-background border-border text-foreground text-sm h-9"><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                {userProfiles.map((up) => (<SelectItem key={up.id} value={up.id}>{up.full_name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Catatan / Brief Awal</Label>
            <Textarea value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} rows={3} className="bg-background border-border text-sm" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3">BANT Qualification</h4>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">Budget</p>
                    <p className="text-[0.6rem] text-muted-foreground">Klien memiliki budget yang cukup</p>
                  </div>
                  <Switch checked={editForm.budget_confirmed} onCheckedChange={(c) => setEditForm({...editForm, budget_confirmed: c})} />
                </div>
                {editForm.budget_confirmed && (
                  <div className="relative mt-2">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">Rp</span>
                    <input type="text" value={editForm.budget_value} onChange={(e) => setEditForm({...editForm, budget_value: e.target.value})} placeholder="Estimasi nilai proyek..." className="w-full h-8 pl-8 pr-3 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
                  </div>
                )}
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">Authority</p>
                    <p className="text-[0.6rem] text-muted-foreground">Kontak memiliki otoritas pengambilan keputusan</p>
                  </div>
                  <Switch checked={editForm.authority_confirmed} onCheckedChange={(c) => setEditForm({...editForm, authority_confirmed: c})} />
                </div>
                {editForm.authority_confirmed && (
                  <input type="text" value={editForm.authority_detail} onChange={(e) => setEditForm({...editForm, authority_detail: e.target.value})} placeholder="Jabatan / posisi pengambil keputusan..." className="w-full h-8 px-3 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 mt-2" />
                )}
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">Need</p>
                    <p className="text-[0.6rem] text-muted-foreground">Klien memiliki kebutuhan yang jelas</p>
                  </div>
                  <Switch checked={editForm.need_confirmed} onCheckedChange={(c) => setEditForm({...editForm, need_confirmed: c})} />
                </div>
                {editForm.need_confirmed && (
                  <textarea value={editForm.need_detail} onChange={(e) => setEditForm({...editForm, need_detail: e.target.value})} placeholder="Deskripsi kebutuhan klien..." rows={2} className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none mt-2" />
                )}
              </div>
              <div className="p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-xs font-medium text-foreground">Timeline</p>
                    <p className="text-[0.6rem] text-muted-foreground">Ada timeline yang jelas untuk pembelian</p>
                  </div>
                  <Switch checked={editForm.timeline_confirmed} onCheckedChange={(c) => setEditForm({...editForm, timeline_confirmed: c})} />
                </div>
                {editForm.timeline_confirmed && (
                  <input type="text" value={editForm.timeline_detail} onChange={(e) => setEditForm({...editForm, timeline_detail: e.target.value})} placeholder="Estimasi timeline (misal: Q3 2026)..." className="w-full h-8 px-3 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 mt-2" />
                )}
              </div>
            </div>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-xs h-9">Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9 gap-1">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Main Lead Tabs Component
// ============================================================
export default function LeadTabs({ lead, onRefresh }: { lead: any; onRefresh: () => void }) {
  const [picName, setPicName] = useState<string | null>(null)
  const [hasBrief, setHasBrief] = useState(false)
  const [hasQuotation, setHasQuotation] = useState(false)
  const [hasTechnical, setHasTechnical] = useState(false)
  const [hasCost, setHasCost] = useState(false)

  useEffect(() => {
    if (lead?.pic_sales_id) {
      insForge?.from("user_profiles").select("full_name").eq("id", lead.pic_sales_id).single()
        .then(({ data }: any) => { if (data) setPicName(data.full_name) })
    }
  }, [lead?.pic_sales_id])

  const leadWithPic = { ...lead, pic_name: picName }

  return (
    <Tabs defaultValue="info" className="space-y-0">
      <div className="border-b border-border mb-6">
        <TabsList className="bg-transparent border-0 h-auto p-0 gap-0">
          {[
            { id: "info", label: "Info", icon: Target },
            { id: "mom", label: "MOM", icon: Users },
            { id: "technical", label: "Tech Analysis", icon: ClipboardList },
            { id: "cost", label: "Cost Analysis", icon: Calculator },
            { id: "brief", label: "Project Brief", icon: FileText },
            { id: "quotation", label: "Quotation", icon: Receipt },
            { id: "summary", label: "Summary", icon: BarChart3 },
          ].map(({ id, label, icon: Icon }) => (
            <TabsTrigger key={id} value={id} className="data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-500 data-[state=active]:shadow-none rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground transition-all gap-1.5">
              <Icon className="w-3.5 h-3.5" />{label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="info"><InfoTab lead={leadWithPic} leadId={lead.id} hasBrief={hasBrief} hasQuotation={hasQuotation} hasTechnical={hasTechnical} hasCost={hasCost} /></TabsContent>
      <TabsContent value="mom"><MOMTab leadId={lead.id} /></TabsContent>
      <TabsContent value="technical"><TechnicalAnalysisTab leadId={lead.id} onStatusChange={setHasTechnical} /></TabsContent>
      <TabsContent value="cost"><CostAnalysisTab leadId={lead.id} onStatusChange={setHasCost} /></TabsContent>
      <TabsContent value="brief"><ProjectBriefTab leadId={lead.id} onStatusChange={setHasBrief} /></TabsContent>
      <TabsContent value="quotation"><QuotationTab leadId={lead.id} onStatusChange={setHasQuotation} /></TabsContent>
      <TabsContent value="summary"><SummaryQuotationTab leadId={lead.id} /></TabsContent>
    </Tabs>
  )
}
