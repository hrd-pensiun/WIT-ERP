"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Target, Loader2, Edit3, Trash2, ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { insForge } from "@/lib/insforge"
import LeadTabs, { ConvertProjectDialog, ConvertToCommercialProjectDialog, EditLeadDialog } from "@/components/leads/lead-tabs"

export default function LeadViewClient({ id }: { id: string }) {
  const router = useRouter()
  const [lead, setLead] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [convertCommercialOpen, setConvertCommercialOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const fetchLead = useCallback(async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from("crm_leads")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw error
      setLead(data)
    } catch (err) {
      console.error("Failed to fetch lead:", err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchLead()
  }, [fetchLead])

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus lead ini?")) return
    if (!insForge) return
    setDeleting(true)
    try {
      await insForge
        .from("crm_leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      router.push("/crm/pipeline")
    } catch (err) {
      console.error("Failed to delete lead:", err)
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lead tidak ditemukan</p>
        <Link href="/crm/pipeline"><Button variant="outline" className="mt-4">Kembali</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/pipeline">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              Detail Leads : {lead.title || `${lead.contact_name}${lead.company_name ? ` - ${lead.company_name}` : ""}`}{lead.lead_number ? ` (${lead.lead_number})` : ""}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setConvertOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            <ArrowRight className="w-4 h-4" />
            Convert
          </Button>
          <Button onClick={() => setConvertCommercialOpen(true)} variant="outline" className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 gap-1.5">
            <Building2 className="w-4 h-4" />
            Convert to Project
          </Button>
          <Button variant="outline" className="border-border gap-1.5" onClick={() => setEditOpen(true)}>
            <Edit3 className="w-4 h-4" />
            Ubah Data
          </Button>
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Hapus
          </Button>
        </div>
      </div>

      {/* Tab Sections */}
      <LeadTabs lead={lead} onRefresh={fetchLead} />

      <ConvertProjectDialog lead={lead} open={convertOpen} onOpenChange={setConvertOpen} />
      <ConvertToCommercialProjectDialog lead={lead} open={convertCommercialOpen} onOpenChange={setConvertCommercialOpen} />
      <EditLeadDialog leadId={id} lead={lead} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
