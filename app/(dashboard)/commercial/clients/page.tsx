"use client"

import { useState, useEffect } from "react"
import { Users, Plus, Phone, Mail, Building2, Edit3, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FilterBar, FilterBarSearch } from "@/components/ui/filter-bar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

interface Client {
  id: string
  contact_name: string
  company_name?: string
  contact_email?: string
  contact_phone?: string
  created_at: string
}

interface ClientForm {
  contact_name: string
  company_name: string
  contact_email: string
  contact_phone: string
}

const emptyForm: ClientForm = { contact_name: "", company_name: "", contact_email: "", contact_phone: "" }

export default function ClientManagementPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialog, setDialog] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null })
  const [form, setForm] = useState<ClientForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchClients = async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from("crm_leads")
        .select("id, contact_name, company_name, contact_email, contact_phone, created_at")
        .eq("tenant_id", getTenantId())
        .not("contact_name", "is", null)
        .order("created_at", { ascending: false })
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      console.error("Failed to fetch clients:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const openAdd = () => {
    setForm(emptyForm)
    setDialog({ open: true, editId: null })
  }

  const openEdit = (client: Client) => {
    setForm({
      contact_name: client.contact_name,
      company_name: client.company_name || "",
      contact_email: client.contact_email || "",
      contact_phone: client.contact_phone || "",
    })
    setDialog({ open: true, editId: client.id })
  }

  const handleSave = async () => {
    if (!form.contact_name.trim() || !insForge) return
    setSaving(true)
    try {
      if (dialog.editId) {
        const { error } = await insForge.from("crm_leads")
          .update({
            contact_name: form.contact_name.trim(),
            company_name: form.company_name.trim() || null,
            contact_email: form.contact_email.trim() || null,
            contact_phone: form.contact_phone.trim() || null,
          })
          .eq("id", dialog.editId)
        if (error) throw error
      } else {
        const { error } = await insForge.from("crm_leads").insert({
          tenant_id: getTenantId(),
          contact_name: form.contact_name.trim(),
          company_name: form.company_name.trim() || null,
          contact_email: form.contact_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
        })
        if (error) throw error
      }
      setDialog({ open: false, editId: null })
      await fetchClients()
    } catch (err) {
      console.error("Failed to save client:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus klien ini?")) return
    if (!insForge) return
    try {
      const { error } = await insForge.from("crm_leads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
      await fetchClients()
    } catch (err) {
      console.error("Failed to delete client:", err)
    }
  }

  const filtered = clients.filter(
    (c) =>
      search === "" ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Manajemen Klien
          </h1>
          <p className="text-muted-foreground mt-1">Daftar kontak klien</p>
        </div>
        <Button onClick={openAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Klien
        </Button>
      </div>

      <FilterBar>
        <FilterBarSearch
          placeholder="Cari klien..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </FilterBar>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">Nama</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden md:table-cell">Perusahaan</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Telepon</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Bergabung</th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      {search ? "Tidak ada hasil." : "Belum ada klien."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => (
                    <tr key={client.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">{client.contact_name}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden md:table-cell">{client.company_name || "-"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">{client.contact_email || "-"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">{client.contact_phone || "-"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">
                        {new Date(client.created_at).toLocaleDateString("id-ID", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-0.5 justify-end">
                          <button
                            onClick={() => openEdit(client)}
                            className="p-1.5 rounded text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="p-1.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.editId ? "Edit Klien" : "Tambah Klien"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nama Klien <span className="text-red-500">*</span></Label>
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                placeholder="Nama kontak klien"
                className="bg-background border-border text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Perusahaan</Label>
              <Input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="Nama perusahaan"
                className="bg-background border-border text-foreground text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="email@example.com"
                  type="email"
                  className="bg-background border-border text-foreground text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Telepon</Label>
                <Input
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="08xxx"
                  className="bg-background border-border text-foreground text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDialog({ open: false, editId: null })} className="text-xs h-9">
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.contact_name.trim() || saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9"
              >
                {saving ? "Menyimpan..." : dialog.editId ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
