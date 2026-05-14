"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, X, Loader2, User, Building2, Mail, Phone, Target, Users, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useLeads } from "@/hooks/useLeads"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import Link from "next/link"

interface EmailEntry {
  id: string
  email: string
}

interface ContactEntry {
  id: string
  name: string
  phone: string
  email: string
}

export default function NewLeadPage() {
  const router = useRouter()
  const { createLead, loading } = useLeads()
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [existingCompanies, setExistingCompanies] = useState<string[]>([])
  const [existingClients, setExistingClients] = useState<string[]>([])
  const [showNewCompany, setShowNewCompany] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)

  // BANT popup state
  const [bantOpen, setBantOpen] = useState(false)

  // Lead nomenclature preview
  const [leadNomen, setLeadNomen] = useState<{
    prefix: string
    yearType: string
    separator: string
    seqDigits: number
    lastSequence: number
  } | null>(null)

  const buildLeadPreview = () => {
    if (!leadNomen) return ""
    const parts: string[] = [leadNomen.prefix]
    if (leadNomen.yearType === 'YY') parts.push(new Date().getFullYear().toString().slice(-2))
    else if (leadNomen.yearType === 'YYYY') parts.push(new Date().getFullYear().toString())
    const nextSeq = leadNomen.lastSequence + 1
    parts.push(String(nextSeq).padStart(leadNomen.seqDigits, '0'))
    return parts.join(leadNomen.separator)
  }

  useEffect(() => {
    const db = insForge
    if (!db) return
    db.from("commercial_nomenclature")
      .select("*")
      .eq("entity", "Lead")
      .maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setLeadNomen({
            prefix: data.prefix,
            yearType: data.year_type,
            separator: data.separator,
            seqDigits: data.seq_digits,
            lastSequence: data.last_sequence || 0,
          })
        }
      })
  }, [])

  const [formData, setFormData] = useState({
    title: "",
    contact_name: "",
    pic_id: "",
    lead_source: "website",
    notes: "",
    budget_confirmed: false,
    budget_value: "",
    authority_confirmed: false,
    authority_detail: "",
    need_confirmed: false,
    need_detail: "",
    timeline_confirmed: false,
    timeline_detail: "",
    company_name: "",
    priority: "medium",
  })

  const [emails, setEmails] = useState<EmailEntry[]>([
    { id: "1", email: "" },
  ])

  const [contacts, setContacts] = useState<ContactEntry[]>([
    { id: "1", name: "", phone: "", email: "" },
  ])

  // Fetch employees for PIC dropdown
  useEffect(() => {
    if (!insForge) return
    insForge
      .from("user_profiles")
      .select("id, full_name, employee_number")
      .order("full_name", { ascending: true })
      .then(({ data }: any) => setEmployees(data || []))
  }, [])

  // Fetch existing company names from leads + entities
  useEffect(() => {
    const db = insForge
    if (!db) return
    const fetchCompanies = async () => {
      const names = new Set<string>()
      const { data: leads } = await db
        .from("crm_leads")
        .select("company_name")
        .not("company_name", "is", null)
      leads?.forEach((l: any) => {
        if (l.company_name) names.add(l.company_name)
      })
      setExistingCompanies(Array.from(names).sort())
    }
    fetchCompanies()

    const fetchClients = async () => {
      const names = new Set<string>()
      const { data: leads } = await db
        .from("crm_leads")
        .select("contact_name")
        .not("contact_name", "is", null)
      leads?.forEach((l: any) => {
        if (l.contact_name) names.add(l.contact_name)
      })
      setExistingClients(Array.from(names).sort())
    }
    fetchClients()
  }, [])

  const addEmail = () => {
    setEmails((prev) => [...prev, { id: String(Date.now()), email: "" }])
  }

  const removeEmail = (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id))
  }

  const updateEmail = (id: string, value: string) => {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, email: value } : e)))
  }

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", phone: "", email: "" },
    ])
  }

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const updateContact = (id: string, field: keyof ContactEntry, value: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    )
  }

  const bantCount = [
    formData.budget_confirmed,
    formData.authority_confirmed,
    formData.need_confirmed,
    formData.timeline_confirmed,
  ].filter(Boolean).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validEmails = emails.map((e) => e.email).filter(Boolean)
    const validContacts = contacts.filter((c) => c.name || c.phone || c.email)

    try {
      // 1. Generate a known lead ID so we can link the opportunity
      const leadId = crypto.randomUUID()

      // 2. Create lead with RAW status using the known ID
      const leadNumber = leadNomen
        ? buildLeadPreview()
        : null

      await createLead({
        id: leadId,
        tenant_id: getTenantId(),
        lead_number: leadNumber,
        title: formData.title || null,
        contact_name: formData.contact_name,
        company_name: formData.company_name || null,
        lead_source: formData.lead_source,
        notes: formData.notes || null,
        priority: formData.priority,
        budget_confirmed: formData.budget_confirmed,
        authority_confirmed: formData.authority_confirmed,
        need_confirmed: formData.need_confirmed,
        timeline_confirmed: formData.timeline_confirmed,
        status: "raw",
        contact_email: validEmails[0] || null,
        pic_sales_id: formData.pic_id || null,
      })

      // 3. Update last_sequence in nomenclature
      if (leadNomen && insForge) {
        await insForge.from("commercial_nomenclature")
          .update({ last_sequence: leadNomen.lastSequence + 1 })
          .eq("entity", "Lead")
      }

      // 4. Create opportunity linked to this lead so it appears in Pipeline
      if (insForge) {
        await insForge.from("crm_opportunities").insert({
          tenant_id: getTenantId(),
          lead_id: leadId,
          title: formData.title || `Lead: ${formData.contact_name}`,
          description: formData.notes || null,
          value: formData.budget_value ? parseFloat(formData.budget_value.replace(/[^0-9]/g, "")) || 0 : 0,
          stage: "New",
          probability: 10,
          pic_sales_id: formData.pic_id || null,
        })
      }

      router.push("/crm/pipeline")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/crm/pipeline">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tambah Lead</h1>
          <p className="text-muted-foreground text-sm">Lengkapi data lead baru</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ========== SECTION A (50%) ========== */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-5">
                {/* Lead Title + Preview ID — 50:50 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-emerald-500" /> Lead Title
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Contoh: Implementasi ERP"
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  {leadNomen && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1.5 text-zinc-500">
                        Preview ID Lead
                      </Label>
                      <div className="h-10 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-300 dark:border-zinc-600 flex items-center">
                        <code className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                          {buildLeadPreview()}
                        </code>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nama Klien — dropdown + create new */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-500" /> Nama Klien <span className="text-red-400">*</span>
                  </Label>
                  {!showNewClient ? (
                    <Select
                      value={formData.contact_name}
                      onValueChange={(value) => {
                        if (value === "__new__") {
                          setShowNewClient(true)
                          setFormData({ ...formData, contact_name: "" })
                        } else {
                          setFormData({ ...formData, contact_name: value })
                        }
                      }}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Pilih klien atau buat baru..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingClients.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__" className="text-emerald-600 font-medium border-t border-border mt-1">
                          + Tambah Klien Baru
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={formData.contact_name}
                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                        placeholder="Nama klien baru"
                        autoFocus
                        required
                        className="flex-1 bg-background border-border text-foreground"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowNewClient(false)
                          setFormData({ ...formData, contact_name: "" })
                        }}
                        className="text-muted-foreground shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* PIC, Sumber Leads, BANT — 1 row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* PIC */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-500" /> PIC
                    </Label>
                    <Select
                      value={formData.pic_id}
                      onValueChange={(value) => setFormData({ ...formData, pic_id: value })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} {emp.employee_number ? `(${emp.employee_number})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sumber Leads */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <ChevronDown className="w-4 h-4 text-emerald-500" /> Sumber
                    </Label>
                    <Select
                      value={formData.lead_source}
                      onValueChange={(value) => setFormData({ ...formData, lead_source: value })}
                    >
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="walk_in">Walk In</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* BANT Qualification */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">BANT</Label>
                    <Dialog open={bantOpen} onOpenChange={setBantOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between border-border text-foreground bg-background hover:bg-accent h-10"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="text-xs truncate">
                              {bantCount === 0 ? "Isi BANT" : `${bantCount} confirmed`}
                            </span>
                          </span>
                          <Badge variant="secondary" className="text-xs shrink-0 ml-1">
                            {bantCount}/4
                          </Badge>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" /> BANT Qualification
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-5 py-4 max-h-[60vh] overflow-y-auto pr-1">
                          {/* Budget */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">Budget</p>
                                <p className="text-xs text-muted-foreground">Klien memiliki budget yang cukup</p>
                              </div>
                              <Switch
                                checked={formData.budget_confirmed}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, budget_confirmed: checked })
                                }
                              />
                            </div>
                            {formData.budget_confirmed && (
                              <div className="pl-2 pt-1">
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-medium">Rp</span>
                                  <input
                                    type="text"
                                    value={formData.budget_value}
                                    onChange={(e) => setFormData({ ...formData, budget_value: e.target.value })}
                                    placeholder="Estimasi nilai proyek..."
                                    className="w-full h-9 pl-9 pr-3 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Authority */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">Authority</p>
                                <p className="text-xs text-muted-foreground">
                                  Kontak memiliki otoritas pengambilan keputusan
                                </p>
                              </div>
                              <Switch
                                checked={formData.authority_confirmed}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, authority_confirmed: checked })
                                }
                              />
                            </div>
                            {formData.authority_confirmed && (
                              <div className="pl-2 pt-1">
                                <input
                                  type="text"
                                  value={formData.authority_detail}
                                  onChange={(e) => setFormData({ ...formData, authority_detail: e.target.value })}
                                  placeholder="Jabatan / posisi pengambil keputusan..."
                                  className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                />
                              </div>
                            )}
                          </div>

                          {/* Need */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">Need</p>
                                <p className="text-xs text-muted-foreground">
                                  Klien memiliki kebutuhan yang jelas
                                </p>
                              </div>
                              <Switch
                                checked={formData.need_confirmed}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, need_confirmed: checked })
                                }
                              />
                            </div>
                            {formData.need_confirmed && (
                              <div className="pl-2 pt-1">
                                <textarea
                                  value={formData.need_detail}
                                  onChange={(e) => setFormData({ ...formData, need_detail: e.target.value })}
                                  placeholder="Deskripsi kebutuhan klien..."
                                  rows={2}
                                  className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                                />
                              </div>
                            )}
                          </div>

                          {/* Timeline */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-foreground">Timeline</p>
                                <p className="text-xs text-muted-foreground">
                                  Ada timeline yang jelas untuk pembelian
                                </p>
                              </div>
                              <Switch
                                checked={formData.timeline_confirmed}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, timeline_confirmed: checked })
                                }
                              />
                            </div>
                            {formData.timeline_confirmed && (
                              <div className="pl-2 pt-1">
                                <input
                                  type="text"
                                  value={formData.timeline_detail}
                                  onChange={(e) => setFormData({ ...formData, timeline_detail: e.target.value })}
                                  placeholder="Estimasi timeline (misal: Q3 2026)..."
                                  className="w-full h-9 px-3 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Deskripsi Lead */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Deskripsi Lead</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan mengenai lead ini..."
                    rows={5}
                    className="bg-background border-border text-foreground"
                    style={{ height: '140px' }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ========== SECTION B (50%) ========== */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-5">
                {/* Nama Perusahaan — dropdown + create new */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-500" /> Nama Perusahaan
                  </Label>
                  {!showNewCompany ? (
                    <div className="flex gap-2">
                      <Select
                        value={formData.company_name}
                        onValueChange={(value) => {
                          if (value === "__new__") {
                            setShowNewCompany(true)
                            setFormData({ ...formData, company_name: "" })
                          } else {
                            setFormData({ ...formData, company_name: value })
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-background border-border text-foreground">
                          <SelectValue placeholder="Pilih atau ketik baru..." />
                        </SelectTrigger>
                        <SelectContent>
                          {existingCompanies.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__" className="text-emerald-600 font-medium border-t border-border mt-1">
                            + Tambah Perusahaan Baru
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <Input
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Nama perusahaan baru"
                        autoFocus
                        className="flex-1 bg-background border-border text-foreground"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowNewCompany(false)
                          setFormData({ ...formData, company_name: "" })
                        }}
                        className="text-muted-foreground shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email PIC Perusahaan — multiple */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-500" /> Email PIC Perusahaan
                  </Label>
                  <div className="space-y-2">
                    {emails.map((entry, idx) => (
                      <div key={entry.id} className="flex gap-2 items-center">
                        <Input
                          type="email"
                          value={entry.email}
                          onChange={(e) => updateEmail(entry.id, e.target.value)}
                          placeholder={idx === 0 ? "email@perusahaan.com" : `Email ${idx + 1}`}
                          className="flex-1 bg-background border-border text-foreground"
                        />
                        {emails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmail(entry.id)}
                            className="text-muted-foreground shrink-0 h-9 w-9"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addEmail}
                    className="text-emerald-600 hover:text-emerald-500 gap-1 text-xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Email
                  </Button>
                </div>

                {/* PIC Perusahaan — multiple contacts */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-emerald-500" /> PIC Perusahaan
                  </Label>
                  <div className="space-y-3">
                    {contacts.map((contact, idx) => (
                      <div
                        key={contact.id}
                        className="p-3 rounded-lg border border-border bg-background relative"
                      >
                        {contacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeContact(contact.id)}
                            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[0.65rem] text-muted-foreground mb-1 block">
                              Nama
                            </Label>
                            <Input
                              value={contact.name}
                              onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                              placeholder={idx === 0 ? "Kontak utama" : `Kontak ${idx + 1}`}
                              className="bg-background border-border text-foreground text-xs h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-[0.65rem] text-muted-foreground mb-1 block">
                              Telepon
                            </Label>
                            <Input
                              value={contact.phone}
                              onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                              placeholder="+62..."
                              className="bg-background border-border text-foreground text-xs h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-[0.65rem] text-muted-foreground mb-1 block">
                              Email
                            </Label>
                            <Input
                              type="email"
                              value={contact.email}
                              onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                              placeholder="email@"
                              className="bg-background border-border text-foreground text-xs h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addContact}
                    className="text-emerald-600 hover:text-emerald-500 gap-1 text-xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Kontak
                  </Button>
                </div>

                {/* Prioritas */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prioritas</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Rendah</SelectItem>
                      <SelectItem value="medium">Sedang</SelectItem>
                      <SelectItem value="high">Tinggi</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link href="/crm/pipeline">
                <Button type="button" variant="ghost" className="text-muted-foreground">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Lead"
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
