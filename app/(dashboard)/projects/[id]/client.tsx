"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowLeft, Edit3, Building2, User, DollarSign, Clock, Calendar,
  FileText, Users, CheckSquare, Flag, MessageSquare, Layers,
  Plus, Trash2, Loader2, ChevronRight, AlertCircle, TrendingUp,
  Circle, CheckCircle2, XCircle, Zap, BarChart2,
  Phone, Mail, Globe, Video, ChevronDown, ClipboardList, CreditCard,
  MapPin, Link as LinkIcon,
} from "lucide-react"
import { insForge } from "@/lib/insforge"
import { fmtIDR } from "@/lib/commercial-data"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────
interface Project {
  id: string
  project_code: string
  project_name: string
  client_name: string | null
  company_name: string | null
  status: string
  health: string | null
  project_type: string | null
  total_hpp: number | null
  total_publish: number | null
  grand_total: number | null
  margin_pct: number | null
  quotation_publish: number | null
  actual_deal: number | null
  po_value: number | null
  start_date: string | null
  kickoff_date: string | null
  start_dev_date: string | null
  end_date: string | null
  term_of_payment: string | null
  notes: string | null
  created_at: string
  pic_commercial_id: string | null
  pic_adm_id: string | null
  pm_id: string | null
  lead_id: string | null
  project_url: string | null
  online_meeting_url: string | null
  meeting_schedule: Record<string, string> | null
  notetaker_account: string | null
  lead_data_snapshot: Record<string, unknown> | null
  mom_snapshot: unknown[] | null
  cost_analysis_snapshot: unknown[] | null
}
interface ProjectContact {
  id: string; project_id: string; full_name: string; role: string | null
  phone: string | null; email: string | null; is_primary: boolean | null; sort_order: number | null
}
interface ChecklistItem {
  id: string; project_id: string; category: string; item_name: string
  status: string; due_date: string | null; completed_date: string | null
  link_drive: string | null; notes: string | null; sort_order: number | null
}
interface PaymentTerm {
  id: string; project_id: string; term_name: string; percentage: number | null
  nominal: number; due_date: string | null; paid_date: string | null
  status: string; notes: string | null; sort_order: number | null
}
interface Milestone {
  id: string; project_id: string; title: string; description: string | null
  target_date: string | null; completed_at: string | null; status: string | null
  is_payment_trigger: boolean | null; payment_percent: number | null; created_at: string
}
interface Task {
  id: string; task_code: string | null; title: string; description: string | null
  assigned_to: string | null; status: string | null; priority: string | null
  start_date: string | null; due_date: string | null; progress_percent: number | null
  estimated_hours: number | null; actual_hours: number | null
  created_at: string; deleted_at: string | null
}
interface Member {
  id: string; user_profile_id: string; role: string | null
  allocation_percent: number | null; is_active: boolean | null; joined_at: string | null
}
interface Manpower {
  id: string; role_name: string; qty: number | null; months: number | null
  hpp_rate: number | null; publish_rate: number | null; special_rate: number | null; sort_order: number | null
}
interface Comment {
  id: string; content: string | null; author_id: string | null
  comment_type: string | null; file_url: string | null; file_name: string | null
  created_at: string
}
interface UserProfile { id: string; full_name: string; employee_number: string | null }

// ── Constants ──────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview",   label: "Overview",   icon: BarChart2 },
  { key: "dokumen",    label: "Dokumen",    icon: ClipboardList },
  { key: "brief",      label: "Brief",      icon: FileText },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "tasks",      label: "Tasks",      icon: CheckSquare },
  { key: "tim",        label: "Tim",        icon: Users },
  { key: "manpower",   label: "Manpower",   icon: Layers },
  { key: "komentar",   label: "Komentar",   icon: MessageSquare },
] as const
type TabKey = typeof TABS[number]["key"]

const STATUS_BADGE: Record<string, string> = {
  draft:          "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  administration: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "kick-off":     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "on-going":     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  completed:      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  overdue:        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  hold:           "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  // legacy
  won:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  delivery:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
}
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", administration: "Administration", "kick-off": "Kick-off",
  "on-going": "On-Going", completed: "Completed", overdue: "Overdue", hold: "Hold",
  won: "On-Going", delivery: "On-Going",
}

