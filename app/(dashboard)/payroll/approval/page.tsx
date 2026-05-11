"use client"

import { useState, useMemo } from "react"
import {
  CheckCircle2,
  XCircle,
  Banknote,
  Users,
  CheckSquare,
  Square,
  Loader2,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MOCK_APPROVAL_QUEUE, type MockApprovalItem, formatIDR } from "@/lib/mock-payroll-data"

const STEPS = ["Draft", "Diproses", "Disetujui", "Dibayar"]
const STEP_VALUES = ["draft", "processing", "approved", "paid"]

function WorkflowSteps({ current }: { current: string }) {
  const idx = STEP_VALUES.indexOf(current)
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                i < idx
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : i === idx
                  ? "bg-emerald-600 border-emerald-500 text-white ring-2 ring-emerald-500/30"
                  : "bg-background border-border text-muted-foreground"
              }`}
            >
              {i < idx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 whitespace-nowrap ${i <= idx ? "text-emerald-600 font-medium" : "text-muted-foreground"}`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 mx-1 mt-[-10px] ${i < idx ? "bg-emerald-600" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ApprovalBadge({ step }: { step: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:      { label: "Draft",     cls: "bg-muted text-foreground border-border" },
    processing: { label: "Menunggu",  cls: "bg-amber-500/20 text-amber-700 border-amber-500/30" },
    approved:   { label: "Disetujui", cls: "bg-blue-500/20 text-blue-700 border-blue-500/30" },
    paid:       { label: "Dibayar",   cls: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" },
  }
  const cfg = map[step] ?? map.draft
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>{cfg.label}</span>
  )
}

export default function ApprovalPage() {
  const [queue, setQueue] = useState<MockApprovalItem[]>(MOCK_APPROVAL_QUEUE)
  const [selected, setSelected] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("pending")

  const [approveTarget, setApproveTarget] = useState<MockApprovalItem | null>(null)
  const [rejectTarget, setRejectTarget] = useState<MockApprovalItem | null>(null)
  const [notes, setNotes] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const pending = useMemo(() => queue.filter((q) => q.workflow_step === "processing"), [queue])
  const approved = useMemo(() => queue.filter((q) => q.workflow_step === "approved" || q.workflow_step === "paid"), [queue])
  const tabItems = activeTab === "pending" ? pending : activeTab === "approved" ? approved : queue

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const handleApprove = async (item: MockApprovalItem) => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, workflow_step: "approved", notes } : q))
    setApproveTarget(null)
    setNotes("")
    setSubmitting(false)
  }

  const handleReject = async (item: MockApprovalItem) => {
    if (!reason.trim()) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setQueue((prev) => prev.map((q) => q.id === item.id ? { ...q, workflow_step: "draft", notes: reason } : q))
    setRejectTarget(null)
    setReason("")
    setSubmitting(false)
  }

  const handleBulkApprove = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))
    setQueue((prev) => prev.map((q) => selected.includes(q.id) ? { ...q, workflow_step: "approved" } : q))
    setSelected([])
    setSubmitting(false)
  }

  const latestStep = pending.length > 0 ? "processing" : approved.length > 0 ? "approved" : "paid"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Persetujuan Payroll</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tinjau dan setujui periode penggajian sebelum pembayaran</p>
      </div>

      {/* Workflow Steps */}
      <Card className="bg-card border-border">
        <CardContent className="pt-5 pb-3 overflow-x-auto">
          <WorkflowSteps current={latestStep} />
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <Card className="bg-muted border-border">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">{selected.length} periode dipilih</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-7"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Setujui Semua ({selected.length})
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected([])} className="h-7">Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Menunggu
            {pending.length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] rounded-full px-1.5">{pending.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
          <TabsTrigger value="all">Semua</TabsTrigger>
        </TabsList>

        {["pending", "approved", "all"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {tabItems.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Tidak ada data</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tabItems.map((item) => (
                  <Card key={item.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {item.workflow_step === "processing" && (
                          <button type="button" onClick={() => toggleSelect(item.id)} className="shrink-0 self-start sm:self-center text-muted-foreground hover:text-emerald-600">
                            {selected.includes(item.id)
                              ? <CheckSquare className="w-5 h-5 text-emerald-600" />
                              : <Square className="w-5 h-5" />
                            }
                          </button>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{item.period_label}</span>
                            <ApprovalBadge step={item.workflow_step} />
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{item.total_employees} karyawan</span>
                            <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{formatIDR(item.total_net)}</span>
                            <span>Diajukan: {new Date(item.submitted_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            <span>Oleh: {item.submitted_by}</span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Catatan: {item.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.workflow_step === "processing" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => { setApproveTarget(item); setNotes("") }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setRejectTarget(item); setReason("") }}
                                className="text-red-600 hover:bg-red-500/10 h-7 text-xs gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Tolak
                              </Button>
                            </>
                          )}
                          {(item.workflow_step === "approved" || item.workflow_step === "paid") && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground">
                              Lihat Detail <ChevronRight className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={!!approveTarget} onOpenChange={(o) => !o && setApproveTarget(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Persetujuan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Anda akan menyetujui penggajian periode <strong className="text-foreground">{approveTarget?.period_label}</strong> untuk{" "}
              <strong className="text-foreground">{approveTarget?.total_employees} karyawan</strong> dengan total net{" "}
              <strong className="text-emerald-600">{approveTarget ? formatIDR(approveTarget.total_net) : ""}</strong>.
            </p>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan persetujuan..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setApproveTarget(null)} disabled={submitting}>Batal</Button>
            <Button
              onClick={() => approveTarget && handleApprove(approveTarget)}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Setujui
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Penggajian</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Penggajian <strong className="text-foreground">{rejectTarget?.period_label}</strong> akan dikembalikan ke status Draft.
            </p>
            <div className="space-y-1.5">
              <Label>Alasan Penolakan <span className="text-red-500">*</span></Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Masukkan alasan penolakan..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectTarget(null)} disabled={submitting}>Batal</Button>
            <Button
              onClick={() => rejectTarget && handleReject(rejectTarget)}
              disabled={submitting || !reason.trim()}
              variant="destructive"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
