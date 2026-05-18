'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Save, RotateCcw, Plus, Trash2, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { insForge } from '@/lib/insforge'
import { getTenantId } from '@/lib/tenant'

const DEFAULTS = {
  pajak: 11,
  founderFee: 3,
  managementFee: 2,
  seFee: 0,
  cogsPct: 25,
  opexPct: 75,
}

interface ListItem {
  id: string
  name: string
  description?: string
  color?: string
}

export default function MasterDataCommercialPage() {
  const [activeTab, setActiveTab] = useState('cost-analysis')
  const [config, setConfig] = useState({ ...DEFAULTS })
  const [saved, setSaved] = useState(false)

  // Leads Status — fetched from DB
  const [leadStatuses, setLeadStatuses] = useState<ListItem[]>([])
  const [statusLoading, setStatusLoading] = useState(true)

  const fetchLeadStatuses = async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from('commercial_lead_status')
        .select('id, name, description, color')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      setLeadStatuses(data?.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || undefined,
        color: s.color || '#3b82f6',
      })) || [])
    } catch {
      // fallback: kosong
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    fetchLeadStatuses()
  }, [])

  // DB-backed CRUD untuk leads status
  const addLeadStatus = async () => {
    if (!newItemName.trim() || !insForge) return
    const { error } = await insForge.from('commercial_lead_status').insert({
      tenant_id: getTenantId(),
      name: newItemName.trim(),
      description: newItemDesc.trim() || null,
      color: newItemColor,
      sort_order: leadStatuses.length + 1,
    })
    if (error) {
      console.error('Failed to add lead status:', JSON.stringify(error))
      return
    }
    setNewItemName('')
    setNewItemDesc('')
    setNewItemColor('#3b82f6')
    await fetchLeadStatuses()
  }

  const saveLeadStatusEdit = async () => {
    if (!editingItem || !newItemName.trim() || !insForge) return
    const { error } = await insForge.from('commercial_lead_status')
      .update({
        name: newItemName.trim(),
        description: newItemDesc.trim() || null,
        color: newItemColor,
      })
      .eq('id', editingItem.id)
    if (error) {
      console.error('Failed to update lead status:', JSON.stringify(error))
      return
    }
    cancelEdit()
    await fetchLeadStatuses()
  }

  const deleteLeadStatus = async (id: string) => {
    if (!insForge) return
    const { error } = await insForge.from('commercial_lead_status')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.error('Failed to delete lead status:', JSON.stringify(error))
      return
    }
    await fetchLeadStatuses()
  }  // Leads Category
  const [leadCategories, setLeadCategories] = useState<ListItem[]>([
    { id: '1', name: 'Enterprise', description: 'Perusahaan besar' },
    { id: '2', name: 'Mid-Market', description: 'Perusahaan menengah' },
    { id: '3', name: 'SME', description: 'UKM / kecil' },
    { id: '4', name: 'Government', description: 'Instansi pemerintah' },
  ])

  // Project Category — DB-backed
  const [projectCategories, setProjectCategories] = useState<ListItem[]>([])
  const [projectCatLoading, setProjectCatLoading] = useState(true)

  const fetchProjectCategories = async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from('commercial_project_types')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name', { ascending: true })
      if (error) throw error
      setProjectCategories(data?.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || undefined,
      })) || [])
    } catch {
      // fallback
    } finally {
      setProjectCatLoading(false)
    }
  }

  // ID Nomenclature — DB-backed
  interface IdNomenclature {
    id: string
    entity: string
    prefix: string
    yearType: 'none' | 'YY' | 'YYYY'
    separator: '-' | '/' | '_' | '.'
    useCompany: boolean
    useProject: boolean
    seqDigits: number
    lastSequence: number
    impact: string
    example: string
  }

  const buildExample = (n: IdNomenclature): string => {
    const parts: string[] = [n.prefix]
    if (n.yearType === 'YY') parts.push('24')
    else if (n.yearType === 'YYYY') parts.push('2024')
    if (n.useCompany) parts.push('MANDIRI')
    if (n.useProject) parts.push('ERP')
    const nextSeq = n.lastSequence + 1
    parts.push(String(nextSeq).padStart(n.seqDigits, '0'))
    return parts.join(n.separator)
  }

  const emptyNomen = (overs?: Partial<IdNomenclature>): IdNomenclature => {
    const base: IdNomenclature = {
      id: '',
      entity: '',
      prefix: '',
      yearType: 'YYYY',
      separator: '-',
      useCompany: false,
      useProject: false,
      seqDigits: 4,
      lastSequence: 0,
      impact: '',
      example: '',
    }
    const n = { ...base, ...overs }
    n.example = buildExample(n)
    return n
  }

  const [nomenclatures, setNomenclatures] = useState<IdNomenclature[]>([])
  const [nomenLoading, setNomenLoading] = useState(true)
  const [nomenSaved, setNomenSaved] = useState(false)

  const fetchNomenclatures = async () => {
    if (!insForge) return
    try {
      const { data, error } = await insForge
        .from('commercial_nomenclature')
        .select('*')
        .eq('is_active', true)
        .order('entity', { ascending: true })
      if (error) throw error
      setNomenclatures(data?.map((r: any) => ({
        id: r.id,
        entity: r.entity,
        prefix: r.prefix,
        yearType: r.year_type,
        separator: r.separator,
        useCompany: r.use_company,
        useProject: r.use_project,
        seqDigits: r.seq_digits,
        lastSequence: r.last_sequence || 0,
        impact: r.impact || '',
        example: '',
      })).map((n: IdNomenclature) => ({ ...n, example: buildExample(n) })) || [])
    } catch (err) {
      console.error('Failed to fetch nomenclatures:', err)
    } finally {
      setNomenLoading(false)
    }
  }

  // Nomen dialog state
  const [nomenDialog, setNomenDialog] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null })
  const [nomenForm, setNomenForm] = useState<IdNomenclature>(emptyNomen())

  const openNomenDialog = (id: string | null) => {
    if (id) {
      const existing = nomenclatures.find((n) => n.id === id)
      if (existing) setNomenForm({ ...existing })
    } else {
      setNomenForm(emptyNomen())
    }
    setNomenDialog({ open: true, editId: id })
  }

  const saveNomenForm = async () => {
    if (!nomenForm.entity.trim() || !nomenForm.prefix.trim() || !insForge) return
    try {
      const payload = {
        tenant_id: getTenantId(),
        entity: nomenForm.entity.trim(),
        prefix: nomenForm.prefix.trim().toUpperCase(),
        year_type: nomenForm.yearType,
        separator: nomenForm.separator,
        use_company: nomenForm.useCompany,
        use_project: nomenForm.useProject,
        seq_digits: nomenForm.seqDigits,
        impact: nomenForm.impact.trim() || null,
      }

      if (nomenDialog.editId) {
        const { error } = await insForge.from('commercial_nomenclature')
          .update(payload)
          .eq('id', nomenDialog.editId)
        if (error) throw error
      } else {
        const { error } = await insForge.from('commercial_nomenclature')
          .insert(payload)
        if (error) throw error
      }
      setNomenDialog({ open: false, editId: null })
      await fetchNomenclatures()
    } catch (err) {
      console.error('Failed to save nomenclature:', err)
    }
  }

  const deleteNomen = async (id: string) => {
    if (!confirm('Hapus nomenklatur ini?')) return
    if (!insForge) return
    try {
      const { error } = await insForge.from('commercial_nomenclature')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await fetchNomenclatures()
    } catch (err) {
      console.error('Failed to delete nomenclature:', err)
    }
  }

  // Project Category — DB-backed CRUD
  const addProjectCategory = async () => {
    if (!newItemName.trim() || !insForge) return
    const { error } = await insForge.from('commercial_project_types').insert({
      tenant_id: getTenantId(),
      name: newItemName.trim(),
      description: newItemDesc.trim() || null,
    })
    if (error) {
      console.error('Failed to add project category:', JSON.stringify(error))
      return
    }
    setNewItemName('')
    setNewItemDesc('')
    await fetchProjectCategories()
  }

  const saveProjectCategoryEdit = async () => {
    if (!editingItem || !newItemName.trim() || !insForge) return
    const { error } = await insForge.from('commercial_project_types')
      .update({
        name: newItemName.trim(),
        description: newItemDesc.trim() || null,
      })
      .eq('id', editingItem.id)
    if (error) {
      console.error('Failed to update project category:', JSON.stringify(error))
      return
    }
    cancelEdit()
    await fetchProjectCategories()
  }

  const deleteProjectCategory = async (id: string) => {
    if (!insForge) return
    const { error } = await insForge.from('commercial_project_types')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.error('Failed to delete project category:', JSON.stringify(error))
      return
    }
    await fetchProjectCategories()
  }

  useEffect(() => {
    fetchProjectCategories()
  }, [])

  useEffect(() => {
    fetchNomenclatures()
  }, [])

  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemColor, setNewItemColor] = useState('#3b82f6')
  const [editingItem, setEditingItem] = useState<ListItem | null>(null)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setConfig({ ...DEFAULTS })
  }

  const update = (key: string, val: string) => {
    const num = parseFloat(val)
    if (isNaN(num)) return
    setConfig((prev) => ({ ...prev, [key]: num }))
  }

  const addItem = (
    list: ListItem[],
    setter: (v: ListItem[]) => void,
  ) => {
    if (!newItemName.trim()) return
    const newItem: ListItem = {
      id: String(Date.now()),
      name: newItemName.trim(),
      description: newItemDesc.trim() || undefined,
      color: newItemColor,
    }
    setter([...list, newItem])
    setNewItemName('')
    setNewItemDesc('')
    setNewItemColor('#3b82f6')
  }

  const deleteItem = (
    list: ListItem[],
    setter: (v: ListItem[]) => void,
    id: string,
  ) => {
    setter(list.filter((i) => i.id !== id))
  }

  const startEdit = (item: ListItem) => {
    setEditingItem(item)
    setNewItemName(item.name)
    setNewItemDesc(item.description || '')
    setNewItemColor(item.color || '#3b82f6')
  }

  const saveEdit = (
    list: ListItem[],
    setter: (v: ListItem[]) => void,
  ) => {
    if (!editingItem || !newItemName.trim()) return
    setter(
      list.map((i) =>
        i.id === editingItem.id
          ? { ...i, name: newItemName.trim(), description: newItemDesc.trim() || undefined, color: newItemColor }
          : i,
      ),
    )
    cancelEdit()
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setNewItemName('')
    setNewItemDesc('')
    setNewItemColor('#3b82f6')
  }

  const renderItemList = (
    items: ListItem[],
    setter: (v: ListItem[]) => void,
    editPlaceholder = 'Nama item...',
    descPlaceholder = 'Deskripsi (opsional)...',
  ) => (
    <div className="space-y-4">
      {/* Add / Edit Form */}
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-2">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={editPlaceholder}
            className="bg-background border-border text-foreground text-sm h-9"
          />
          <div className="flex gap-2">
            <Input
              value={newItemDesc}
              onChange={(e) => setNewItemDesc(e.target.value)}
              placeholder={descPlaceholder}
              className="flex-1 bg-background border-border text-foreground text-sm h-9"
            />
            {(items === leadStatuses) && (
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="color"
                  value={newItemColor}
                  onChange={(e) => setNewItemColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-border bg-background cursor-pointer p-0.5"
                />
                <span className="text-[0.6rem] text-zinc-400 w-12">{newItemColor}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 pt-0">
          {editingItem ? (
            <>
              <Button
                onClick={
                  items === leadStatuses ? saveLeadStatusEdit
                  : items === projectCategories ? saveProjectCategoryEdit
                  : () => saveEdit(items, setter)
                }
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs"
              >
                Simpan
              </Button>
              <Button onClick={cancelEdit} variant="ghost" size="sm" className="h-9 text-xs">
                Batal
              </Button>
            </>
          ) : (
            <Button
              onClick={
                  items === leadStatuses ? addLeadStatus
                  : items === projectCategories ? addProjectCategory
                  : () => addItem(items, setter)
                }
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 h-9 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {items.length === 0 && !((items === leadStatuses && statusLoading) || (items === projectCategories && projectCatLoading)) ? (
        <p className="text-sm text-zinc-500 text-center py-6">Belum ada data.</p>
      ) : (items === leadStatuses && statusLoading) || (items === projectCategories && projectCatLoading) ? (
        <p className="text-sm text-zinc-500 text-center py-6">Memuat data...</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-3">
                {items === leadStatuses ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      {item.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name}</span>
                )}
                {item.description && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(item)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={
                    items === leadStatuses ? () => deleteLeadStatus(item.id)
                    : items === projectCategories ? () => deleteProjectCategory(item.id)
                    : () => deleteItem(items, setter, item.id)
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Master Data Commercial</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Kelola data master commercial</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex gap-6">
        <TabsList className="flex flex-col w-52 shrink-0 bg-transparent gap-0.5 h-auto">
          <TabsTrigger
            value="cost-analysis"
            className="w-full justify-start text-xs px-3 py-2 rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent shadow-none transition-colors text-left"
          >
            Commercial Cost Analysis
          </TabsTrigger>
          <TabsTrigger
            value="leads-status"
            className="w-full justify-start text-xs px-3 py-2 rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent shadow-none transition-colors text-left"
          >
            Leads Status
          </TabsTrigger>
          <TabsTrigger
            value="leads-category"
            className="w-full justify-start text-xs px-3 py-2 rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent shadow-none transition-colors text-left"
          >
            Leads Category
          </TabsTrigger>
          <TabsTrigger
            value="project-category"
            className="w-full justify-start text-xs px-3 py-2 rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent shadow-none transition-colors text-left"
          >
            Project Category
          </TabsTrigger>
          <TabsTrigger
            value="nomenclature"
            className="w-full justify-start text-xs px-3 py-2 rounded-lg data-[state=active]:bg-emerald-50 dark:data-[state=active]:bg-emerald-950/20 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent shadow-none transition-colors text-left"
          >
            Nomenklatur ID
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">

        {/* Tab 1: Commercial Cost Analysis */}
        <TabsContent value="cost-analysis" className="pt-6 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Default Deductions (%)</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">Pajak</Label>
                  <Input type="number" value={config.pajak} onChange={(e) => update('pajak', e.target.value)} className="bg-background border-border text-foreground text-sm h-9" min={0} max={100} step={0.5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">Founder Fee</Label>
                  <Input type="number" value={config.founderFee} onChange={(e) => update('founderFee', e.target.value)} className="bg-background border-border text-foreground text-sm h-9" min={0} max={100} step={0.5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">Management Fee</Label>
                  <Input type="number" value={config.managementFee} onChange={(e) => update('managementFee', e.target.value)} className="bg-background border-border text-foreground text-sm h-9" min={0} max={100} step={0.5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">SE Fee</Label>
                  <Input type="number" value={config.seFee} onChange={(e) => update('seFee', e.target.value)} className="bg-background border-border text-foreground text-sm h-9" min={0} max={100} step={0.5} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Default TOPP Allocation (%)</h2>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">COGS</Label>
                  <Input type="number" value={config.cogsPct} onChange={(e) => update('cogsPct', e.target.value)} className="bg-background border-border text-foreground text-sm h-9" min={0} max={100} step={5} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">OPEX</Label>
                  <Input type="number" value={config.opexPct} onChange={(e) => update('opexPct', e.target.value)} className="bg-background border-border text-foreground text-sm h-9" min={0} max={100} step={5} />
                </div>
              </div>
              {config.cogsPct + config.opexPct !== 100 && (
                <p className="text-xs text-amber-500 mt-2">COGS + OPEX harus berjumlah 100%</p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9">
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saved ? 'Tersimpan' : 'Simpan Konfigurasi'}
            </Button>
            <Button onClick={handleReset} variant="outline" className="text-xs h-9 border-border">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset ke Default
            </Button>
          </div>
        </TabsContent>

        {/* Tab 2: Leads Status */}
        <TabsContent value="leads-status" className="pt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Daftar Status Lead</h2>
              {renderItemList(leadStatuses, setLeadStatuses)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Leads Category */}
        <TabsContent value="leads-category" className="pt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Daftar Kategori Lead</h2>
              {renderItemList(leadCategories, setLeadCategories)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Project Category */}
        <TabsContent value="project-category" className="pt-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Daftar Kategori Project</h2>
              {renderItemList(projectCategories, setProjectCategories)}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Nomenklatur ID */}
        <TabsContent value="nomenclature" className="pt-6 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nomenklatur ID</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Atur format ID otomatis untuk setiap entitas</p>
                </div>
                <Button onClick={() => openNomenDialog(null)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Entitas</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Prefix</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Tahun</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Sep</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Company</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Proyek</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Digit</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500">Contoh ID</th>
                      <th className="text-left py-2.5 pr-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Impact</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {nomenLoading ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-xs text-zinc-500">Memuat data...</td>
                      </tr>
                    ) : nomenclatures.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-xs text-zinc-500">Belum ada konfigurasi nomenklatur.</td>
                      </tr>
                    ) : (
                      nomenclatures.map((n) => (
                        <tr key={n.id} className="border-b border-zinc-100 dark:border-zinc-800/50">
                          <td className="py-2.5 pr-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{n.entity || '-'}</td>
                          <td className="py-2.5 pr-3">
                            <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{n.prefix}</code>
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-600 dark:text-zinc-400">{n.yearType === 'none' ? '-' : n.yearType}</td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-600 dark:text-zinc-400 font-mono">{n.separator}</td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-600 dark:text-zinc-400">{n.useCompany ? 'Ya' : '-'}</td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-600 dark:text-zinc-400">{n.useProject ? 'Ya' : '-'}</td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-600 dark:text-zinc-400">{n.seqDigits} digit</td>
                          <td className="py-2.5 pr-3">
                            <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {n.example}
                            </code>
                          </td>
                          <td className="py-2.5 pr-3 text-xs text-zinc-500 hidden lg:table-cell max-w-[200px] truncate" title={n.impact}>
                            {n.impact || '-'}
                          </td>
                          <td className="py-2.5 pr-0">
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => openNomenDialog(n.id)}
                                className="p-1.5 rounded text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteNomen(n.id)}
                                className="p-1.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                title="Hapus"
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
        </TabsContent>

        {/* Nomenklatur Dialog */}
        <Dialog open={nomenDialog.open} onOpenChange={(open) => setNomenDialog({ ...nomenDialog, open })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{nomenDialog.editId ? 'Edit' : 'Tambah'} Nomenklatur ID</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Entitas */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">Nama Entitas</Label>
                <Input
                  value={nomenForm.entity}
                  onChange={(e) => setNomenForm({ ...nomenForm, entity: e.target.value })}
                  placeholder="Contoh: Lead, Project, Invoice"
                  className="bg-background border-border text-foreground text-sm"
                />
              </div>

              {/* Prefix */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">Prefix</Label>
                <Input
                  value={nomenForm.prefix}
                  onChange={(e) => setNomenForm({ ...nomenForm, prefix: e.target.value.toUpperCase() })}
                  placeholder="Contoh: PRJ, INV, LEAD"
                  className="bg-background border-border text-foreground text-sm font-mono uppercase"
                  maxLength={6}
                />
              </div>

              {/* Tahun + Separator */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">Format Tahun</Label>
                  <select
                    value={nomenForm.yearType}
                    onChange={(e) => setNomenForm({ ...nomenForm, yearType: e.target.value as any })}
                    className="w-full bg-background border border-border text-foreground text-sm h-9 rounded-md px-2"
                  >
                    <option value="none">Tanpa Tahun</option>
                    <option value="YY">YY — 2 digit (24)</option>
                    <option value="YYYY">YYYY — 4 digit (2024)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">Separator</Label>
                  <select
                    value={nomenForm.separator}
                    onChange={(e) => setNomenForm({ ...nomenForm, separator: e.target.value as any })}
                    className="w-full bg-background border border-border text-foreground text-sm h-9 rounded-md px-2 font-mono"
                  >
                    <option value="-">- (strip)</option>
                    <option value="/">/ (slash)</option>
                    <option value="_">_ (underscore)</option>
                    <option value=".">. (dot)</option>
                  </select>
                </div>
              </div>

              {/* Company + Project */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">Singkatan Company</Label>
                  <select
                    value={nomenForm.useCompany ? 'yes' : 'no'}
                    onChange={(e) => setNomenForm({ ...nomenForm, useCompany: e.target.value === 'yes' })}
                    className="w-full bg-background border border-border text-foreground text-sm h-9 rounded-md px-2"
                  >
                    <option value="no">Tidak</option>
                    <option value="yes">Ya</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-500 dark:text-zinc-400">Singkatan Proyek</Label>
                  <select
                    value={nomenForm.useProject ? 'yes' : 'no'}
                    onChange={(e) => setNomenForm({ ...nomenForm, useProject: e.target.value === 'yes' })}
                    className="w-full bg-background border border-border text-foreground text-sm h-9 rounded-md px-2"
                  >
                    <option value="no">Tidak</option>
                    <option value="yes">Ya</option>
                  </select>
                </div>
              </div>

              {/* Impact */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">Impact / Penggunaan</Label>
                <textarea
                  value={nomenForm.impact}
                  onChange={(e) => setNomenForm({ ...nomenForm, impact: e.target.value })}
                  placeholder="Contoh: Digunakan untuk ID Lead di tabel crm_leads"
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              {/* Digit */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-500 dark:text-zinc-400">Jumlah Digit Sequence</Label>
                <select
                  value={nomenForm.seqDigits}
                  onChange={(e) => setNomenForm({ ...nomenForm, seqDigits: parseInt(e.target.value) })}
                  className="w-full bg-background border border-border text-foreground text-sm h-9 rounded-md px-2"
                >
                  {[3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{d} digit — contoh: {String(1).padStart(d, '0')}</option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                <p className="text-[0.65rem] text-zinc-500 mb-1">Preview:</p>
                <code className="text-sm font-mono text-emerald-600 dark:text-emerald-400">
                  {buildExample(nomenForm)}
                </code>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setNomenDialog({ open: false, editId: null })} className="text-xs h-9">
                  Batal
                </Button>
                <Button onClick={saveNomenForm} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-9">
                  {nomenDialog.editId ? 'Simpan' : 'Tambah'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </Tabs>
      </div>
    )
}