// Checklist status config
const CHECKLIST_STATUS: Record<string, { label: string; cls: string }> = {
  pending:        { label: "Pending",       cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  on_going:       { label: "On-Going",      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  done:           { label: "Done",          cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  hold:           { label: "Hold",          cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  not_applicable: { label: "N/A",           cls: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500" },
}
const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending:         { label: "Pending",         cls: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
  waiting_payment: { label: "Waiting Payment", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  paid:            { label: "Paid",            cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  overdue:         { label: "Overdue",         cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
}
const CATEGORY_LABEL: Record<string, string> = {
  credentials: "Credentials", development: "Development Document", handover: "Handover",
}
const HEALTH_DOT: Record<string, string> = {
  green: "bg-emerald-500", yellow: "bg-amber-400", red: "bg-red-500",
}
const TASK_STATUS_STYLE: Record<string, string> = {
  todo:        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  review:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  done:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled:   "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}
const PRIORITY_STYLE: Record<string, string> = {
  low:    "text-zinc-400",
  medium: "text-amber-500",
  high:   "text-orange-500",
  urgent: "text-red-500",
}
const MILESTONE_STATUS_STYLE: Record<string, string> = {
  pending:    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  in_progress:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled:  "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "baru saja"
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} hari lalu`
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ProjectDetailClient({ id }: { id: string }) {
  const [tab, setTab] = useState<TabKey>("overview")
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])

  // Tab data
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [manpower, setManpower] = useState<Manpower[]>([])
  const [comments, setComments] = useState<Comment[]>([])

  // New data
  const [contacts, setContacts] = useState<ProjectContact[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])

  // New comment
  const [newComment, setNewComment] = useState("")
  const [postingComment, setPostingComment] = useState(false)

  // Checklist inline status update
  const [updatingChecklist, setUpdatingChecklist] = useState<string | null>(null)
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  // View toggles
  const [taskView, setTaskView] = useState<"list" | "kanban" | "gantt">("kanban")
  const [milestoneView, setMilestoneView] = useState<"timeline" | "gantt">("timeline")

  // Add-contact inline form
  const [showAddContact, setShowAddContact] = useState(false)
  const [addingContact, setAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ full_name: "", role: "", phone: "", email: "" })

  // Add-payment-term inline form
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({ term_name: "", nominal: "", percentage: "", due_date: "" })

  // Add-milestone inline form
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: "", description: "", target_date: "", is_payment_trigger: false, payment_percent: "", status: "pending" })
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null)

  // Add-member inline form
  const [showAddMember, setShowAddMember] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [newMember, setNewMember] = useState({ user_profile_id: "", role: "", allocation_percent: "100" })

  const userName = useCallback((uid: string | null) => {
    if (!uid) return "—"
    return users.find((u) => u.id === uid)?.full_name ?? "—"
  }, [users])

  // ── Fetch all ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!insForge) { setLoading(false); return }

    Promise.all([
      // project
      insForge.from("commercial_projects").select("*").eq("id", id).is("deleted_at", null).single(),
      // users
      insForge.from("user_profiles").select("id,full_name,employee_number").is("deleted_at", null),
      // milestones
      insForge.from("project_milestones").select("*").eq("project_id", id).order("target_date", { ascending: true }),
      // tasks
      insForge.from("project_tasks").select("*").eq("project_id", id).is("deleted_at", null).order("sort_order", { ascending: true }),
      // members
      (insForge as any).from("project_members").select("*").eq("project_id", id),
      // manpower
      insForge.from("commercial_project_manpower").select("*").eq("project_id", id).is("deleted_at", null).order("sort_order", { ascending: true }),
      // comments
      (insForge as any).from("project_comments").select("*").eq("project_id", id).is("task_id", null).order("created_at", { ascending: true }),
      // contacts
      (insForge as any).from("project_contacts").select("*").eq("project_id", id).is("deleted_at", null).order("sort_order", { ascending: true }),
      // checklist
      (insForge as any).from("project_checklist_items").select("*").eq("project_id", id).is("deleted_at", null).order("sort_order", { ascending: true }),
      // payment terms
      (insForge as any).from("project_payment_terms").select("*").eq("project_id", id).is("deleted_at", null).order("sort_order", { ascending: true }),
    ]).then(([p, u, m, t, mb, mp, c, ct, cl, pt]) => {
      if (p.data)  setProject(p.data as Project)
      if (u.data)  setUsers(u.data as UserProfile[])
      if (m.data)  setMilestones(m.data as Milestone[])
      if (t.data)  setTasks(t.data as Task[])
      if (mb.data) setMembers(mb.data as Member[])
      if (mp.data) setManpower(mp.data as Manpower[])
      if (c.data)  setComments(c.data as Comment[])
      if (ct.data) setContacts(ct.data as ProjectContact[])
      if (cl.data) setChecklist(cl.data as ChecklistItem[])
      if (pt.data) setPaymentTerms(pt.data as PaymentTerm[])
      setLoading(false)
    })
  }, [id])

  // Inline status update helpers
  const updateChecklistStatus = async (itemId: string, status: string) => {
    if (!insForge) return
    setUpdatingChecklist(itemId)
    const completedDate = status === "done" ? new Date().toISOString().split("T")[0] : null
    await (insForge as any).from("project_checklist_items").update({ status, completed_date: completedDate, updated_at: new Date().toISOString() }).eq("id", itemId)
    setChecklist(prev => prev.map(c => c.id === itemId ? { ...c, status, completed_date: completedDate } : c))
    setUpdatingChecklist(null)
  }

  const updatePaymentStatus = async (termId: string, status: string) => {
    if (!insForge) return
    setUpdatingPayment(termId)
    const paidDate = status === "paid" ? new Date().toISOString().split("T")[0] : null
    await (insForge as any).from("project_payment_terms").update({ status, paid_date: paidDate, updated_at: new Date().toISOString() }).eq("id", termId)
    setPaymentTerms(prev => prev.map(t => t.id === termId ? { ...t, status, paid_date: paidDate } : t))
    setUpdatingPayment(null)
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    if (!insForge) return
    setUpdatingTask(taskId)
    await (insForge as any).from("project_tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    setUpdatingTask(null)
  }

  const addContact = async () => {
    if (!insForge || !newContact.full_name.trim()) return
    setAddingContact(true)
    const { data } = await (insForge as any).from("project_contacts").insert([{
      project_id: id,
      full_name: newContact.full_name.trim(),
      role: newContact.role.trim() || null,
      phone: newContact.phone.trim() || null,
      email: newContact.email.trim() || null,
      is_primary: contacts.length === 0,
      sort_order: contacts.length,
    }]).select().single()
    if (data) setContacts(prev => [...prev, data as ProjectContact])
    setNewContact({ full_name: "", role: "", phone: "", email: "" })
    setShowAddContact(false)
    setAddingContact(false)
  }

  const addPaymentTerm = async () => {
    if (!insForge || !newPayment.term_name.trim() || !newPayment.nominal) return
    setAddingPayment(true)
    const { data } = await (insForge as any).from("project_payment_terms").insert([{
      project_id: id,
      term_name: newPayment.term_name.trim(),
      nominal: parseFloat(newPayment.nominal),
      percentage: newPayment.percentage ? parseFloat(newPayment.percentage) : null,
      due_date: newPayment.due_date || null,
      status: "pending",
      sort_order: paymentTerms.length,
    }]).select().single()
    if (data) setPaymentTerms(prev => [...prev, data as PaymentTerm])
    setNewPayment({ term_name: "", nominal: "", percentage: "", due_date: "" })
    setShowAddPayment(false)
    setAddingPayment(false)
  }

  const postComment = async () => {
    if (!insForge || !newComment.trim()) return
    setPostingComment(true)
    const { data } = await insForge.from("project_comments").insert([{
      project_id: id, content: newComment.trim(), comment_type: "comment",
    }]).select().single()
    if (data) setComments((prev) => [...prev, data as Comment])
    setNewComment("")
    setPostingComment(false)
  }

  const addMilestone = async () => {
    if (!insForge || !newMilestone.title.trim()) return
    setAddingMilestone(true)
    const { data } = await (insForge as any).from("project_milestones").insert([{
      project_id: id,
      title: newMilestone.title.trim(),
      description: newMilestone.description.trim() || null,
      target_date: newMilestone.target_date || null,
      is_payment_trigger: newMilestone.is_payment_trigger,
      payment_percent: newMilestone.is_payment_trigger && newMilestone.payment_percent ? parseFloat(newMilestone.payment_percent) : null,
      status: newMilestone.status,
    }]).select().single()
    if (data) setMilestones((prev) => [...prev, data as Milestone])
    setNewMilestone({ title: "", description: "", target_date: "", is_payment_trigger: false, payment_percent: "", status: "pending" })
    setShowAddMilestone(false)
    setAddingMilestone(false)
  }

  const updateMilestoneStatus = async (milestoneId: string, status: string) => {
    if (!insForge) return
    setUpdatingMilestone(milestoneId)
    const completedAt = status === "completed" ? new Date().toISOString() : null
    await (insForge as any).from("project_milestones").update({ status, completed_at: completedAt, updated_at: new Date().toISOString() }).eq("id", milestoneId)
    setMilestones((prev) => prev.map((m) => m.id === milestoneId ? { ...m, status, completed_at: completedAt } : m))
    setUpdatingMilestone(null)
  }

  const deleteMilestone = async (milestoneId: string) => {
    if (!insForge || !confirm("Hapus milestone ini?")) return
    await (insForge as any).from("project_milestones").delete().eq("id", milestoneId)
    setMilestones((prev) => prev.filter((m) => m.id !== milestoneId))
  }

  const addMember = async () => {
    if (!insForge || !newMember.user_profile_id) return
    setAddingMember(true)
    const { data } = await (insForge as any).from("project_members").insert([{
      project_id: id,
      user_profile_id: newMember.user_profile_id,
      role: newMember.role.trim() || null,
      allocation_percent: newMember.allocation_percent ? parseInt(newMember.allocation_percent) : 100,
      is_active: true,
      joined_at: new Date().toISOString(),
    }]).select().single()
    if (data) setMembers((prev) => [...prev, data as Member])
    setNewMember({ user_profile_id: "", role: "", allocation_percent: "100" })
    setShowAddMember(false)
    setAddingMember(false)
  }

  const removeMember = async (memberId: string) => {
    if (!insForge || !confirm("Keluarkan anggota ini dari tim?")) return
    await (insForge as any).from("project_members").delete().eq("id", memberId)
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  // ── Loading / not found ───────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
    </div>
  )
  if (!project) return (
    <div className="text-center py-12">
      <AlertCircle className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
      <p className="text-muted-foreground text-sm">Project tidak ditemukan</p>
      <Link href="/projects"><button className="mt-4 text-xs px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700">Kembali</button></Link>
    </div>
  )

  // ── Computed ──────────────────────────────────────────────────────────
  const daysLeft = project.end_date
    ? Math.ceil((new Date(project.end_date).getTime() - Date.now()) / 86400000)
    : null
  const completedTasks = tasks.filter((t) => t.status === "done").length
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const completedMilestones = milestones.filter((m) => m.status === "completed").length

  // All Progress: 30% credentials + 50% dev/handover checklist + 20% payment
  const credDone  = checklist.filter(c => c.category === "credentials" && c.status === "done").length
  const credTotal = checklist.filter(c => c.category === "credentials").length
  const devDone   = checklist.filter(c => c.category !== "credentials" && c.status === "done").length
  const devTotal  = checklist.filter(c => c.category !== "credentials").length
  const paidTerms = paymentTerms.filter(t => t.status === "paid").length
  const allProgress = checklist.length === 0 && paymentTerms.length === 0 ? null : Math.round(
    (credTotal  > 0 ? (credDone  / credTotal)  * 30 : 0) +
    (devTotal   > 0 ? (devDone   / devTotal)   * 50 : 0) +
    (paymentTerms.length > 0 ? (paidTerms / paymentTerms.length) * 20 : 0)
  )

  // Checklist progress per category
  const checklistByCat = (cat: string) => checklist.filter(c => c.category === cat)
  const catProgress = (cat: string) => {
    const items = checklistByCat(cat)
    if (items.length === 0) return 0
    return Math.round(items.filter(c => c.status === "done").length / items.length * 100)
  }

  // Payment totals
  const totalNominal = paymentTerms.reduce((s, t) => s + (t.nominal || 0), 0)
  const paidNominal  = paymentTerms.filter(t => t.status === "paid").reduce((s, t) => s + (t.nominal || 0), 0)
  const paymentProgress = totalNominal > 0 ? Math.round(paidNominal / totalNominal * 100) : 0

  return (
    <div className="space-y-0">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between pb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Link href="/projects">
            <button className="mt-1 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">{project.project_name}</h1>
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium shrink-0", STATUS_BADGE[project.status] ?? "bg-zinc-100 text-zinc-600")}>
                {STATUS_LABEL[project.status] ?? project.status}
              </span>
              {project.health && (
                <div className="flex items-center gap-1 shrink-0">
                  <div className={cn("w-2 h-2 rounded-full", HEALTH_DOT[project.health] ?? "bg-zinc-400")} />
                  <span className="text-xs text-zinc-500 capitalize">{project.health}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-xs text-zinc-400 font-mono">{project.project_code}</p>
              {project.company_name && <span className="text-xs text-zinc-500">· {project.company_name}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {/* All Progress */}
          {allProgress !== null && (
            <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-zinc-500">All Progress</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{allProgress}%</span>
              <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${allProgress}%` }} />
              </div>
            </div>
          )}
          <Link href={`/projects/${id}/edit`}>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </Link>
        </div>
      </div>

      {/* ── KPI inline strip ── */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5 text-sm">
        <div>
          <span className="text-zinc-400 text-xs">Nilai PO </span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {project.po_value && project.po_value > 0 ? fmtIDR(project.po_value) : project.grand_total ? fmtIDR(project.grand_total) : "—"}
          </span>
        </div>
        <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch hidden sm:block" />
        <div>
          <span className="text-zinc-400 text-xs">Margin </span>
          <span className={cn("font-bold",
            project.margin_pct && project.margin_pct >= 20 ? "text-emerald-600 dark:text-emerald-400" :
            project.margin_pct && project.margin_pct >= 10 ? "text-amber-500" : "text-zinc-900 dark:text-zinc-100"
          )}>{project.margin_pct ? `${project.margin_pct.toFixed(1)}%` : "—"}</span>
        </div>
        <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch hidden sm:block" />
        {paymentTerms.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 text-xs">Payment </span>
              <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${paymentProgress}%` }} />
              </div>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">{paymentProgress}%</span>
            </div>
            <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch hidden sm:block" />
          </>
        )}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-xs">Tasks </span>
          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${taskProgress}%` }} />
          </div>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">{completedTasks}/{tasks.length}</span>
        </div>
        <div className="w-px bg-zinc-200 dark:bg-zinc-700 self-stretch hidden sm:block" />
        <div>
          <span className="text-zinc-400 text-xs">Deadline </span>
          <span className={cn("font-bold",
            daysLeft === null ? "text-zinc-400" :
            daysLeft < 0 ? "text-red-500" : daysLeft <= 7 ? "text-amber-500" : "text-zinc-700 dark:text-zinc-300"
          )}>
            {daysLeft === null ? "—" : daysLeft < 0 ? `${Math.abs(daysLeft)}h terlambat` : `${daysLeft} hari lagi`}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-5">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => {
            const counts: Record<string, number> = {
              milestones: milestones.length,
              tasks: tasks.length,
              tim: members.length,
              manpower: manpower.length,
              komentar: comments.length,
            }
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors",
                  tab === key
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {counts[key] !== undefined && counts[key] > 0 && (
                  <span className={cn(
                    "ml-0.5 px-1.5 py-0.5 rounded-full text-[0.55rem] font-semibold",
                    tab === key
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                  )}>
                    {counts[key]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ════════════════ TAB: OVERVIEW ════════════════ */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-4">

            {/* Detail Proyek */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Detail Proyek</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  { label: "Perusahaan", value: project.company_name },
                  { label: "Tipe Proyek", value: project.project_type },
                  { label: "Term of Payment", value: project.term_of_payment },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center px-4 py-2.5 gap-4">
                    <span className="text-xs text-zinc-400 w-36 shrink-0">{label}</span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{value || "—"}</span>
                  </div>
                ))}
                {/* Dates */}
                <div className="flex items-center px-4 py-2.5 gap-4">
                  <span className="text-xs text-zinc-400 w-36 shrink-0">Kick-off</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{project.kickoff_date || project.start_date || "—"}</span>
                </div>
                {project.start_dev_date && (
                  <div className="flex items-center px-4 py-2.5 gap-4">
                    <span className="text-xs text-zinc-400 w-36 shrink-0">Start Dev</span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{project.start_dev_date}</span>
                  </div>
                )}
                <div className="flex items-center px-4 py-2.5 gap-4">
                  <span className="text-xs text-zinc-400 w-36 shrink-0">Due Date</span>
                  <span className={cn("text-sm font-medium", daysLeft !== null && daysLeft < 0 ? "text-red-500" : "text-zinc-800 dark:text-zinc-200")}>
                    {project.end_date || "—"}
                    {daysLeft !== null && <span className="ml-2 text-xs text-zinc-400">({daysLeft < 0 ? `${Math.abs(daysLeft)}h terlambat` : `${daysLeft} hari lagi`})</span>}
                  </span>
                </div>
                {/* Project URL */}
                {project.project_url && (
                  <div className="flex items-center px-4 py-2.5 gap-4">
                    <span className="text-xs text-zinc-400 w-36 shrink-0 flex items-center gap-1"><Globe className="w-3 h-3" /> Project URL</span>
                    <a href={project.project_url.startsWith("http") ? project.project_url : `https://${project.project_url}`}
                       target="_blank" rel="noopener noreferrer"
                       className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">
                      {project.project_url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Tim Internal */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Tim Internal</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  { label: "PIC Commercial", uid: project.pic_commercial_id },
                  { label: "PIC Admin",      uid: project.pic_adm_id },
                  { label: "Project Manager",uid: project.pm_id },
                ].map(({ label, uid }) => (
                  <div key={label} className="flex items-center px-4 py-2.5 gap-4">
                    <span className="text-xs text-zinc-400 w-36 shrink-0">{label}</span>
                    <div className="flex items-center gap-2">
                      {uid && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 text-[0.55rem] font-bold shrink-0">
                          {userName(uid).charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{userName(uid)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kontak Klien */}
            {contacts.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Kontak Klien</span>
                    <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{contacts.length}</span>
                  </div>
                  <button onClick={() => setTab("dokumen")} className="text-[0.65rem] text-emerald-600 hover:text-emerald-500">
                    Lihat Semua
                  </button>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {contacts.slice(0, 3).map(c => (
                    <div key={c.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 mt-0.5">
                        {c.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{c.full_name}</span>
                          {c.is_primary && <span className="text-[0.5rem] px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">PIC</span>}
                          {c.role && <span className="text-[0.6rem] text-zinc-400">{c.role}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 mt-0.5">
                          {c.phone && <span className="text-[0.65rem] text-zinc-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{c.phone}</span>}
                          {c.email && <span className="text-[0.65rem] text-zinc-500 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{c.email}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting info */}
            {project.online_meeting_url && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                  <Video className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Online Meeting</span>
                </div>
                <div className="px-4 py-3">
                  <a href={project.online_meeting_url} target="_blank" rel="noopener noreferrer"
                     className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3" />{project.online_meeting_url}
                  </a>
                </div>
              </div>
            )}

            {/* Catatan */}
            {project.notes && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <p className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Catatan
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{project.notes}</p>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-4">

            {/* Checklist progress — credentials */}
            {checklist.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Project Document</span>
                  </div>
                  <button onClick={() => setTab("dokumen")} className="text-[0.65rem] text-emerald-600 hover:text-emerald-500 flex items-center gap-0.5">
                    Detail <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Group by category */}
                {["credentials", "development", "handover"].map((cat) => {
                  const items = checklistByCat(cat)
                  if (items.length === 0) return null
                  const prog = catProgress(cat)
                  return (
                    <div key={cat}>
                      <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
                        <span className="text-[0.6rem] font-semibold text-zinc-500 uppercase tracking-wider">{CATEGORY_LABEL[cat]}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", prog === 100 ? "bg-emerald-500" : prog >= 50 ? "bg-blue-500" : "bg-zinc-300")}
                              style={{ width: `${prog}%` }} />
                          </div>
                          <span className="text-[0.6rem] font-semibold text-zinc-500">{prog}%</span>
                        </div>
                      </div>
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {items.map(item => {
                          const sc = CHECKLIST_STATUS[item.status] ?? CHECKLIST_STATUS.pending
                          return (
                            <div key={item.id} className="flex items-center justify-between px-4 py-2 gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {item.status === "done"
                                  ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                  : item.status === "hold"
                                  ? <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                  : <Circle className="w-3 h-3 text-zinc-300 shrink-0" />
                                }
                                <span className={cn("text-xs truncate", item.status === "done" ? "line-through text-zinc-400" : "text-zinc-700 dark:text-zinc-300")}>
                                  {item.item_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {item.completed_date && <span className="text-[0.55rem] text-zinc-400 font-mono">{item.completed_date}</span>}
                                <select
                                  value={item.status}
                                  disabled={updatingChecklist === item.id}
                                  onChange={(e) => updateChecklistStatus(item.id, e.target.value)}
                                  className={cn("text-[0.6rem] px-1.5 py-0.5 rounded font-medium border-0 cursor-pointer outline-none appearance-none", sc.cls)}
                                >
                                  {Object.entries(CHECKLIST_STATUS).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Payment Progress */}
            {paymentTerms.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Payment Progress</span>
                    </div>
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{paymentProgress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", paymentProgress === 100 ? "bg-emerald-500" : "bg-blue-500")}
                      style={{ width: `${paymentProgress}%` }} />
                  </div>
                  {totalNominal > 0 && (
                    <div className="flex justify-between mt-1.5 text-[0.6rem] text-zinc-400">
                      <span>Terbayar: {fmtIDR(paidNominal)}</span>
                      <span>Total: {fmtIDR(totalNominal)}</span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paymentTerms.map(t => {
                    const ps = PAYMENT_STATUS[t.status] ?? PAYMENT_STATUS.pending
                    return (
                      <div key={t.id} className="flex items-center px-4 py-2.5 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">{t.term_name}</div>
                          <div className="text-[0.6rem] text-zinc-400 mt-0.5 flex items-center gap-2">
                            <span className="font-mono">{fmtIDR(t.nominal)}</span>
                            {t.due_date && <span>· Jatuh tempo: {t.due_date}</span>}
                            {t.paid_date && <span className="text-emerald-600">· Dibayar: {t.paid_date}</span>}
                          </div>
                        </div>
                        <select
                          value={t.status}
                          disabled={updatingPayment === t.id}
                          onChange={(e) => updatePaymentStatus(t.id, e.target.value)}
                          className={cn("text-[0.6rem] px-1.5 py-0.5 rounded font-medium border-0 cursor-pointer outline-none appearance-none shrink-0", ps.cls)}
                        >
                          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Keuangan */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Keuangan</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {[
                  { label: "HPP",         value: project.total_hpp,         color: "text-red-500" },
                  { label: "Publish",     value: project.total_publish,     color: "text-zinc-700 dark:text-zinc-300" },
                  { label: "Quotation",   value: project.quotation_publish,  color: "text-blue-600 dark:text-blue-400" },
                  { label: "Actual Deal", value: project.actual_deal,        color: "text-orange-500" },
                  { label: "Grand Total", value: project.grand_total,        color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Nilai PO",    value: project.po_value,           color: "text-blue-700 dark:text-blue-300" },
                ].map(({ label, value, color }) => value && value > 0 ? (
                  <div key={label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-xs text-zinc-400">{label}</span>
                    <span className={cn("text-xs font-semibold tabular-nums", color)}>{fmtIDR(value)}</span>
                  </div>
                ) : null)}
                {project.margin_pct && project.margin_pct > 0 ? (
                  <div className="px-4 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-zinc-400">Margin</span>
                      <span className={cn("text-xs font-bold",
                        project.margin_pct >= 20 ? "text-emerald-500" :
                        project.margin_pct >= 10 ? "text-amber-500" : "text-red-500"
                      )}>{project.margin_pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", project.margin_pct >= 20 ? "bg-emerald-500" : project.margin_pct >= 10 ? "bg-amber-400" : "bg-red-400")}
                        style={{ width: `${Math.min(project.margin_pct, 100)}%` }} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Lead snapshot (compact) */}
            {project.lead_data_snapshot && (
              <div className="bg-amber-50 dark:bg-amber-950/10 rounded-xl border border-amber-200 dark:border-amber-800/40 px-4 py-3 flex items-center gap-3">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Dari Lead</p>
                  <p className="text-[0.65rem] text-amber-600 dark:text-amber-500 truncate">
                    {project.lead_data_snapshot.title as string || project.lead_data_snapshot.contact_name as string || "—"}
                  </p>
                </div>
                {project.lead_id && (
                  <Link href={`/commercial/leads/${project.lead_id}`}>
                    <button className="text-[0.6rem] px-2 py-1 rounded border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors">
                      Lihat
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ TAB: DOKUMEN ════════════════ */}
      {tab === "dokumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT: Checklist Full ── */}
          <div className="space-y-4">
            {checklist.length === 0 ? (
              <Empty icon={ClipboardList} label="Belum ada checklist dokumen" />
            ) : (
              ["credentials", "development", "handover"].map((cat) => {
                const items = checklistByCat(cat)
                if (items.length === 0) return null
                const prog = catProgress(cat)
                const doneCnt = items.filter(c => c.status === "done").length
                return (
                  <div key={cat} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{CATEGORY_LABEL[cat]}</span>
                        <span className="text-xs font-semibold text-zinc-500">{doneCnt}/{items.length} · {prog}%</span>
                      </div>
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", prog === 100 ? "bg-emerald-500" : prog >= 50 ? "bg-blue-500" : "bg-zinc-300")}
                          style={{ width: `${prog}%` }} />
                      </div>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {items.map(item => {
                        const sc = CHECKLIST_STATUS[item.status] ?? CHECKLIST_STATUS.pending
                        return (
                          <div key={item.id} className="flex items-center px-4 py-2.5 gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {item.status === "done"
                                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                : item.status === "hold"
                                ? <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                : <Circle className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                              }
                              <div className="flex-1 min-w-0">
                                <span className={cn("text-xs", item.status === "done" ? "line-through text-zinc-400" : "text-zinc-700 dark:text-zinc-300")}>
                                  {item.item_name}
                                </span>
                                {item.completed_date && (
                                  <p className="text-[0.55rem] text-emerald-600 dark:text-emerald-400">✓ {item.completed_date}</p>
                                )}
                                {item.link_drive && (
                                  <a href={item.link_drive} target="_blank" rel="noopener noreferrer"
                                    className="text-[0.55rem] text-blue-500 hover:underline flex items-center gap-1">
                                    <LinkIcon className="w-2.5 h-2.5" /> Link Drive
                                  </a>
                                )}
                              </div>
                            </div>
                            <select
                              value={item.status}
                              disabled={updatingChecklist === item.id}
                              onChange={(e) => updateChecklistStatus(item.id, e.target.value)}
                              className={cn("text-[0.6rem] px-1.5 py-1 rounded font-medium border-0 cursor-pointer outline-none appearance-none shrink-0", sc.cls)}
                            >
                              {Object.entries(CHECKLIST_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}

            {/* Contacts full list + Add */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Kontak Klien</span>
                  {contacts.length > 0 && <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{contacts.length}</span>}
                </div>
                <button onClick={() => setShowAddContact(v => !v)}
                  className="flex items-center gap-1 text-[0.65rem] px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
                  <Plus className="w-3 h-3" /> Tambah
                </button>
              </div>

              {/* Add Contact Inline Form */}
              {showAddContact && (
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                  <p className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wide">Kontak Baru</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newContact.full_name} onChange={e => setNewContact(p => ({...p, full_name: e.target.value}))}
                      placeholder="Nama lengkap *" className="col-span-2 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    <input value={newContact.role} onChange={e => setNewContact(p => ({...p, role: e.target.value}))}
                      placeholder="Jabatan / Role" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    <input value={newContact.phone} onChange={e => setNewContact(p => ({...p, phone: e.target.value}))}
                      placeholder="No. HP" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    <input value={newContact.email} onChange={e => setNewContact(p => ({...p, email: e.target.value}))}
                      placeholder="Email" type="email" className="col-span-2 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={addContact} disabled={addingContact || !newContact.full_name.trim()}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50">
                      {addingContact ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Simpan
                    </button>
                    <button onClick={() => setShowAddContact(false)} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 transition-colors">
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {contacts.length === 0 && !showAddContact ? (
                <div className="px-4 py-6 text-center text-xs text-zinc-400">Belum ada kontak — klik Tambah untuk menambahkan</div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {contacts.map(c => (
                    <div key={c.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                        {c.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{c.full_name}</span>
                          {c.is_primary && <span className="text-[0.5rem] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">PIC</span>}
                          {c.role && <span className="text-xs text-zinc-400">{c.role}</span>}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {c.phone && (
                            <a href={`tel:${c.phone}`} className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300">
                              <Phone className="w-3 h-3" />{c.phone}
                            </a>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="text-xs text-zinc-500 flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300">
                              <Mail className="w-3 h-3" />{c.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Payment Terms ── */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Header + progress */}
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Payment Terms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paymentTerms.length > 0 && <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{paymentProgress}%</span>}
                    <button onClick={() => setShowAddPayment(v => !v)}
                      className="flex items-center gap-1 text-[0.65rem] px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
                      <Plus className="w-3 h-3" /> Termin
                    </button>
                  </div>
                </div>
                {paymentTerms.length > 0 && (
                  <>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", paymentProgress === 100 ? "bg-emerald-500" : "bg-blue-500")}
                        style={{ width: `${paymentProgress}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[0.6rem] text-zinc-400">
                      <span>Terbayar: {fmtIDR(paidNominal)}</span>
                      <span>Total: {fmtIDR(totalNominal)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Add Payment Term Inline Form */}
              {showAddPayment && (
                <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-2">
                  <p className="text-[0.65rem] font-semibold text-zinc-500 uppercase tracking-wide">Termin Baru</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newPayment.term_name} onChange={e => setNewPayment(p => ({...p, term_name: e.target.value}))}
                      placeholder="Nama termin (cth: Down Payment) *" className="col-span-2 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    <input value={newPayment.nominal} onChange={e => setNewPayment(p => ({...p, nominal: e.target.value}))}
                      type="number" placeholder="Nominal (Rp) *" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    <input value={newPayment.percentage} onChange={e => setNewPayment(p => ({...p, percentage: e.target.value}))}
                      type="number" placeholder="% (opsional)" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                    <input value={newPayment.due_date} onChange={e => setNewPayment(p => ({...p, due_date: e.target.value}))}
                      type="date" className="col-span-2 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={addPaymentTerm} disabled={addingPayment || !newPayment.term_name.trim() || !newPayment.nominal}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50">
                      {addingPayment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Simpan
                    </button>
                    <button onClick={() => setShowAddPayment(false)} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 transition-colors">
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {paymentTerms.length === 0 && !showAddPayment ? (
                <div className="px-4 py-6 text-center text-xs text-zinc-400">Belum ada payment terms — klik Termin untuk menambahkan</div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {paymentTerms.map((t, idx) => {
                    const ps = PAYMENT_STATUS[t.status] ?? PAYMENT_STATUS.pending
                    return (
                      <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[0.6rem] font-bold shrink-0 mt-0.5",
                          t.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800")}>{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t.term_name}</span>
                            <select
                              value={t.status}
                              disabled={updatingPayment === t.id}
                              onChange={(e) => updatePaymentStatus(t.id, e.target.value)}
                              className={cn("text-[0.6rem] px-1.5 py-1 rounded font-medium border-0 cursor-pointer outline-none appearance-none shrink-0", ps.cls)}
                            >
                              {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-zinc-400">
                            <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{fmtIDR(t.nominal)}</span>
                            {t.percentage ? <span>{t.percentage}%</span> : null}
                            {t.due_date && <span>· Jatuh tempo: {t.due_date}</span>}
                          </div>
                          {t.paid_date && (
                            <p className="text-[0.6rem] text-emerald-600 dark:text-emerald-400 mt-0.5">✓ Dibayar: {t.paid_date}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: MILESTONES ════════════════ */}
      {tab === "milestones" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-zinc-500">{completedMilestones} dari {milestones.length} milestone selesai</p>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              {milestones.length > 0 && (
                <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                  {(["timeline", "gantt"] as const).map(v => (
                    <button key={v} onClick={() => setMilestoneView(v)}
                      className={cn("px-2.5 py-1 rounded-md text-[0.65rem] font-medium transition-colors capitalize", milestoneView === v ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>
                      {v === "timeline" ? "📍 Timeline" : "📊 Gantt"}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowAddMilestone(v => !v)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Tambah Milestone
              </button>
            </div>
          </div>

          {/* Add Milestone Inline Form */}
          {showAddMilestone && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <Flag className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Milestone Baru</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input value={newMilestone.title} onChange={e => setNewMilestone(p => ({...p, title: e.target.value}))}
                    placeholder="Judul milestone *" className="sm:col-span-2 text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                  <input value={newMilestone.description} onChange={e => setNewMilestone(p => ({...p, description: e.target.value}))}
                    placeholder="Deskripsi (opsional)" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                  <input type="date" value={newMilestone.target_date} onChange={e => setNewMilestone(p => ({...p, target_date: e.target.value}))}
                    className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100" />
                  <select value={newMilestone.status} onChange={e => setNewMilestone(p => ({...p, status: e.target.value}))}
                    className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <label className="flex items-center gap-2 px-1 cursor-pointer">
                    <input type="checkbox" checked={newMilestone.is_payment_trigger} onChange={e => setNewMilestone(p => ({...p, is_payment_trigger: e.target.checked}))}
                      className="rounded accent-emerald-500" />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">Trigger Pembayaran</span>
                  </label>
                  {newMilestone.is_payment_trigger && (
                    <input type="number" min={0} max={100} value={newMilestone.payment_percent} onChange={e => setNewMilestone(p => ({...p, payment_percent: e.target.value}))}
                      placeholder="% pembayaran" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addMilestone} disabled={addingMilestone || !newMilestone.title.trim()}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50">
                    {addingMilestone ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Simpan
                  </button>
                  <button onClick={() => setShowAddMilestone(false)} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 transition-colors">
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {milestones.length === 0 ? (
            <Empty icon={Flag} label="Belum ada milestone" />
          ) : milestoneView === "timeline" ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-5 bottom-5 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div key={m.id} className="relative flex gap-4 pl-10">
                    {/* Dot */}
                    <div className={cn(
                      "absolute left-3.5 top-4 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-950 z-10",
                      m.status === "completed" ? "bg-emerald-500" :
                      m.status === "cancelled" ? "bg-red-400" :
                      idx === milestones.findIndex((x) => x.status !== "completed") ? "bg-blue-500" : "bg-zinc-300"
                    )} />
                    <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{m.title}</h3>
                            <select
                              value={m.status ?? "pending"}
                              disabled={updatingMilestone === m.id}
                              onChange={(e) => updateMilestoneStatus(m.id, e.target.value)}
                              className={cn("text-[0.6rem] px-1.5 py-0.5 rounded-full font-medium border-0 cursor-pointer outline-none appearance-none", MILESTONE_STATUS_STYLE[m.status ?? "pending"] ?? MILESTONE_STATUS_STYLE.pending)}
                            >
                              {["pending","in_progress","completed","cancelled"].map(s => (
                                <option key={s} value={s}>{s.replace("_"," ")}</option>
                              ))}
                            </select>
                            {m.is_payment_trigger && (
                              <span className="text-[0.6rem] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                                💰 Trigger Pembayaran {m.payment_percent}%
                              </span>
                            )}
                          </div>
                          {m.description && <p className="text-xs text-zinc-500 mt-1">{m.description}</p>}
                        </div>
                        <div className="shrink-0 flex items-start gap-2">
                          <div className="text-right">
                            {m.target_date && (
                              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{m.target_date}</p>
                            )}
                            {m.completed_at && (
                              <p className="text-[0.6rem] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                ✓ {new Date(m.completed_at).toLocaleDateString("id-ID")}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteMilestone(m.id)}
                            className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Hapus milestone"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (() => {
            // ── GANTT VIEW FOR MILESTONES ──────────────────────────────────
            const allDates = milestones.filter(m => m.target_date).map(m => m.target_date!)
            const projStart = project.kickoff_date || project.start_date || allDates[0] || new Date().toISOString().split("T")[0]
            const projEnd   = project.end_date || allDates[allDates.length - 1] || new Date().toISOString().split("T")[0]

            const startMs = new Date(projStart).getTime()
            const endMs   = new Date(projEnd).getTime()
            const totalMs = Math.max(endMs - startMs, 86400000 * 14) // min 2 weeks
            const today   = new Date().toISOString().split("T")[0]
            const todayPct = Math.max(0, Math.min(100, ((new Date(today).getTime() - startMs) / totalMs) * 100))

            // Build month headers (milestones span longer — use months)
            const months: { label: string; left: number }[] = []
            let cur = new Date(projStart)
            cur.setDate(1) // start of month
            while (cur.getTime() <= endMs + 86400000 * 32) {
              const pct = ((cur.getTime() - startMs) / totalMs) * 100
              if (pct >= -5 && pct <= 110) {
                months.push({ label: cur.toLocaleDateString("id-ID", { month: "short", year: "2-digit" }), left: pct })
              }
              cur.setMonth(cur.getMonth() + 1)
            }

            // Color config
            const milestoneColor: Record<string, string> = {
              pending:     "bg-zinc-400 dark:bg-zinc-500",
              in_progress: "bg-blue-500",
              completed:   "bg-emerald-500",
              cancelled:   "bg-red-400",
            }
            const milestoneBorder: Record<string, string> = {
              pending:     "border-zinc-400",
              in_progress: "border-blue-500",
              completed:   "border-emerald-500",
              cancelled:   "border-red-400",
            }

            return (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="flex">
                  {/* Left: milestone names */}
                  <div className="w-56 shrink-0 border-r border-zinc-100 dark:border-zinc-800">
                    <div className="h-9 border-b border-zinc-100 dark:border-zinc-800 px-4 flex items-center">
                      <span className="text-[0.65rem] font-semibold text-zinc-500">Milestone</span>
                    </div>
                    {milestones.map(m => (
                      <div key={m.id} className="h-14 border-b border-zinc-100 dark:border-zinc-800 px-4 flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", milestoneColor[m.status ?? "pending"] ?? milestoneColor.pending)} />
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-medium leading-tight">{m.title}</p>
                          {m.is_payment_trigger && (
                            <p className="text-[0.55rem] text-amber-600 dark:text-amber-400">💰 {m.payment_percent}%</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Center: Gantt markers - scrollable */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="min-w-[400px]">
                      {/* Month headers */}
                      <div className="h-9 border-b border-zinc-100 dark:border-zinc-800 relative bg-zinc-50/50 dark:bg-zinc-800/30">
                        {months.map((mo, i) => (
                          <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-200 dark:border-zinc-700 flex items-center" style={{ left: `${Math.max(0, mo.left)}%` }}>
                            <span className="text-[0.55rem] text-zinc-400 pl-1 whitespace-nowrap uppercase tracking-wide">{mo.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Milestone rows */}
                      <div className="relative">
                        {/* Today line */}
                        {todayPct > 0 && todayPct < 100 && (
                          <div className="absolute top-0 bottom-0 w-px bg-red-400/70 z-10 pointer-events-none" style={{ left: `${todayPct}%` }}>
                            <span className="absolute top-1 left-1 text-[0.5rem] text-red-400 font-medium whitespace-nowrap">Today</span>
                          </div>
                        )}
                        {/* Month grid lines */}
                        {months.map((mo, i) => (
                          <div key={i} className="absolute top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800" style={{ left: `${Math.max(0, mo.left)}%` }} />
                        ))}

                        {/* Milestone markers */}
                        {milestones.map(m => {
                          if (!m.target_date) {
                            return (
                              <div key={m.id} className="h-14 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-4">
                                <span className="text-[0.6rem] text-zinc-300 dark:text-zinc-700">Tanggal belum diset</span>
                              </div>
                            )
                          }
                          const pct = Math.max(0, Math.min(98, ((new Date(m.target_date).getTime() - startMs) / totalMs) * 100))
                          const isOverdue = m.target_date < today && m.status !== "completed" && m.status !== "cancelled"
                          const statusKey = m.status ?? "pending"
                          return (
                            <div key={m.id} className="h-14 border-b border-zinc-100 dark:border-zinc-800 relative flex items-center">
                              {/* Connector line from left to marker */}
                              <div
                                className={cn("absolute h-px opacity-20", isOverdue ? "bg-red-400" : milestoneBorder[statusKey] ? "bg-zinc-400" : "bg-zinc-300")}
                                style={{ left: "0%", width: `${pct}%` }}
                              />
                              {/* Diamond marker */}
                              <div
                                className="absolute z-10 flex flex-col items-center"
                                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                                title={`${m.title}: ${m.target_date}`}
                              >
                                {/* Diamond shape using rotated square */}
                                <div className={cn(
                                  "w-4 h-4 rotate-45 border-2 rounded-sm flex items-center justify-center",
                                  isOverdue ? "bg-red-100 border-red-400 dark:bg-red-900/30" :
                                  m.status === "completed" ? "bg-emerald-100 border-emerald-500 dark:bg-emerald-900/30" :
                                  m.status === "in_progress" ? "bg-blue-100 border-blue-500 dark:bg-blue-900/30" :
                                  m.status === "cancelled" ? "bg-red-100 border-red-400 dark:bg-red-900/30" :
                                  "bg-white border-zinc-400 dark:bg-zinc-800 dark:border-zinc-500"
                                )}>
                                  {m.status === "completed" && (
                                    <div className="w-2 h-2 -rotate-45 flex items-center justify-center">
                                      <span className="text-[0.45rem] text-emerald-600">✓</span>
                                    </div>
                                  )}
                                </div>
                                {/* Date label */}
                                <span className={cn(
                                  "mt-1.5 text-[0.5rem] font-medium whitespace-nowrap",
                                  isOverdue ? "text-red-500" :
                                  m.status === "completed" ? "text-emerald-600 dark:text-emerald-400" :
                                  "text-zinc-400"
                                )}>
                                  {new Date(m.target_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: target date + status */}
                  <div className="w-36 shrink-0 border-l border-zinc-100 dark:border-zinc-800 hidden md:block">
                    <div className="h-9 border-b border-zinc-100 dark:border-zinc-800 px-3 flex items-center">
                      <span className="text-[0.65rem] font-semibold text-zinc-500">Target</span>
                    </div>
                    {milestones.map(m => (
                      <div key={m.id} className="h-14 border-b border-zinc-100 dark:border-zinc-800 px-3 flex flex-col justify-center gap-0.5">
                        <span className="text-[0.6rem] text-zinc-500 font-medium">{m.target_date ?? "—"}</span>
                        <span className={cn("text-[0.55rem] px-1.5 py-0.5 rounded-full font-medium w-fit", MILESTONE_STATUS_STYLE[m.status ?? "pending"] ?? MILESTONE_STATUS_STYLE.pending)}>
                          {m.status ?? "pending"}
                        </span>
                        {m.completed_at && (
                          <span className="text-[0.55rem] text-emerald-600 dark:text-emerald-400">
                            ✓ {new Date(m.completed_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 flex-wrap bg-zinc-50/50 dark:bg-zinc-800/20">
                  {[
                    { cls: "border-zinc-400 bg-white dark:bg-zinc-800", l: "Pending" },
                    { cls: "border-blue-500 bg-blue-100 dark:bg-blue-900/30", l: "In Progress" },
                    { cls: "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30", l: "Completed" },
                    { cls: "border-red-400 bg-red-100 dark:bg-red-900/30", l: "Overdue / Cancelled" },
                  ].map(({ cls, l }) => (
                    <div key={l} className="flex items-center gap-1.5">
                      <div className={cn("w-3 h-3 rotate-45 border-2 rounded-[2px]", cls)} />
                      <span className="text-[0.6rem] text-zinc-400">{l}</span>
                    </div>
                  ))}
                  <span className="ml-auto text-[0.6rem] text-zinc-400 whitespace-nowrap">{projStart} → {projEnd}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ════════════════ TAB: TASKS ════════════════ */}
      {tab === "tasks" && (
        <div className="space-y-3">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {/* Progress summary */}
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${taskProgress}%` }} />
                </div>
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">{taskProgress}%</span>
                <span className="text-xs text-zinc-400">{completedTasks}/{tasks.length}</span>
              </div>
              {/* Status counts */}
              <div className="hidden sm:flex items-center gap-2">
                {[
                  { s: "todo",        label: "Todo",      c: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
                  { s: "in_progress", label: "In Progress", c: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
                  { s: "review",      label: "Review",    c: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
                  { s: "done",        label: "Done",      c: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
                ].map(({ s, label, c }) => {
                  const n = tasks.filter(t => t.status === s).length
                  if (n === 0) return null
                  return <span key={s} className={cn("text-[0.6rem] px-1.5 py-0.5 rounded-full font-medium", c)}>{n} {label}</span>
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
                {(["list","kanban","gantt"] as const).map(v => (
                  <button key={v} onClick={() => setTaskView(v)}
                    className={cn("px-2.5 py-1 rounded-md text-[0.65rem] font-medium transition-colors capitalize", taskView === v ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>
                    {v === "list" ? "📋 List" : v === "kanban" ? "🗂 Kanban" : "📊 Gantt"}
                  </button>
                ))}
              </div>
              <Link href={`/projects/${id}/tasks/new`}>
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Task
                </button>
              </Link>
            </div>
          </div>

          {tasks.length === 0 ? (
            <Empty icon={CheckSquare} label="Belum ada task" />
          ) : (
            <>
              {/* ── LIST VIEW ── */}
              {taskView === "list" && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                        <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Task</th>
                        <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden sm:table-cell">Assignee</th>
                        <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Status</th>
                        <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden md:table-cell">Due</th>
                        <th className="text-right py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden md:table-cell">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((t) => (
                        <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full shrink-0 mt-0.5", { low:"bg-zinc-300", medium:"bg-amber-400", high:"bg-orange-500", urgent:"bg-red-500" }[t.priority ?? ""] ?? "bg-zinc-200")} />
                              <div>
                                <Link href={`/projects/${id}/tasks/${t.id}/edit`} className="text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:text-emerald-600">{t.title}</Link>
                                {t.task_code && <p className="text-[0.55rem] text-zinc-400 font-mono">{t.task_code}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-zinc-500 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              {t.assigned_to && <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[0.55rem] font-bold text-zinc-500">{userName(t.assigned_to)[0]}</div>}
                              <span>{userName(t.assigned_to)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select value={t.status ?? "todo"} disabled={updatingTask === t.id}
                              onChange={e => updateTaskStatus(t.id, e.target.value)}
                              className={cn("text-[0.6rem] px-1.5 py-0.5 rounded-full font-medium border-0 cursor-pointer outline-none appearance-none", TASK_STATUS_STYLE[t.status ?? "todo"] ?? TASK_STATUS_STYLE.todo)}>
                              {["todo","in_progress","review","done","cancelled"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                            </select>
                          </td>
                          <td className="py-3 px-4 text-xs text-zinc-500 hidden md:table-cell">
                            {t.due_date ? <span className={cn(new Date(t.due_date) < new Date() && t.status !== "done" ? "text-red-500 font-medium" : "")}>{t.due_date}</span> : "—"}
                          </td>
                          <td className="py-3 px-4 text-right hidden md:table-cell">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.progress_percent ?? 0}%` }} />
                              </div>
                              <span className="text-[0.6rem] text-zinc-500 w-7">{t.progress_percent ?? 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── KANBAN VIEW ── */}
              {taskView === "kanban" && (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {[
                    { key: "todo",        label: "Todo",        color: "border-zinc-300 dark:border-zinc-600",   dot: "bg-zinc-400",   header: "bg-zinc-50 dark:bg-zinc-800/50" },
                    { key: "in_progress", label: "In Progress", color: "border-blue-300 dark:border-blue-600/50", dot: "bg-blue-500",   header: "bg-blue-50 dark:bg-blue-900/20" },
                    { key: "review",      label: "Review",      color: "border-amber-300 dark:border-amber-600/50",dot: "bg-amber-400", header: "bg-amber-50 dark:bg-amber-900/20" },
                    { key: "done",        label: "Done",        color: "border-emerald-300 dark:border-emerald-600/50", dot: "bg-emerald-500", header: "bg-emerald-50 dark:bg-emerald-900/20" },
                  ].map(({ key, label, color, dot, header }) => {
                    const colTasks = tasks.filter(t => (t.status ?? "todo") === key)
                    return (
                      <div key={key} className={cn("flex-none w-64 rounded-xl border-2 overflow-hidden", color)}>
                        {/* Column header */}
                        <div className={cn("px-3 py-2.5 flex items-center justify-between", header)}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", dot)} />
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
                          </div>
                          <span className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-zinc-900/60 text-zinc-500 font-medium">{colTasks.length}</span>
                        </div>

                        {/* Cards */}
                        <div className="p-2 space-y-2 min-h-[120px]">
                          {colTasks.map(t => {
                            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && key !== "done"
                            const nextStatus: Record<string, string> = { todo: "in_progress", in_progress: "review", review: "done", done: "todo" }
                            return (
                              <div key={t.id} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 group hover:shadow-sm transition-shadow cursor-default">
                                {/* Priority + title */}
                                <div className="flex items-start gap-2 mb-2">
                                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1.5", { low:"bg-zinc-300", medium:"bg-amber-400", high:"bg-orange-500", urgent:"bg-red-500" }[t.priority ?? ""] ?? "bg-zinc-200")} />
                                  <Link href={`/projects/${id}/tasks/${t.id}/edit`}
                                    className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 leading-snug line-clamp-2">
                                    {t.title}
                                  </Link>
                                </div>
                                {/* Tags */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                                  {t.task_code && <span className="text-[0.5rem] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{t.task_code}</span>}
                                  {t.priority && t.priority !== "low" && (
                                    <span className={cn("text-[0.5rem] px-1 py-0.5 rounded font-medium", { medium:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", high:"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", urgent:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }[t.priority] ?? "")}>
                                      {t.priority}
                                    </span>
                                  )}
                                </div>
                                {/* Progress bar */}
                                {(t.progress_percent ?? 0) > 0 && (
                                  <div className="mb-2.5">
                                    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.progress_percent}%` }} />
                                    </div>
                                  </div>
                                )}
                                {/* Footer: assignee + due date */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    {t.assigned_to && (
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[0.5rem] font-bold text-emerald-600 dark:text-emerald-400">
                                        {userName(t.assigned_to)[0]}
                                      </div>
                                    )}
                                    <span className="text-[0.6rem] text-zinc-400">{t.assigned_to ? userName(t.assigned_to).split(" ")[0] : "Unassigned"}</span>
                                  </div>
                                  {t.due_date && (
                                    <span className={cn("text-[0.6rem] font-medium", isOverdue ? "text-red-500" : "text-zinc-400")}>
                                      {isOverdue ? "⚠ " : ""}{t.due_date}
                                    </span>
                                  )}
                                </div>
                                {/* Move button */}
                                {key !== "done" && (
                                  <button
                                    onClick={() => updateTaskStatus(t.id, nextStatus[key])}
                                    disabled={updatingTask === t.id}
                                    className="mt-2 w-full text-[0.6rem] py-1 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-400 transition-colors opacity-0 group-hover:opacity-100">
                                    {updatingTask === t.id ? "..." : `→ ${{ todo:"In Progress", in_progress:"Review", review:"Done" }[key]}`}
                                  </button>
                                )}
                              </div>
                            )
                          })}
                          {colTasks.length === 0 && (
                            <p className="text-center text-[0.65rem] text-zinc-300 dark:text-zinc-700 py-6">Tidak ada task</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── GANTT VIEW ── */}
              {taskView === "gantt" && (() => {
                // Compute date range
                const projStart = project.kickoff_date || project.start_date || tasks.reduce((min, t) => t.start_date && t.start_date < min ? t.start_date : min, tasks[0]?.start_date ?? new Date().toISOString().split("T")[0])
                const projEnd   = project.end_date || tasks.reduce((max, t) => t.due_date && t.due_date > max ? t.due_date : max, tasks[0]?.due_date ?? new Date().toISOString().split("T")[0])

                const startMs = new Date(projStart).getTime()
                const endMs   = new Date(projEnd).getTime()
                const totalMs = Math.max(endMs - startMs, 86400000 * 7) // min 7 days
                const today   = new Date().toISOString().split("T")[0]
                const todayPct = Math.max(0, Math.min(100, ((new Date(today).getTime() - startMs) / totalMs) * 100))

                // Build week headers
                const weeks: { label: string; left: number }[] = []
                let cur = new Date(projStart)
                cur.setDate(cur.getDate() - cur.getDay() + 1) // Monday
                while (cur.getTime() <= endMs + 86400000 * 7) {
                  const pct = ((cur.getTime() - startMs) / totalMs) * 100
                  if (pct >= -5 && pct <= 105) {
                    weeks.push({ label: cur.toLocaleDateString("id-ID", { day: "numeric", month: "short" }), left: pct })
                  }
                  cur.setDate(cur.getDate() + 7)
                }

                const taskBar = (t: Task) => {
                  const s = t.start_date ?? (projStart)
                  const e = t.due_date ?? (projEnd)
                  const left = Math.max(0, ((new Date(s).getTime() - startMs) / totalMs) * 100)
                  const right = Math.min(100, ((new Date(e).getTime() - startMs) / totalMs) * 100)
                  const width = Math.max(right - left, 1)
                  const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
                  const barColor = t.status === "done" ? "bg-emerald-500" : t.status === "in_progress" ? "bg-blue-500" : t.status === "review" ? "bg-amber-400" : isOverdue ? "bg-red-400" : "bg-zinc-300 dark:bg-zinc-600"
                  return { left, width, barColor, isOverdue }
                }

                return (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="flex">
                      {/* Left: task names */}
                      <div className="w-52 shrink-0 border-r border-zinc-100 dark:border-zinc-800">
                        {/* Header */}
                        <div className="h-9 border-b border-zinc-100 dark:border-zinc-800 px-4 flex items-center">
                          <span className="text-[0.65rem] font-semibold text-zinc-500">Task</span>
                        </div>
                        {/* Rows */}
                        {tasks.map(t => (
                          <div key={t.id} className="h-11 border-b border-zinc-100 dark:border-zinc-800 px-4 flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", { low:"bg-zinc-300", medium:"bg-amber-400", high:"bg-orange-500", urgent:"bg-red-500" }[t.priority ?? ""] ?? "bg-zinc-200")} />
                            <Link href={`/projects/${id}/tasks/${t.id}/edit`} className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 truncate">{t.title}</Link>
                          </div>
                        ))}
                      </div>

                      {/* Right: Gantt bars - scrollable */}
                      <div className="flex-1 overflow-x-auto">
                        <div className="min-w-[500px]">
                          {/* Week headers */}
                          <div className="h-9 border-b border-zinc-100 dark:border-zinc-800 relative bg-zinc-50/50 dark:bg-zinc-800/30">
                            {weeks.map((w, i) => (
                              <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-200 dark:border-zinc-700 flex items-center" style={{ left: `${Math.max(0, w.left)}%` }}>
                                <span className="text-[0.55rem] text-zinc-400 pl-1 whitespace-nowrap">{w.label}</span>
                              </div>
                            ))}
                          </div>
                          {/* Task rows */}
                          <div className="relative">
                            {/* Today line */}
                            {todayPct > 0 && todayPct < 100 && (
                              <div className="absolute top-0 bottom-0 w-px bg-red-400/70 z-10 pointer-events-none" style={{ left: `${todayPct}%` }}>
                                <span className="absolute -top-0 left-1 text-[0.5rem] text-red-400 font-medium whitespace-nowrap">Today</span>
                              </div>
                            )}
                            {/* Week grid lines */}
                            {weeks.map((w, i) => (
                              <div key={i} className="absolute top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800" style={{ left: `${Math.max(0, w.left)}%` }} />
                            ))}
                            {/* Bars */}
                            {tasks.map(t => {
                              const { left, width, barColor, isOverdue } = taskBar(t)
                              const assigneeName = t.assigned_to ? userName(t.assigned_to).split(" ")[0] : ""
                              return (
                                <div key={t.id} className="h-11 border-b border-zinc-100 dark:border-zinc-800 flex items-center px-2 relative">
                                  <div
                                    className={cn("absolute h-6 rounded-md flex items-center px-2 cursor-pointer hover:brightness-105 transition-all group/bar", barColor)}
                                    style={{ left: `${left}%`, width: `${width}%`, minWidth: "8px" }}
                                    title={`${t.title}: ${t.start_date ?? "?"} → ${t.due_date ?? "?"}`}
                                  >
                                    {width > 8 && (
                                      <span className="text-[0.55rem] text-white font-medium truncate select-none">
                                        {assigneeName ? `${assigneeName} · ` : ""}{t.progress_percent ?? 0}%
                                      </span>
                                    )}
                                    {/* Progress overlay */}
                                    {(t.progress_percent ?? 0) > 0 && (
                                      <div className="absolute inset-0 rounded-md bg-white/20 dark:bg-black/20" style={{ width: `${t.progress_percent}%` }} />
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: assignee column */}
                      <div className="w-28 shrink-0 border-l border-zinc-100 dark:border-zinc-800 hidden md:block">
                        <div className="h-9 border-b border-zinc-100 dark:border-zinc-800 px-3 flex items-center">
                          <span className="text-[0.65rem] font-semibold text-zinc-500">Assignee</span>
                        </div>
                        {tasks.map(t => (
                          <div key={t.id} className="h-11 border-b border-zinc-100 dark:border-zinc-800 px-3 flex items-center gap-1.5">
                            {t.assigned_to && <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[0.5rem] font-bold text-zinc-500 shrink-0">{userName(t.assigned_to)[0]}</div>}
                            <span className="text-[0.6rem] text-zinc-400 truncate">{t.assigned_to ? userName(t.assigned_to).split(" ")[0] : "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
                      {[
                        { c: "bg-zinc-300 dark:bg-zinc-600", l: "Todo" },
                        { c: "bg-blue-500", l: "In Progress" },
                        { c: "bg-amber-400", l: "Review" },
                        { c: "bg-emerald-500", l: "Done" },
                        { c: "bg-red-400", l: "Overdue" },
                      ].map(({ c, l }) => (
                        <div key={l} className="flex items-center gap-1.5">
                          <div className={cn("w-3 h-3 rounded-sm", c)} />
                          <span className="text-[0.6rem] text-zinc-400">{l}</span>
                        </div>
                      ))}
                      <span className="ml-auto text-[0.6rem] text-zinc-400">{projStart} → {projEnd}</span>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>
      )}

      {/* ════════════════ TAB: TIM ════════════════ */}
      {tab === "tim" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">{members.length} anggota tim</p>
            <button
              onClick={() => setShowAddMember(v => !v)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-emerald-600 hover:border-emerald-400 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Tambah Anggota
            </button>
          </div>

          {/* Add Member Inline Form */}
          {showAddMember && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Tambah Anggota Tim</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select value={newMember.user_profile_id} onChange={e => setNewMember(p => ({...p, user_profile_id: e.target.value}))}
                    className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100">
                    <option value="">— Pilih anggota *</option>
                    {users.filter(u => !members.find(m => m.user_profile_id === u.id)).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}{u.employee_number ? ` (${u.employee_number})` : ""}
                      </option>
                    ))}
                  </select>
                  <input value={newMember.role} onChange={e => setNewMember(p => ({...p, role: e.target.value}))}
                    placeholder="Role (cth: Developer, QA)" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                  <input type="number" min={1} max={100} value={newMember.allocation_percent} onChange={e => setNewMember(p => ({...p, allocation_percent: e.target.value}))}
                    placeholder="Alokasi (%)" className="text-xs px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-emerald-400 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addMember} disabled={addingMember || !newMember.user_profile_id}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50">
                    {addingMember ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Tambahkan
                  </button>
                  <button onClick={() => setShowAddMember(false)} className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-700 transition-colors">
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          {members.length === 0 ? (
            <Empty icon={Users} label="Belum ada anggota tim" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => {
                const u = users.find((u) => u.id === m.user_profile_id)
                return (
                  <div key={m.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {(u?.full_name ?? "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{u?.full_name ?? "—"}</p>
                        {u?.employee_number && <p className="text-[0.6rem] text-zinc-400 font-mono">{u.employee_number}</p>}
                        {m.role && (
                          <span className="inline-block mt-1 text-[0.6rem] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium">
                            {m.role}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeMember(m.id)}
                        className="p-1 rounded text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0"
                        title="Keluarkan dari tim"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {m.allocation_percent !== null && (
                        <div>
                          <p className="text-[0.55rem] text-zinc-400">Alokasi</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${m.allocation_percent}%` }} />
                            </div>
                            <span className="text-[0.6rem] font-bold text-zinc-600 dark:text-zinc-400">{m.allocation_percent}%</span>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-[0.55rem] text-zinc-400">Status</p>
                        <span className={cn("text-[0.6rem] font-medium", m.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>
                          {m.is_active ? "● Aktif" : "○ Tidak aktif"}
                        </span>
                      </div>
                    </div>
                    {m.joined_at && (
                      <p className="text-[0.55rem] text-zinc-400 mt-2">
                        Bergabung {new Date(m.joined_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ TAB: BRIEF ════════════════ */}
      {tab === "brief" && (
        <div className="space-y-5">
          {/* Lead origin banner */}
          {project.lead_id ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/40">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Proyek ini dibuat dari Lead</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">Data di bawah adalah snapshot dari data lead saat konversi</p>
              </div>
              <Link href={`/commercial/leads/${project.lead_id}`}>
                <button className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors">
                  Buka Lead →
                </button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-zinc-400">Proyek ini tidak dibuat dari Lead (dibuat manual)</div>
          )}

          {/* Lead data snapshot */}
          {project.lead_data_snapshot && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Data Lead</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {Object.entries(project.lead_data_snapshot).filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                  <div key={k} className="flex gap-4 px-4 py-2.5">
                    <span className="text-xs text-zinc-400 w-40 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 flex-1">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MOM snapshot */}
          {project.mom_snapshot && Array.isArray(project.mom_snapshot) && project.mom_snapshot.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Minute of Meeting (dari Lead)</span>
              </div>
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(project.mom_snapshot as Record<string, unknown>[]).map((mom, i) => (
                  <div key={i} className="px-4 py-3">
                    <pre className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-sans">{JSON.stringify(mom, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost analysis snapshot */}
          {project.cost_analysis_snapshot && Array.isArray(project.cost_analysis_snapshot) && project.cost_analysis_snapshot.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Cost Analysis (dari Lead)</span>
              </div>
              <div className="p-4">
                <pre className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap font-sans overflow-x-auto">{JSON.stringify(project.cost_analysis_snapshot, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ TAB: MANPOWER ════════════════ */}
      {tab === "manpower" && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">{manpower.length} item manpower dari raw calculator</p>

          {manpower.length === 0 ? (
            <Empty icon={Layers} label="Belum ada data manpower" />
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <th className="text-left py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Role</th>
                    <th className="text-center py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Qty</th>
                    <th className="text-center py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">Bulan</th>
                    <th className="text-right py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500">HPP/bln</th>
                    <th className="text-right py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden md:table-cell">Publish/bln</th>
                    <th className="text-right py-2.5 px-4 text-[0.65rem] font-semibold text-zinc-500 hidden md:table-cell">Total HPP</th>
                  </tr>
                </thead>
                <tbody>
                  {manpower.map((mp) => {
                    const totalHpp = (mp.hpp_rate ?? 0) * (mp.qty ?? 1) * (mp.months ?? 1)
                    return (
                      <tr key={mp.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                        <td className="py-3 px-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{mp.role_name}</td>
                        <td className="py-3 px-4 text-xs text-center text-zinc-600 dark:text-zinc-400">{mp.qty ?? 1}</td>
                        <td className="py-3 px-4 text-xs text-center text-zinc-600 dark:text-zinc-400">{mp.months ?? 1}</td>
                        <td className="py-3 px-4 text-xs text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                          {mp.hpp_rate ? fmtIDR(mp.hpp_rate) : "—"}
                        </td>
                        <td className="py-3 px-4 text-xs text-right tabular-nums text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                          {mp.publish_rate ? fmtIDR(mp.publish_rate) : "—"}
                        </td>
                        <td className="py-3 px-4 text-xs text-right tabular-nums font-semibold text-zinc-900 dark:text-zinc-100 hidden md:table-cell">
                          {totalHpp > 0 ? fmtIDR(totalHpp) : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {manpower.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/20">
                      <td colSpan={5} className="py-2.5 px-4 text-xs font-semibold text-zinc-500 hidden md:table-cell">Total</td>
                      <td className="py-2.5 px-4 text-xs text-right font-bold text-emerald-600 dark:text-emerald-400 hidden md:table-cell">
                        {fmtIDR(manpower.reduce((s, mp) => s + (mp.hpp_rate ?? 0) * (mp.qty ?? 1) * (mp.months ?? 1), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ TAB: KOMENTAR ════════════════ */}
      {tab === "komentar" && (
        <div className="space-y-4">
          {/* Thread */}
          {comments.length === 0 ? (
            <Empty icon={MessageSquare} label="Belum ada komentar" />
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[0.65rem] font-bold text-zinc-500">
                      {(userName(c.author_id) || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{userName(c.author_id)}</span>
                      <span className="text-[0.6rem] text-zinc-400">{relativeDate(c.created_at)}</span>
                    </div>
                    {c.content && <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{c.content}</p>}
                    {c.file_url && (
                      <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[0.65rem] text-blue-500 hover:underline">
                        <FileText className="w-3 h-3" /> {c.file_name ?? "Lampiran"}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input komentar baru */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) postComment() }}
              rows={3}
              placeholder="Tulis komentar... (Ctrl+Enter untuk kirim)"
              className="w-full text-sm bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
            />
            <div className="flex items-center justify-end mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={postComment}
                disabled={!newComment.trim() || postingComment}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                {postingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Empty state helper ────────────────────────────────────────────────────
function Empty({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-zinc-200 dark:text-zinc-700 mb-3" />
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  )
}
