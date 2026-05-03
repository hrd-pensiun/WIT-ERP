"use client"

import { useMemo, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type EntityOption = {
  id: string
  code: string
  name: string
  is_headquarters?: boolean
}

type EntitySourcePickerProps = {
  entities: EntityOption[]
  value: string
  onValueChange: (entityId: string) => void
  disabled?: boolean
  label?: string
  placeholder?: string
}

/** Pilih entity sumber (filter ketik = autocomplete) — prioritas kantor pusat di urutan */
export function EntitySourcePicker({
  entities,
  value,
  onValueChange,
  disabled,
  label = "Entity sumber (salin master data)",
  placeholder = "Ketik kode atau nama…",
}: EntitySourcePickerProps) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")

  const selected = entities.find((e) => e.id === value)

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const sorted = [...entities].sort((a, b) => {
      if (a.is_headquarters && !b.is_headquarters) return -1
      if (!a.is_headquarters && b.is_headquarters) return 1
      return a.code.localeCompare(b.code)
    })
    if (!qq) return sorted.slice(0, 12)
    return sorted
      .filter(
        (e) =>
          e.code.toLowerCase().includes(qq) ||
          e.name.toLowerCase().includes(qq)
      )
      .slice(0, 12)
  }, [entities, q])

  return (
    <div className="relative space-y-2">
      <Label className="text-slate-200">{label}</Label>
      <Input
        disabled={disabled}
        placeholder={placeholder}
        value={open ? q : selected ? `${selected.code} — ${selected.name}` : q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
          if (!e.target.value) onValueChange("")
        }}
        onFocus={() => {
          setOpen(true)
          if (selected) setQ("")
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 200)
        }}
        className="border-slate-800 bg-slate-950 text-slate-100"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          className={cn(
            "absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-800 bg-slate-900 py-1 shadow-lg"
          )}
          role="listbox"
        >
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => {
                  onValueChange(e.id)
                  setQ("")
                  setOpen(false)
                }}
              >
                <span className="font-medium text-emerald-400">{e.code}</span>
                <span className="text-slate-300"> — {e.name}</span>
                {e.is_headquarters && (
                  <span className="ml-2 text-xs text-amber-400">Kantor pusat</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
