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
  Clock, Activity, Clock9, Building2, Mail, Phone, Square, Link as LinkIcon, Download
} from "lucide-react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import { useAuth } from "@/hooks/useAuth"
import RichTextEditor from "./rich-text-editor"
import CostAnalysisList, { type CostAnalysisItem } from "./cost-analysis-list"
import { computeScorecard } from "./cost-analysis-scorecard"

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
function LeadProgress({ lead, leadId, hasBrief, hasQuotation, hasTechnical, hasCost }: {
  lead: any; leadId: string; hasBrief: boolean; hasQuotation: boolean; hasTechnical: boolean; hasCost: boolean
}) {
  const [submittedBy, setSubmittedBy] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchSubmittedBy = async () => {
      if (!insForge) return
      const map: Record<string, string> = {}

      // Collect user IDs to resolve
      const userIds: string[] = []

      // Lead-level fields
      if (lead.created_by) userIds.push(lead.created_by)
      if (lead.pic_sales_id && lead.pic_sales_id !== lead.created_by) userIds.push(lead.pic_sales_id)

      // Query related records in parallel
      const [briefRes, quotationRes, techRes] = await Promise.all([
        insForge.from("lead_project_briefs").select("created_by").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1),
        insForge.from("lead_quotations").select("created_by").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1),
        insForge.from("lead_technical_analyses").select("created_by").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false }).limit(1),
      ])

      const briefCreatedBy = briefRes.data?.[0]?.created_by
      const quotationCreatedBy = quotationRes.data?.[0]?.created_by
      const techCreatedBy = techRes.data?.[0]?.created_by

      if (briefCreatedBy) userIds.push(briefCreatedBy)
      if (quotationCreatedBy) userIds.push(quotationCreatedBy)
      if (techCreatedBy) userIds.push(techCreatedBy)

      // Resolve all user IDs to names
      const uniqueIds = [...new Set(userIds.filter(Boolean))]
      if (uniqueIds.length > 0) {
        const { data: profiles } = await insForge.from("user_profiles").select("user_id, full_name").in("user_id", uniqueIds)
        const profileMap: Record<string, string> = {}
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.user_id] = p.full_name
          }
        }

        // Map each item to submitted by name
        map.contact = profileMap[lead.created_by] || ""
        map.company = profileMap[lead.created_by] || ""
        map.bant = profileMap[lead.created_by] || ""
        map.pic = lead.pic_sales_id ? (profileMap[lead.pic_sales_id] || "") : ""
        map.brief = briefCreatedBy ? (profileMap[briefCreatedBy] || "") : ""
        map.quotation = quotationCreatedBy ? (profileMap[quotationCreatedBy] || "") : ""
        map.technical = techCreatedBy ? (profileMap[techCreatedBy] || "") : ""
        // Cost analysis is localStorage-only for now — no created_by
      }

      setSubmittedBy(map)
    }

    fetchSubmittedBy()
  }, [lead.id, lead.created_by, lead.pic_sales_id, leadId, hasBrief, hasQuotation, hasTechnical])

  const checks = [
    { key: "contact", label: "Contact Info", done: !!(lead.contact_name && (lead.contact_email || lead.contact_phone)) },
    { key: "company", label: "Company Info", done: !!lead.company_name },
    { key: "bant", label: "BANT", done: [lead.budget_confirmed, lead.authority_confirmed, lead.need_confirmed, lead.timeline_confirmed].filter(Boolean).length >= 2 },
    { key: "pic", label: "PIC Assigned", done: !!lead.pic_sales_id },
    { key: "brief", label: "Project Brief", done: hasBrief },
    { key: "quotation", label: "Quotation", done: hasQuotation },
    { key: "technical", label: "Tech Analysis", done: hasTechnical },
    { key: "cost", label: "Cost Analysis", done: hasCost },
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
        <div className="space-y-3">
          {checks.map((c) => {
            const submitter = submittedBy[c.key]
            return (
              <div key={c.key}>
                <div className={`flex items-center gap-1.5 text-xs ${c.done ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {c.done ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 shrink-0" />}
                  <span className="font-medium">{c.label}</span>
                </div>
                {c.done && submitter ? (
                  <p className="text-[0.55rem] text-muted-foreground/60 ml-5 mt-0.5">Submitted by: {submitter}</p>
                ) : (
                  <p className="text-[0.55rem] text-muted-foreground/30 ml-5 mt-0.5">Submitted by: —</p>
                )}
              </div>
            )
          })}
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
// Default checklist template — auto-created on every new project
// ============================================================
const DEFAULT_CHECKLIST = [
  { category: "credentials", item_name: "NDA (Non-Disclosure Agreement)", sort_order: 1 },
  { category: "credentials", item_name: "Quotation",                       sort_order: 2 },
  { category: "credentials", item_name: "Summary Quotation",               sort_order: 3 },
  { category: "credentials", item_name: "MOU / PKS",                       sort_order: 4 },
  { category: "credentials", item_name: "First Payment",                   sort_order: 5 },
  { category: "development", item_name: "User Requirement",                sort_order: 6 },
  { category: "development", item_name: "BRD, FSD, TSD",                   sort_order: 7 },
  { category: "development", item_name: "Asset Repository",                sort_order: 8 },
  { category: "development", item_name: "Minute of Meeting",               sort_order: 9 },
  { category: "development", item_name: "Weekly Report",                   sort_order: 10 },
  { category: "development", item_name: "UAT / SIT",                       sort_order: 11 },
  { category: "development", item_name: "BAST",                            sort_order: 12 },
  { category: "handover",    item_name: "Manual Book",                     sort_order: 13 },
  { category: "handover",    item_name: "Code Documentation",              sort_order: 14 },
  { category: "handover",    item_name: "Repository",                      sort_order: 15 },
  { category: "handover",    item_name: "API Docs",                        sort_order: 16 },
]

interface PaymentTerm {
  term_name: string
  percentage: number
  nominal: number
  due_date: string
}

// ============================================================
// Convert to Commercial Project Dialog (New Flow — 4 Steps)
// ============================================================
export function ConvertToCommercialProjectDialog({ lead, open, onOpenChange }: { lead: any; open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // ── Step 1: Project Info ──────────────────────────────────
  const [projectName, setProjectName]   = useState("")
  const [companyName, setCompanyName]   = useState("")
  const [clientName, setClientName]     = useState("")
  const [projectCode, setProjectCode]   = useState("")
  const [projectUrl, setProjectUrl]     = useState("")
  const [poValue, setPoValue]           = useState(0)
  const [poValueSource, setPoValueSource] = useState<string>("")

  // Cost analysis auto-populate
  const [caActualDeal, setCaActualDeal]         = useState<number | null>(null)
  const [caGrandTotal, setCaGrandTotal]         = useState<number | null>(null)
  const [caQuotationPublish, setCaQuotationPublish] = useState<number | null>(null)
  const [caTotalHpp, setCaTotalHpp]             = useState<number | null>(null)
  const [caTotalPublish, setCaTotalPublish]     = useState<number | null>(null)
  const [caMarginPct, setCaMarginPct]           = useState<number | null>(null)

  // ── Step 2: Tim & Jadwal ─────────────────────────────────
  const [picCommercialId, setPicCommercialId] = useState("")
  const [picAdmId, setPicAdmId]               = useState("")
  const [pmId, setPmId]                       = useState("")
  const [kickoffDate, setKickoffDate]         = useState("")
  const [startDevDate, setStartDevDate]       = useState("")
  const [endDate, setEndDate]                 = useState("")
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState("")

  // ── Step 3: Payment Terms ────────────────────────────────
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])
  const [termOfPayment, setTermOfPayment] = useState("")

  // ── Snapshots ───────────────────────────────────────────
  const [includeMom, setIncludeMom]               = useState(true)
  const [includeCostAnalysis, setIncludeCostAnalysis] = useState(true)
  const [includeSummary, setIncludeSummary]       = useState(true)
  const [includeBant, setIncludeBant]             = useState(true)
  const [momCount, setMomCount]                   = useState(0)
  const [caCount, setCaCount]                     = useState(0)

  const [users, setUsers]       = useState<any[]>([])
  const [converting, setConverting] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)

  const bantItems = [
    { key: "budget_confirmed",    label: "Budget",    done: lead?.budget_confirmed },
    { key: "authority_confirmed", label: "Authority", done: lead?.authority_confirmed },
    { key: "need_confirmed",      label: "Need",      done: lead?.need_confirmed },
    { key: "timeline_confirmed",  label: "Timeline",  done: lead?.timeline_confirmed },
  ]
  const bantScore = lead?.bant_score ?? 0

  // ── Init on open ─────────────────────────────────────────
  useEffect(() => {
    if (!lead || !open) return
    setStep(1)
    setConvertError(null)
    setProjectName(lead.title || `Project: ${lead.contact_name || ""}`)
    setCompanyName(lead.company_name || "")
    setClientName(lead.contact_name || "")
    setEndDate(lead.expected_close_date || "")

    // Generate project code
    if (insForge) {
      const year = new Date().getFullYear().toString()
      insForge.from("commercial_projects")
        .select("project_code")
        .like("project_code", `CMP-${year}-%`)
        .order("project_code", { ascending: false })
        .limit(1)
        .then((r: any) => {
          let seq = 1
          if (r.data?.[0]) {
            const parts = r.data[0].project_code?.split("-")
            if (parts?.length >= 3) seq = parseInt(parts[2]) + 1
          }
          setProjectCode(`CMP-${year}-${String(seq).padStart(4, "0")}`)
        })

      // MOM count
      insForge.from("lead_mom").select("id", { count: "exact", head: true })
        .eq("lead_id", lead.id).is("deleted_at", null)
        .then((r: any) => { if (typeof r.count === "number") setMomCount(r.count) })

      // Cost analysis auto-populate
      insForge.from("lead_cost_analyses")
        .select("actual_deal,grand_total,quotation_publish,manpower_total_hpp,manpower_total_publish,margin_pct")
        .eq("lead_id", lead.id).is("deleted_at", null)
        .order("created_at", { ascending: false })
        .then((r: any) => {
          const rows = r.data || []
          setCaCount(rows.length)
          if (rows.length === 0) return
          const ca = rows[0]
          const actualDeal       = Number(ca.actual_deal) || 0
          const grandTotal       = Number(ca.grand_total) || 0
          const quotationPublish = Number(ca.quotation_publish) || 0
          setCaActualDeal(actualDeal)
          setCaGrandTotal(grandTotal)
          setCaQuotationPublish(quotationPublish)
          setCaTotalHpp(Number(ca.manpower_total_hpp) || 0)
          setCaTotalPublish(Number(ca.manpower_total_publish) || 0)
          setCaMarginPct(Number(ca.margin_pct) || 0)
          if (actualDeal > 0) { setPoValue(actualDeal); setPoValueSource("actual_deal") }
          else if (grandTotal > 0) { setPoValue(grandTotal); setPoValueSource("grand_total") }
          else if (quotationPublish > 0) { setPoValue(quotationPublish); setPoValueSource("quotation_publish") }
        })
    }
  }, [lead, open])

  // Fetch users
  useEffect(() => {
    if (!insForge) return
    insForge.from("user_profiles").select("id, full_name, employee_number")
      .is("deleted_at", null).order("full_name", { ascending: true })
      .then(({ data }: any) => { if (data) setUsers(data) })
  }, [])

  // Payment terms helper: distribute PO value
  const applyTermTemplate = (template: string) => {
    if (!poValue) return
    const pts: PaymentTerm[] = []
    if (template === "dp30") {
      pts.push({ term_name: "Down Payment (30%)", percentage: 30, nominal: Math.round(poValue * 0.3), due_date: kickoffDate || "" })
      pts.push({ term_name: "Pelunasan (70%)", percentage: 70, nominal: Math.round(poValue * 0.7), due_date: endDate || "" })
    } else if (template === "dp50") {
      pts.push({ term_name: "Down Payment (50%)", percentage: 50, nominal: Math.round(poValue * 0.5), due_date: kickoffDate || "" })
      pts.push({ term_name: "Pelunasan (50%)", percentage: 50, nominal: Math.round(poValue * 0.5), due_date: endDate || "" })
    } else if (template === "full_up") {
      pts.push({ term_name: "Full Payment", percentage: 100, nominal: poValue, due_date: kickoffDate || "" })
    } else if (template === "full_end") {
      pts.push({ term_name: "Full Payment", percentage: 100, nominal: poValue, due_date: endDate || "" })
    } else if (template === "4termin") {
      const each = Math.round(poValue / 4)
      pts.push({ term_name: "Down Payment (25%)", percentage: 25, nominal: each, due_date: "" })
      pts.push({ term_name: "Term 1 (25%)",       percentage: 25, nominal: each, due_date: "" })
      pts.push({ term_name: "Term 2 (25%)",       percentage: 25, nominal: each, due_date: "" })
      pts.push({ term_name: "Pelunasan (25%)",    percentage: 25, nominal: Math.round(poValue - each * 3), due_date: endDate || "" })
    }
    setPaymentTerms(pts)
    setTermOfPayment(template)
  }

  const addTerm = () => setPaymentTerms(prev => [...prev, { term_name: "", percentage: 0, nominal: 0, due_date: "" }])
  const removeTerm = (i: number) => setPaymentTerms(prev => prev.filter((_, idx) => idx !== i))
  const updateTerm = (i: number, field: keyof PaymentTerm, value: string | number) => {
    setPaymentTerms(prev => prev.map((t, idx) => {
      if (idx !== i) return t
      const updated = { ...t, [field]: value }
      // If percentage changed and poValue known, auto-calc nominal
      if (field === "percentage" && poValue > 0) {
        updated.nominal = Math.round(poValue * (Number(value) / 100))
      }
      return updated
    }))
  }

  // ── Submit ────────────────────────────────────────────────
  const handleConvert = async () => {
    if (!insForge || !projectName.trim()) return
    setConverting(true)
    setConvertError(null)
    try {
      // Fetch snapshots
      const leadRes = await insForge.from("crm_leads").select("*").eq("id", lead.id).single()
      let momData = null, caData = null, summaryData = null
      if (includeMom)         { const r = await insForge.from("lead_mom").select("*").eq("lead_id", lead.id).is("deleted_at", null); momData = r.data }
      if (includeCostAnalysis){ const r = await insForge.from("lead_cost_analyses").select("*").eq("lead_id", lead.id).is("deleted_at", null); caData = r.data }
      if (includeSummary)     { const r = await insForge.from("lead_quotation_summaries").select("*").eq("lead_id", lead.id).is("deleted_at", null).limit(1); summaryData = r.data?.[0] || null }

      // Insert commercial_projects
      const payload: any = {
        project_code:      projectCode,
        project_name:      projectName.trim(),
        company_name:      companyName || null,
        client_name:       clientName  || null,
        lead_id:           lead.id,
        pic_commercial_id: picCommercialId || null,
        pic_adm_id:        picAdmId        || null,
        pm_id:             pmId            || null,
        po_value:          poValue || 0,
        kickoff_date:      kickoffDate    || null,
        start_dev_date:    startDevDate   || null,
        end_date:          endDate        || null,
        project_url:       projectUrl     || null,
        online_meeting_url: onlineMeetingUrl || null,
        term_of_payment:   termOfPayment  || null,
        status:            "administration",
        health:            "green",
        lead_data_snapshot: includeBant ? (leadRes?.data || null) : null,
        total_hpp:         caTotalHpp    || 0,
        total_publish:     caTotalPublish || 0,
        quotation_publish: caQuotationPublish || 0,
        actual_deal:       caActualDeal  || 0,
        grand_total:       caGrandTotal  || (caActualDeal || caQuotationPublish || 0),
        margin_pct:        caMarginPct   || 0,
      }
      if (includeMom)          payload.mom_snapshot           = momData
      if (includeCostAnalysis) payload.cost_analysis_snapshot = caData
      if (includeSummary)      payload.summary_snapshot       = summaryData

      const { data: project, error } = await insForge.from("commercial_projects").insert(payload).select().single()
      if (error) throw error

      // Post-create: contacts, checklist, payment terms (parallel)
      const postOps: Promise<any>[] = []

      // 1. Auto-create primary contact from lead
      if (lead.contact_name) {
        postOps.push(
          (insForge as any).from("project_contacts").insert({
            project_id: project.id,
            full_name:  lead.contact_name,
            phone:      lead.contact_phone || null,
            email:      lead.contact_email || null,
            role:       "PIC Client",
            is_primary: true,
            sort_order: 0,
          })
        )
      }

      // 2. Auto-create 16 default checklist items
      postOps.push(
        (insForge as any).from("project_checklist_items").insert(
          DEFAULT_CHECKLIST.map(item => ({ project_id: project.id, ...item, status: "pending" }))
        )
      )

      // 3. Insert payment terms if set
      if (paymentTerms.length > 0) {
        postOps.push(
          (insForge as any).from("project_payment_terms").insert(
            paymentTerms.map((t, i) => ({
              project_id: project.id,
              term_name:  t.term_name,
              percentage: t.percentage || null,
              nominal:    t.nominal || 0,
              due_date:   t.due_date || null,
              status:     "pending",
              sort_order: i,
            }))
          )
        )
      }

      await Promise.all(postOps)

      // 4. Update lead status → closed_won
      await insForge.from("crm_leads").update({ status: "closed_won" }).eq("id", lead.id)

      onOpenChange(false)
      if (project?.id) router.push(`/projects/${project.id}`)
    } catch (err: any) {
      console.error("Failed to convert to commercial project:", err)
      setConvertError(err?.message || "Gagal membuat proyek")
    } finally {
      setConverting(false)
    }
  }

  const fmtRp = (n: number) => n > 0 ? `Rp ${n.toLocaleString("id-ID")}` : "—"
  const step1Valid = projectName.trim().length > 0
  const step2Valid = step1Valid && kickoffDate && endDate && picCommercialId && pmId
  const STEPS = ["Info Proyek", "Tim & Jadwal", "Payment Terms", "Konfirmasi"]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5 text-blue-500" />
            Convert Lead ke Commercial Project
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-0 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => { if (i + 1 < step || (i + 1 === 2 && step1Valid) || (i + 1 === 3 && step2Valid)) setStep(i + 1) }}
                  className={`flex items-center gap-1.5 text-[0.6rem] font-medium px-2 py-0.5 rounded transition-colors ${
                    step === i + 1 ? "text-blue-500" : step > i + 1 ? "text-emerald-500" : "text-muted-foreground/50"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[0.5rem] font-bold ${
                    step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>{step > i + 1 ? "✓" : i + 1}</span>
                  {s}
                </button>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-border mx-0.5" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* ═══ STEP 1: Info Proyek ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Lead reference card */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-50/5 p-3 space-y-2">
                <p className="text-[0.55rem] text-blue-500 font-semibold tracking-wider">DARI LEAD</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {lead?.lead_number && <div><span className="text-muted-foreground">No:</span> <span className="font-mono font-medium">{lead.lead_number}</span></div>}
                  <div><span className="text-muted-foreground">BANT:</span> <span className="font-medium">{bantScore}%</span></div>
                  {lead?.title && <div className="col-span-2"><span className="text-muted-foreground">Lead:</span> <span>{lead.title}</span></div>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bantItems.map((item) => (
                    <span key={item.key} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5rem] font-medium border ${
                      item.done ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`}>
                      {item.done ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}{item.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Project code + name */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kode Proyek</Label>
                  <Input value={projectCode} readOnly className="bg-muted text-sm font-mono" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs text-muted-foreground">Nama Proyek <span className="text-red-500">*</span></Label>
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="text-sm" placeholder="Nama proyek..." />
                </div>
              </div>

              {/* Company + Client */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Perusahaan</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nama Klien / PIC</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="text-sm" />
                </div>
              </div>

              {/* PO Value */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Nilai PO (Rp)</Label>
                  {poValueSource && (
                    <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                      ✓ Dari {poValueSource}
                    </span>
                  )}
                </div>
                <Input type="number" min={0} value={poValue || ""} onChange={(e) => { setPoValue(parseInt(e.target.value) || 0); setPoValueSource("") }} placeholder="0" className="text-sm font-mono" />
                {(caActualDeal || caGrandTotal || caQuotationPublish) ? (
                  <div className="flex gap-1.5 flex-wrap mt-1">
                    {caActualDeal ? (
                      <button type="button" onClick={() => { setPoValue(caActualDeal!); setPoValueSource("actual_deal") }}
                        className="text-[0.6rem] px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                        Actual Deal: {fmtRp(caActualDeal)}
                      </button>
                    ) : null}
                    {caGrandTotal && caGrandTotal !== caActualDeal ? (
                      <button type="button" onClick={() => { setPoValue(caGrandTotal!); setPoValueSource("grand_total") }}
                        className="text-[0.6rem] px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        Grand Total: {fmtRp(caGrandTotal)}
                      </button>
                    ) : null}
                    {caQuotationPublish && caQuotationPublish !== caActualDeal ? (
                      <button type="button" onClick={() => { setPoValue(caQuotationPublish!); setPoValueSource("quotation_publish") }}
                        className="text-[0.6rem] px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        Quotation: {fmtRp(caQuotationPublish)}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {/* Project URL */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Project URL (opsional)</Label>
                <Input value={projectUrl} onChange={(e) => setProjectUrl(e.target.value)} placeholder="https://client.wit.id" className="text-sm font-mono" />
              </div>

              {/* Data snapshots */}
              <div className="rounded-lg border border-border p-3">
                <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider mb-2">DATA LEAD YANG DIBAWA (SNAPSHOT)</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { val: includeBant,         set: setIncludeBant,         label: "Lead Checklist (BANT)" },
                    { val: includeMom,           set: setIncludeMom,          label: `MOM${momCount > 0 ? ` (${momCount})` : ""}` },
                    { val: includeCostAnalysis,  set: setIncludeCostAnalysis, label: `Cost Analysis${caCount > 0 ? ` (${caCount})` : ""}` },
                    { val: includeSummary,       set: setIncludeSummary,      label: "Quotation Summary" },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center gap-2 cursor-pointer" onClick={() => item.set(!item.val)}>
                      {item.val ? <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                      <span className="text-xs text-foreground">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 2: Tim & Jadwal ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "PIC Commercial *", val: picCommercialId, set: setPicCommercialId },
                  { label: "PIC Admin",         val: picAdmId,        set: setPicAdmId },
                  { label: "Project Manager *", val: pmId,            set: setPmId },
                ].map(({ label, val, set }) => (
                  <div key={label} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Select value={val} onValueChange={set}>
                      <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name}{u.employee_number ? ` (${u.employee_number})` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kick-off Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={kickoffDate} onChange={(e) => setKickoffDate(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Start Development</Label>
                  <Input type="date" value={startDevDate} onChange={(e) => setStartDevDate(e.target.value)} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">End of Project <span className="text-red-500">*</span></Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Online Meeting URL (Zoom / GMeets)</Label>
                <Input value={onlineMeetingUrl} onChange={(e) => setOnlineMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." className="text-sm font-mono" />
              </div>
            </div>
          )}

          {/* ═══ STEP 3: Payment Terms ═══ */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">PO Value: <span className="font-semibold text-foreground">{fmtRp(poValue)}</span></p>
                <p className="text-[0.6rem] text-muted-foreground mb-3">Pilih template atau atur manual. Nominal akan otomatis dihitung dari PO.</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { id: "dp30",    label: "DP 30%\n+ Pelunasan 70%" },
                    { id: "dp50",    label: "DP 50%\n+ Pelunasan 50%" },
                    { id: "full_up", label: "100%\ndi Awal" },
                    { id: "full_end",label: "100%\ndi Akhir" },
                    { id: "4termin", label: "4 Termin\n(25% each)" },
                  ].map((t) => (
                    <button key={t.id} type="button"
                      onClick={() => applyTermTemplate(t.id)}
                      className={`text-[0.6rem] px-2 py-2 rounded-lg border text-center whitespace-pre-line leading-relaxed transition-colors ${
                        termOfPayment === t.id
                          ? "border-blue-500 bg-blue-500/10 text-blue-500 font-medium"
                          : "border-border hover:border-zinc-400 text-muted-foreground hover:text-foreground"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                  <button type="button" onClick={addTerm}
                    className="text-[0.6rem] px-2 py-2 rounded-lg border border-dashed border-border hover:border-zinc-400 text-muted-foreground hover:text-foreground transition-colors">
                    + Custom
                  </button>
                </div>
              </div>

              {paymentTerms.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1 text-[0.55rem] text-muted-foreground font-medium uppercase tracking-wider px-1">
                    <div className="col-span-4">Nama Termin</div>
                    <div className="col-span-2 text-right">%</div>
                    <div className="col-span-3 text-right">Nominal</div>
                    <div className="col-span-2">Jatuh Tempo</div>
                    <div className="col-span-1" />
                  </div>
                  {paymentTerms.map((t, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1 items-center">
                      <Input value={t.term_name} onChange={(e) => updateTerm(i, "term_name", e.target.value)}
                        className="col-span-4 text-xs h-7 px-2" placeholder="Nama termin..." />
                      <Input type="number" min={0} max={100} value={t.percentage || ""}
                        onChange={(e) => updateTerm(i, "percentage", parseFloat(e.target.value) || 0)}
                        className="col-span-2 text-xs h-7 px-2 text-right" placeholder="%" />
                      <Input type="number" min={0} value={t.nominal || ""}
                        onChange={(e) => updateTerm(i, "nominal", parseInt(e.target.value) || 0)}
                        className="col-span-3 text-xs h-7 px-2 text-right font-mono" />
                      <Input type="date" value={t.due_date}
                        onChange={(e) => updateTerm(i, "due_date", e.target.value)}
                        className="col-span-2 text-xs h-7 px-2" />
                      <button onClick={() => removeTerm(i)} className="col-span-1 flex justify-center text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="text-[0.6rem] text-muted-foreground text-right pt-1 border-t border-border">
                    Total: <span className="font-semibold text-foreground">{fmtRp(paymentTerms.reduce((s, t) => s + (t.nominal || 0), 0))}</span>
                    {" "}/{" "}{fmtRp(poValue)}
                  </div>
                </div>
              )}
              {paymentTerms.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                  Pilih template atau klik "+ Custom" untuk menambah termin
                </p>
              )}
            </div>
          )}

          {/* ═══ STEP 4: Konfirmasi ═══ */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border divide-y divide-border text-xs">
                {[
                  ["Proyek",     projectName],
                  ["Kode",       projectCode],
                  ["Klien",      `${clientName || "—"} · ${companyName || "—"}`],
                  ["Nilai PO",   fmtRp(poValue)],
                  ["Project URL",projectUrl || "—"],
                  ["Kick-off",   kickoffDate || "—"],
                  ["Start Dev",  startDevDate || "—"],
                  ["End",        endDate || "—"],
                  ["Meeting URL",onlineMeetingUrl || "—"],
                  ["PIC Commercial", users.find(u => u.id === picCommercialId)?.full_name || "—"],
                  ["Project Manager",users.find(u => u.id === pmId)?.full_name || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center px-3 py-1.5 gap-3">
                    <span className="text-muted-foreground w-32 shrink-0">{label}</span>
                    <span className="text-foreground font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {paymentTerms.length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider mb-2">PAYMENT TERMS ({paymentTerms.length} termin)</p>
                  {paymentTerms.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="text-foreground">{t.term_name}</span>
                      <span className="font-mono text-muted-foreground">{fmtRp(t.nominal)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
                <p className="font-semibold">Yang akan otomatis dibuat:</p>
                <ul className="space-y-0.5 text-[0.65rem]">
                  {lead?.contact_name && <li>✓ Kontak klien: {lead.contact_name}</li>}
                  <li>✓ 16 checklist dokumen (NDA, MOU, dll.) — status Pending</li>
                  {paymentTerms.length > 0 && <li>✓ {paymentTerms.length} payment terms</li>}
                  <li>✓ Status lead → Closed Won</li>
                  <li>✓ Status proyek → Administration</li>
                </ul>
              </div>

              {convertError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  {convertError}
                </div>
              )}
            </div>
          )}

          {/* ═══ Navigation ═══ */}
          <div className="flex justify-between gap-2 pt-3 border-t border-border">
            <Button variant="ghost" onClick={() => step === 1 ? onOpenChange(false) : setStep(s => s - 1)}
              className="text-xs h-9 text-muted-foreground">
              {step === 1 ? "Batal" : "← Kembali"}
            </Button>
            <div className="flex gap-2">
              {step < 4 && (
                <Button onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 ? !step1Valid : step === 2 ? !step2Valid : false}
                  className="bg-blue-600 hover:bg-blue-700 text-xs h-9 gap-1.5">
                  Lanjut →
                </Button>
              )}
              {step === 4 && (
                <Button onClick={handleConvert} disabled={converting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9 gap-1.5">
                  {converting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Membuat Proyek...</>
                    : <><Building2 className="w-3.5 h-3.5" /> Buat Proyek</>}
                </Button>
              )}
            </div>
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
          <LeadProgress lead={lead} leadId={leadId} hasBrief={hasBrief} hasQuotation={hasQuotation} hasTechnical={hasTechnical} hasCost={hasCost} />
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
  const [items, setItems] = useState<ProjectBrief[]>([]); const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [description, setDescription] = useState(""); const [file, setFile] = useState<File | null>(null)
  const [linkAttachment, setLinkAttachment] = useState("")
  const [uploading, setUploading] = useState(false)

  const fetch = useCallback(async () => {
    if (!insForge) return
    const { data } = await insForge.from("lead_project_briefs").select("*").eq("lead_id", leadId).is("deleted_at", null).order("created_at", { ascending: false })
    if (data) setItems(data); setLoading(false)
  }, [leadId])
  useEffect(() => { fetch() }, [fetch])

  useEffect(() => { onStatusChange?.(items.length > 0) }, [items, onStatusChange])

  const clearForm = () => {
    setEditId(null); setDescription(""); setFile(null); setLinkAttachment("")
  }

  const selectItem = (item: ProjectBrief) => {
    setEditId(item.id); setDescription(item.description || ""); setFile(null); setLinkAttachment((item as any).link_attachment || "")
  }

  const handleSave = async () => {
    if (!insForge) return; setUploading(true)
    try {
      let fileUrl = null, fileName = null, fileSize = null
      if (editId) {
        const curr = items.find(i => i.id === editId)
        if (curr) { fileUrl = curr.file_url; fileName = curr.file_name; fileSize = curr.file_size }
      }
      if (file) {
        const { data: up } = await insForge.storage.from("lead-documents").upload(`project-briefs/${leadId}/${file.name}`, file)
        if (up) { fileUrl = up.url; fileName = file.name; fileSize = file.size }
      }
      const p = { tenant_id: getTenantId(), lead_id: leadId, description: description || null, file_name: fileName, file_url: fileUrl, file_size: fileSize, link_attachment: linkAttachment || null }
      if (editId) await insForge.from("lead_project_briefs").update(p).eq("id", editId); else await insForge.from("lead_project_briefs").insert(p)
      clearForm(); fetch()
    } catch (err) { console.error(err) } finally { setUploading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus project brief ini?")) return; if (!insForge) return
    await insForge.from("lead_project_briefs").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (editId === id) clearForm()
    fetch()
  }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>

  const formDirty = description || file || linkAttachment

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Brief List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{items.length} Project Brief</p>
          <Button size="sm" variant="outline" onClick={clearForm} className="border-border h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Tambah Baru
          </Button>
        </div>
        {items.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada Project Brief. Buat brief baru di panel sebelah kanan.</CardContent></Card>
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
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <h4 className="font-medium text-foreground text-sm truncate">Project Brief</h4>
                        </div>
                        {item.description && <p className="text-[0.6rem] text-muted-foreground line-clamp-2">{item.description}</p>}
                        {(item as any).link_attachment && <p className="text-[0.6rem] text-blue-400 truncate flex items-center gap-1"><LinkIcon className="w-2.5 h-2.5 shrink-0" />{(item as any).link_attachment}</p>}
                        <div className="flex items-center gap-2 text-[0.55rem] text-muted-foreground">
                          {item.file_name && <span className="flex items-center gap-1"><FileText className="w-2.5 h-2.5" /> {item.file_name}</span>}
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
              {editId ? "Edit Project Brief" : "Project Brief Baru"}
            </h3>

            <div className="space-y-3">
              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Deskripsi</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Deskripsi project..." className="bg-background border-border text-sm" />
              </div>

              {/* File Upload */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Upload className="w-3 h-3 text-emerald-500" /> File Deck (PDF, PPT, DOC)
                </Label>
                <Input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} className="bg-background border-border text-sm" />
                {file && <p className="text-xs text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
                {editId && !file && (() => {
                  const curr = items.find(i => i.id === editId)
                  return curr?.file_name ? <p className="text-xs text-muted-foreground">File saat ini: {curr.file_name}</p> : null
                })()}
              </div>

              {/* Link Attachment */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 text-emerald-500" /> Link Attachment
                </Label>
                <Input value={linkAttachment} onChange={(e) => setLinkAttachment(e.target.value)} placeholder="Link deck, dokumentasi, referensi..." className="bg-background border-border text-sm h-9" />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {formDirty && (
                  <Button variant="ghost" onClick={clearForm} className="text-xs h-9" disabled={uploading}>
                    Batal
                  </Button>
                )}
                <Button onClick={handleSave} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9 gap-1">
                  {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Upload...</> : editId ? "Simpan" : "Tambah"}
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
// Quotation Tab
// ============================================================
function QuotationTab({ leadId, onStatusChange }: { leadId: string; onStatusChange?: (has: boolean) => void }) {
  const [items, setItems] = useState<Quotation[]>([]); const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [quotationNumber, setQuotationNumber] = useState("")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState("draft")
  const [notes, setNotes] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [saving, setSaving] = useState(false)

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

  const clearForm = () => {
    setEditId(null); setQuotationNumber(""); setTitle(""); setAmount(""); setStatus("draft"); setNotes(""); setValidUntil("")
  }

  const selectItem = (item: Quotation) => {
    setEditId(item.id); setQuotationNumber(item.quotation_number); setTitle(item.title); setAmount(String(item.amount || 0)); setStatus(item.status); setNotes(item.notes || ""); setValidUntil(item.valid_until?.split("T")[0] || "")
  }

  const handleSave = async () => {
    if (!title.trim() || !quotationNumber.trim() || !insForge) return; setSaving(true)
    try {
      const p = { tenant_id: getTenantId(), lead_id: leadId, quotation_number: quotationNumber.trim(), title: title.trim(), amount: parseFloat(amount) || 0, status, notes: notes || null, valid_until: validUntil || null }
      if (editId) await insForge.from("lead_quotations").update(p).eq("id", editId); else await insForge.from("lead_quotations").insert(p)
      clearForm(); fetch()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus quotation ini?")) return; if (!insForge) return
    await insForge.from("lead_quotations").update({ deleted_at: new Date().toISOString() }).eq("id", id)
    if (editId === id) clearForm()
    fetch()
  }

  const QSTATUS: Record<string, string> = { draft: "bg-zinc-500/10 text-zinc-400", sent: "bg-blue-500/10 text-blue-400", approved: "bg-emerald-500/10 text-emerald-400", rejected: "bg-red-500/10 text-red-400", revised: "bg-amber-500/10 text-amber-400" }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>

  const formDirty = quotationNumber || title || amount || notes || validUntil

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Quotation List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">{items.length} Quotation</p>
          <Button size="sm" variant="outline" onClick={async () => { clearForm(); setQuotationNumber(await genNum()) }} className="border-border h-8 text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Tambah Baru
          </Button>
        </div>
        {items.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Belum ada Quotation. Buat quotation baru di panel sebelah kanan.</CardContent></Card>
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
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Receipt className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <code className="text-[0.6rem] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">{item.quotation_number}</code>
                          <h4 className="font-medium text-foreground text-sm truncate">{item.title}</h4>
                          <Badge className={`${QSTATUS[item.status] || "bg-zinc-500/10 text-zinc-400"} text-[0.55rem]`}>{item.status}</Badge>
                        </div>
                        <p className="text-sm font-semibold text-emerald-400">{fmtCurrency(item.amount)}</p>
                        {item.notes && <p className="text-[0.6rem] text-muted-foreground line-clamp-1">{item.notes}</p>}
                        {item.valid_until && <p className="text-[0.55rem] text-muted-foreground">Valid until: {new Date(item.valid_until).toLocaleDateString("id-ID")}</p>}
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
              {editId ? "Edit Quotation" : "Quotation Baru"}
            </h3>

            <div className="space-y-3">
              {/* Quotation Number + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">No. Quotation <span className="text-red-500">*</span></Label>
                  <Input value={quotationNumber} onChange={(e) => setQuotationNumber(e.target.value)} className="bg-background border-border text-sm h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm text-foreground">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="revised">Revised</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Judul <span className="text-red-500">*</span></Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul quotation" className="bg-background border-border text-sm h-9" />
              </div>

              {/* Amount + Valid Until */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nilai (Rp)</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-background border-border text-sm h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Valid Until</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="bg-background border-border text-sm h-9" />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Catatan</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Catatan quotation..." className="bg-background border-border text-sm" />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {formDirty && (
                  <Button variant="ghost" onClick={clearForm} className="text-xs h-9" disabled={saving}>
                    Batal
                  </Button>
                )}
                <Button onClick={handleSave} disabled={!title.trim() || !quotationNumber.trim() || saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9 gap-1">
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
const SCHEME_TO_CATEGORY: Record<string, "Man Power Based" | "Equipment Cost" | "Operational Cost"> = {
  manpower: "Man Power Based",
  procurement: "Equipment Cost",
  product: "Operational Cost",
}

function CostAnalysisTab({ leadId, onStatusChange }: { leadId: string; onStatusChange?: (has: boolean) => void }) {
  const router = useRouter()
  const [items, setItems] = useState<CostAnalysisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetch = useCallback(async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from("lead_cost_analyses")
        .select("*")
        .eq("lead_id", leadId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
      if (error || !data) { setLoading(false); return }

      setItems(data.map((i: any) => {
        let hpp = 0
        let publishRate = 0
        const breakdown: string[] = []

        if (i.scheme_type === "manpower" || i.scheme_type === "product") {
          hpp = i.manpower_total_hpp || 0
          publishRate = i.manpower_total_publish || 0
          if (i.manpower_data?.length > 0) {
            i.manpower_data.forEach((m: any) => {
              breakdown.push(`${m.qty} × ${m.role || m.nama || "Resource"} × ${m.months} Bulan`)
            })
          }
        }

        if (i.scheme_type === "procurement" || i.scheme_type === "product") {
          hpp = hpp || i.procurement_total || 0
          if (i.procurement_data?.length > 0) {
            const totalPub = i.procurement_data.reduce((s: number, p: any) => s + (p.publish_rate || 0), 0)
            publishRate = publishRate || totalPub
            i.procurement_data.forEach((p: any) => {
              breakdown.push(`${p.qty} × ${p.item_name || "Item"}`)
            })
          }
        }

        let status: CostAnalysisItem["status"] = "Draft"
        if (i.status === "approved" || i.status === "Approved") status = "Approved"
        else if (i.status === "pending" || i.status === "Pending") status = "Pending"
        else if (i.status === "conflict" || i.status === "Conflict") status = "Conflict"

        return {
          id: i.id,
          category: SCHEME_TO_CATEGORY[i.scheme_type] || "Man Power Based",
          createdAt: i.created_at,
          totalCost: i.grand_total || 0,
          hpp,
          publishRate,
          status,
          breakdown,
          scorecard: computeScorecard(i),
        }
      }))
    } catch { /* ignore */ }
    setLoading(false)
  }, [leadId])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { onStatusChange?.(items.length > 0) }, [items, onStatusChange])

  const handleSelectScheme = () => {
    setDialogOpen(false)
    router.push(`/commercial/cost-analysis/new?lead_id=${leadId}&scheme=manpower`)
  }

  const handleDelete = async (id: string) => {
    if (!insForge) return
    try {
      await insForge.from("lead_cost_analyses").update({ deleted_at: new Date().toISOString() }).eq("id", id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <>
      <CostAnalysisList
        items={items}
        loading={loading}
        onCreate={() => setDialogOpen(true)}
        onEdit={(item) => router.push(`/commercial/cost-analysis/new?id=${item.id}&lead_id=${leadId}`)}
        onViewDetail={(item) => router.push(`/commercial/cost-analysis/${item.id}?lead_id=${leadId}`)}
        onDelete={handleDelete}
      />

      {/* Man Power Cost Analysis */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cost Analysis Baru</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground -mt-2">Buat perhitungan biaya berbasis Man Power untuk project ini.</p>
          <div className="py-2">
            <Card
              className="cursor-pointer hover:border-emerald-500/70 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all"
              onClick={handleSelectScheme}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Man Power Based</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Hitung biaya berdasarkan komposisi manpower (HPP, Publish Rate, margin). Cocok untuk project IT consulting/services.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ============================================================
// Summary Quotation Tab
// ============================================================
function SummaryQuotationTab({ leadId, lead }: { leadId: string; lead: any }) {
  const [summary, setSummary] = useState<QuotationSummary | null>(null); const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true); const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [projectTypeName, setProjectTypeName] = useState<string>("")

  const fetchData = useCallback(async () => {
    if (!insForge) return
    const { data: q } = await insForge.from("lead_quotations").select("*").eq("lead_id", leadId).is("deleted_at", null)
    if (q) setQuotations(q)
    const { data: s } = await insForge.from("lead_quotation_summaries").select("*").eq("lead_id", leadId).is("deleted_at", null).limit(1)
    if (s && s.length > 0) { setSummary(s[0]); setNotes(s[0].notes || "") }; setLoading(false)
  }, [leadId])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!insForge || !lead?.project_type_id) return
    insForge.from("commercial_project_types").select("name").eq("id", lead.project_type_id).single()
      .then(({ data }: any) => { if (data) setProjectTypeName(data.name) })
  }, [lead?.project_type_id])

  const total = quotations.reduce((s, q) => s + (q.amount || 0), 0)
  const approved = quotations.filter(q => q.status === "approved").reduce((s, q) => s + (q.amount || 0), 0)

  const handleSave = async () => {
    if (!insForge) return; setSaving(true)
    try {
      const p = { tenant_id: getTenantId(), lead_id: leadId, total_amount: total, notes: notes || null }
      if (summary?.id) await insForge.from("lead_quotation_summaries").update(p).eq("id", summary.id); else await insForge.from("lead_quotation_summaries").insert(p)
      fetchData()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleDownloadPDF = async () => {
    if (!insForge) return
    setDownloading(true)
    try {
      // Fetch latest cost analysis for manpower rows
      const { data: caList } = await insForge
        .from("lead_cost_analyses")
        .select("*")
        .eq("lead_id", leadId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)

      const ca = caList?.[0]
      const manpowerRows = (ca?.manpower_data ?? []).map((m: any) => ({
        role_name: m.role || m.nama || "Resource",
        work_mode: m.work_mode || "Remote",
        qty: m.qty ?? 1,
        months: m.months ?? 1,
        publish_rate: m.publishRate ?? 0,
      }))

      const quotationData = {
        client_name: lead.contact_name || "—",
        company_name: lead.company_name || "—",
        company_address: lead.company_address ?? null,
        contact_phone: lead.contact_phone ?? null,
        quotation_number: lead.lead_number ?? `QTS-${String(lead.id).substring(0, 8).toUpperCase()}`,
        project_type: projectTypeName || "Manpower as a Services",
        date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }),
        valid_days: lead.quotation_valid_days ?? 30,
        scope_of_work: lead.scope_of_work ?? null,
        manpower_rows: manpowerRows,
        terms_and_conditions: lead.terms_and_conditions ?? null,
      }

      const { downloadQuotationPDF } = await import("@/lib/download-quotation-pdf")
      const filename = `Summary-Quotation-${quotationData.quotation_number}.pdf`
      await downloadQuotationPDF(quotationData, filename)
    } catch (err) {
      console.error("Failed to generate PDF:", err)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className="text-center py-8 text-sm text-muted-foreground">Memuat...</div>
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Summary Quotation</h3>
        <Button
          size="sm"
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="bg-blue-600 hover:bg-blue-700 h-8 text-xs gap-1.5"
        >
          {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          {downloading ? "Generating..." : "Download PDF"}
        </Button>
      </div>
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
    company_address: "", scope_of_work: "", terms_and_conditions: "", quotation_valid_days: "30",
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
        company_address: lead.company_address || "",
        scope_of_work: lead.scope_of_work || "",
        terms_and_conditions: lead.terms_and_conditions || "",
        quotation_valid_days: lead.quotation_valid_days != null ? String(lead.quotation_valid_days) : "30",
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
        company_address: editForm.company_address || null,
        scope_of_work: editForm.scope_of_work || null,
        terms_and_conditions: editForm.terms_and_conditions || null,
        quotation_valid_days: editForm.quotation_valid_days ? parseInt(editForm.quotation_valid_days) : 30,
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
            <Input type="text" value={editForm.estimated_value} onChange={(e) => setEditForm({...editForm, estimated_value: e.target.value, budget_value: e.target.value})} className="bg-background border-border text-sm h-9" />
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
          {/* Quotation PDF fields */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Data Quotation PDF</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Alamat Perusahaan</Label>
                <Input value={editForm.company_address} onChange={(e) => setEditForm({...editForm, company_address: e.target.value})} placeholder="Alamat lengkap perusahaan klien" className="bg-background border-border text-sm h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Scope of Work <span className="text-muted-foreground/60">(satu baris per item)</span></Label>
                <Textarea value={editForm.scope_of_work} onChange={(e) => setEditForm({...editForm, scope_of_work: e.target.value})} rows={4} placeholder={"Develop backend API\nIntegrate payment gateway\nDeploy to cloud"} className="bg-background border-border text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Terms & Conditions <span className="text-muted-foreground/60">(satu baris per item)</span></Label>
                <Textarea value={editForm.terms_and_conditions} onChange={(e) => setEditForm({...editForm, terms_and_conditions: e.target.value})} rows={4} placeholder={"Pembayaran dilakukan di muka\nHarga belum termasuk PPN 11%\nBerlaku 30 hari"} className="bg-background border-border text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Masa Berlaku Quotation (hari)</Label>
                <Input type="number" min={1} value={editForm.quotation_valid_days} onChange={(e) => setEditForm({...editForm, quotation_valid_days: e.target.value})} className="bg-background border-border text-sm h-9 w-32" />
              </div>
            </div>
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
                    <input type="text" value={editForm.budget_value} onChange={(e) => setEditForm({...editForm, budget_value: e.target.value, estimated_value: e.target.value})} placeholder="Estimasi nilai proyek..." className="w-full h-8 pl-8 pr-3 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50" />
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
      <TabsContent value="summary"><SummaryQuotationTab leadId={lead.id} lead={lead} /></TabsContent>
    </Tabs>
  )
}
