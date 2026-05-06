"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Settings2, Tags, Trash2 } from "lucide-react"
import { Performance360Shell } from "@/components/performance/360/shell"
import {
  DEFAULT_ASSESSMENT_CATEGORIES,
  loadAssessmentCategories,
  persistAssessmentCategories,
} from "@/components/performance/360/assessment-categories-storage"
import {
  loadPerf360RaterWeights,
  persistPerf360RaterWeights,
} from "@/components/performance/360/assessment-weights-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function Konfigurasi360View() {
  const [scale, setScale] = useState("5")
  const [wManager, setWManager] = useState("30")
  const [wPeer, setWPeer] = useState("25")
  const [wSub, setWSub] = useState("25")
  const [wSelf, setWSelf] = useState("20")
  const [anon, setAnon] = useState(true)
  const [requiredAll, setRequiredAll] = useState(true)
  const [allowEdit, setAllowEdit] = useState(false)
  const [emailNotif, setEmailNotif] = useState(true)

  const [categories, setCategories] = useState<string[]>(() => [...DEFAULT_ASSESSMENT_CATEGORIES])
  const [newCategoryDraft, setNewCategoryDraft] = useState("")

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setCategories(loadAssessmentCategories())
    const w = loadPerf360RaterWeights()
    setWManager(String(w.manager))
    setWPeer(String(w.peer))
    setWSub(String(w.subordinate))
    setWSelf(String(w.self))
  }, [])

  const saveAll = () => {
    persistAssessmentCategories(categories)
    persistPerf360RaterWeights({
      manager: Number(wManager),
      peer: Number(wPeer),
      subordinate: Number(wSub),
      self: Number(wSelf),
    })
    setSaving(true)
    window.setTimeout(() => setSaving(false), 700)
  }

  const resetDefault = () => {
    setScale("5")
    setWManager("30")
    setWPeer("25")
    setWSub("25")
    setWSelf("20")
    setAnon(true)
    setRequiredAll(true)
    setAllowEdit(false)
    setEmailNotif(true)
    setCategories([...DEFAULT_ASSESSMENT_CATEGORIES])
    persistAssessmentCategories([...DEFAULT_ASSESSMENT_CATEGORIES])
    setNewCategoryDraft("")
  }

  const addCategoryFromDraft = () => {
    const t = newCategoryDraft.trim()
    if (!t) return
    const lowered = categories.map((c) => c.toLowerCase())
    if (lowered.includes(t.toLowerCase())) {
      setNewCategoryDraft("")
      return
    }
    setCategories((prev) => [...prev, t])
    setNewCategoryDraft("")
  }

  const updateCategoryRow = (index: number, value: string) => {
    setCategories((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  const removeCategoryRow = (index: number) => {
    setCategories((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  return (
    <Performance360Shell
      title="Konfigurasi sistem"
      subtitle="Pengaturan skala rating, bobot, dan perilaku assessment (mock — belum tersimpan ke backend)."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ConfigCard icon={<Settings2 className="w-5 h-5 text-cyan-400" />} title="Konfigurasi penilaian">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Label className="text-slate-300">Skala rating default</Label>
              <Select value={scale} onValueChange={setScale}>
                <SelectTrigger className="w-full sm:w-[140px] bg-slate-950 border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">1–5</SelectItem>
                  <SelectItem value="10">1–10</SelectItem>
                  <SelectItem value="4">1–4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <WeightField label="Bobot atasan (%)" value={wManager} onChange={setWManager} />
            <WeightField label="Bobot rekan (%)" value={wPeer} onChange={setWPeer} />
            <WeightField label="Bobot bawahan (%)" value={wSub} onChange={setWSub} />
            <WeightField label="Bobot self (%)" value={wSelf} onChange={setWSelf} />
          </div>
        </ConfigCard>

        <ConfigCard icon={<span className="text-lg">⏱️</span>} title="Pengaturan assessment">
          <div className="space-y-4">
            <ToggleRow label="Izinkan anonymous feedback" checked={anon} onCheckedChange={setAnon} />
            <ToggleRow label="Wajib isi semua pertanyaan" checked={requiredAll} onCheckedChange={setRequiredAll} />
            <ToggleRow label="Izinkan edit setelah submit" checked={allowEdit} onCheckedChange={setAllowEdit} />
            <ToggleRow label="Notifikasi email otomatis" checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
        </ConfigCard>
      </div>

      <ConfigCard icon={<Tags className="w-5 h-5 text-amber-400" />} title="Kategori penilaian">
        <p className="text-sm text-slate-500 mb-4">
          Daftar ini dipakai sebagai pilihan dropdown <span className="text-slate-400">Kategori</span> saat membuat
          template penilaian 360. Simpan konfigurasi untuk menerapkan perubahan ke browser ini.
        </p>
        <div className="space-y-3">
          {categories.map((label, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <span className="text-slate-500 text-sm w-8 shrink-0">{index + 1}.</span>
                <Input
                  value={label}
                  onChange={(e) => updateCategoryRow(index, e.target.value)}
                  placeholder="Nama kategori"
                  className="flex-1 bg-slate-950 border-slate-800 text-slate-100"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                  onClick={() => removeCategoryRow(index)}
                  disabled={categories.length <= 1}
                  aria-label="Hapus kategori"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center pt-2 border-t border-slate-800">
            <Input
              value={newCategoryDraft}
              onChange={(e) => setNewCategoryDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addCategoryFromDraft()
                }
              }}
              placeholder="Kategori baru…"
              className="flex-1 bg-slate-950 border-slate-800 text-slate-100"
            />
            <Button type="button" variant="outline" className="border-slate-700 shrink-0" onClick={addCategoryFromDraft}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>
      </ConfigCard>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6 flex flex-wrap gap-3">
          <Button className="bg-emerald-600 hover:bg-emerald-700" type="button" onClick={saveAll} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Simpan semua konfigurasi
          </Button>
          <Button type="button" variant="outline" className="border-slate-700" onClick={resetDefault}>
            Reset ke default
          </Button>
        </CardContent>
      </Card>
    </Performance360Shell>
  )
}

function ConfigCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-slate-100 text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function WeightField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <Label className="text-slate-300">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full sm:w-24 bg-slate-950 border-slate-800"
      />
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-300 text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
