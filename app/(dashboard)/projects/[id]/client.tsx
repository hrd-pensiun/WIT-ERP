"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Edit3, Users, Plus, Trash2, User, Building2, Calendar, DollarSign, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { insForge } from "@/lib/insforge"
import { fmtIDR } from "@/lib/commercial-data"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  quotation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  won: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  delivery: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
}

const HEALTH_STYLES: Record<string, string> = {
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
}

export default function ProjectDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [newMemberUserId, setNewMemberUserId] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("")
  const [addingMember, setAddingMember] = useState(false)

  const fetchProject = useCallback(async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from("commercial_projects")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .single()
      if (error) throw error
      setProject(data)
    } catch (err) {
      console.error("Failed to fetch project:", err)
    } finally {
      setLoading(false)
    }
  }, [id])

  const fetchTeamMembers = useCallback(async () => {
    if (!insForge) return
    try {
      const { data } = await insForge
        .from("project_team_members")
        .select("*")
        .eq("project_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
      if (data) setTeamMembers(data)
    } catch { /* ignore */ }
  }, [id])

  const fetchUsers = useCallback(async () => {
    if (!insForge) return
    try {
      const { data } = await insForge
        .from("user_profiles")
        .select("id, full_name, employee_number")
        .is("deleted_at", null)
        .order("full_name", { ascending: true })
      if (data) setUsers(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchProject()
    fetchTeamMembers()
    fetchUsers()
  }, [fetchProject, fetchTeamMembers, fetchUsers])

  const userName = (id: string | null) => {
    if (!id) return "—"
    const u = users.find((u) => u.id === id)
    return u ? u.full_name : "—"
  }

  const handleAddMember = async () => {
    if (!insForge || !newMemberUserId) return
    setAddingMember(true)
    try {
      const { data, error } = await insForge.from("project_team_members").insert({
        project_id: id,
        user_profile_id: newMemberUserId,
        role: newMemberRole || "Member",
      }).select().single()
      if (error) throw error
      if (data) setTeamMembers((prev) => [...prev, data])
      setNewMemberUserId("")
      setNewMemberRole("")
      setTeamDialogOpen(false)
    } catch (err) {
      console.error("Failed to add team member:", err)
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!insForge) return
    try {
      await insForge.from("project_team_members").update({ deleted_at: new Date().toISOString() }).eq("id", memberId)
      setTeamMembers((prev) => prev.filter((m) => m.id !== memberId))
    } catch (err) {
      console.error("Failed to remove team member:", err)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project tidak ditemukan</p>
        <Link href="/projects"><Button variant="outline" className="mt-4">Kembali ke Projects</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{project.project_name}</h1>
              <Badge className={STATUS_STYLES[project.status] || ""}>{project.status}</Badge>
              {project.health && (
                <Badge className={HEALTH_STYLES[project.health] || ""}>{project.health}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{project.project_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-blue-500/30 text-blue-400 gap-1.5" onClick={() => setTeamDialogOpen(true)}>
            <Users className="w-4 h-4" /> Team
          </Button>
          <Button variant="outline" className="border-border gap-1.5" onClick={() => router.push(`/projects/${id}/edit`)}>
            <Edit3 className="w-4 h-4" /> Edit
          </Button>
        </div>
      </div>

      {/* ─── PROJECT INFO CARDS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">PERUSAHAAN</p>
            </div>
            <p className="text-sm font-medium text-foreground">{project.company_name || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">KLIEN</p>
            </div>
            <p className="text-sm font-medium text-foreground">{project.client_name || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">NILAI PO</p>
            </div>
            <p className="text-sm font-medium text-foreground font-mono">{project.po_value > 0 ? fmtIDR(project.po_value) : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">TERM OF PAYMENT</p>
            </div>
            <p className="text-sm font-medium text-foreground">{project.term_of_payment || "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── SECOND ROW: PIC + DATES ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider mb-2">PIC COMMERCIAL</p>
            <p className="text-sm font-medium text-foreground">{userName(project.pic_commercial_id)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider mb-2">PIC ADM</p>
            <p className="text-sm font-medium text-foreground">{userName(project.pic_adm_id)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider mb-2">PROJECT MANAGER</p>
            <p className="text-sm font-medium text-foreground">{userName(project.pm_id)}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── DATES ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">START KICK OFF</p>
            </div>
            <p className="text-sm font-medium text-foreground">{project.start_date || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">END OF PROJECT</p>
            </div>
            <p className="text-sm font-medium text-foreground">{project.end_date || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[0.55rem] text-muted-foreground font-semibold tracking-wider">TYPE</p>
            </div>
            <p className="text-sm font-medium text-foreground">{project.project_type || "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── FINANCIAL SUMMARY ─── */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-[0.5rem] text-muted-foreground">TOTAL HPP</p>
              <p className="text-sm font-bold text-foreground">{project.total_hpp > 0 ? fmtIDR(project.total_hpp) : "—"}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-[0.5rem] text-muted-foreground">TOTAL PUBLISH</p>
              <p className="text-sm font-bold text-foreground">{project.total_publish > 0 ? fmtIDR(project.total_publish) : "—"}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-[0.5rem] text-muted-foreground">GRAND TOTAL</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{project.grand_total > 0 ? fmtIDR(project.grand_total) : "—"}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-[0.5rem] text-muted-foreground">MARGIN</p>
              <p className="text-sm font-bold text-foreground">{project.margin_pct > 0 ? `${project.margin_pct.toFixed(1)}%` : "—"}</p>
            </div>
          </div>
          {project.quotation_publish > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                <p className="text-[0.5rem] text-muted-foreground">QUOTATION PUBLISH</p>
                <p className="text-sm font-bold text-foreground">{fmtIDR(project.quotation_publish)}</p>
              </div>
              {project.actual_deal > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <p className="text-[0.5rem] text-muted-foreground">ACTUAL DEAL</p>
                  <p className="text-sm font-bold text-orange-500">{fmtIDR(project.actual_deal)}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── TEAM MEMBERS ─── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Team Members ({teamMembers.length})</h3>
            <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-400 gap-1" onClick={() => setTeamDialogOpen(true)}>
              <Plus className="w-3 h-3" /> Add Member
            </Button>
          </div>
          {teamMembers.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Belum ada team member.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{userName(member.user_profile_id)}</p>
                      <p className="text-[0.5rem] text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── LEAD DATA SNAPSHOTS ─── */}
      {project.lead_data_snapshot && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Lead Data (Snapshot — diambil saat konversi)</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Lead ID:</span> {project.lead_id || "—"}</p>
              <p><span className="font-medium text-foreground">Lead Number:</span> {project.lead_data_snapshot?.lead_number || "—"}</p>
              <p><span className="font-medium text-foreground">Status Lead:</span> {project.lead_data_snapshot?.status || "—"}</p>
              <p><span className="font-medium text-foreground">Estimated Value:</span> {project.lead_data_snapshot?.estimated_value ? fmtIDR(project.lead_data_snapshot.estimated_value) : "—"}</p>
              {project.lead_data_snapshot?.notes && (
                <p><span className="font-medium text-foreground">Catatan Lead:</span> {project.lead_data_snapshot.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── MOM SNAPSHOT ─── */}
      {project.mom_snapshot && Array.isArray(project.mom_snapshot) && project.mom_snapshot.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Minutes of Meeting ({project.mom_snapshot.length})</h3>
            <div className="space-y-2">
              {project.mom_snapshot.map((mom: any, idx: number) => (
                <div key={mom.id || idx} className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground">{mom.title || "MoM"}</p>
                    {mom.meeting_date && <p className="text-[0.5rem] text-muted-foreground">{mom.meeting_date}</p>}
                  </div>
                  {mom.participants && <p className="text-[0.5rem] text-muted-foreground mb-1">Participants: {mom.participants}</p>}
                  {mom.notes && <p className="text-[0.5rem] text-muted-foreground line-clamp-2">{mom.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── COST ANALYSIS SNAPSHOT ─── */}
      {project.cost_analysis_snapshot && Array.isArray(project.cost_analysis_snapshot) && project.cost_analysis_snapshot.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Cost Analysis ({project.cost_analysis_snapshot.length})</h3>
            <div className="space-y-2">
              {project.cost_analysis_snapshot.map((ca: any, idx: number) => (
                <div key={ca.id || idx} className="p-3 rounded-lg border border-border bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-foreground">Analysis #{idx + 1}</p>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[0.5rem]">{ca.scheme_type || "—"}</Badge>
                  </div>
                  {ca.grand_total > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <div><p className="text-[0.45rem] text-muted-foreground">HPP</p><p className="text-[0.55rem] font-medium text-foreground">{fmtIDR(ca.manpower_total_hpp || ca.grand_total)}</p></div>
                      <div><p className="text-[0.45rem] text-muted-foreground">Publish</p><p className="text-[0.55rem] font-medium text-foreground">{fmtIDR(ca.manpower_total_publish || ca.grand_total)}</p></div>
                      <div><p className="text-[0.45rem] text-muted-foreground">Grand Total</p><p className="text-[0.55rem] font-medium text-emerald-500">{fmtIDR(ca.grand_total || ca.manpower_total_publish)}</p></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── SUMMARY SNAPSHOT ─── */}
      {project.summary_snapshot && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quotation Summary (Snapshot)</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium text-foreground">Total Amount:</span> {project.summary_snapshot.total_amount ? fmtIDR(project.summary_snapshot.total_amount) : "—"}</p>
              {project.summary_snapshot.notes && <p><span className="font-medium text-foreground">Notes:</span> {project.summary_snapshot.notes}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── NOTES ─── */}
      {project.notes && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Catatan</h3>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{project.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* ─── ADD MEMBER DIALOG ─── */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5 text-blue-500" /> Tambah Team Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Member <span className="text-red-500">*</span></Label>
              <Select value={newMemberUserId} onValueChange={setNewMemberUserId}>
                <SelectTrigger className="bg-background border-border text-sm h-9">
                  <SelectValue placeholder="Pilih member" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter((u) => !teamMembers.find((m) => m.user_profile_id === u.id)).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name}{u.employee_number ? ` (${u.employee_number})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Input value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} placeholder="Developer, Analyst, etc." className="bg-background border-border text-sm h-9" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setTeamDialogOpen(false)} className="text-xs h-9">Batal</Button>
              <Button onClick={handleAddMember} disabled={!newMemberUserId || addingMember} className="bg-blue-600 hover:bg-blue-700 text-xs h-9 gap-1.5">
                {addingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Tambah
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
