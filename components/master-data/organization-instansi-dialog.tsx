"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type EntityItem = { id: string; code: string; name: string }

type OrganizationInstansiDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entities: EntityItem[]
  entitiesLoading: boolean
  /** Nilai instansi yang dipilih di dropdown */
  value: string
  onValueChange: (id: string) => void
  onConfirm: () => void
  /** Jika true, dialog tidak bisa ditutup tanpa konfirmasi (first-time SuperAdmin) */
  mandatory: boolean
  confirmLabel?: string
}

export function OrganizationInstansiDialog({
  open,
  onOpenChange,
  entities,
  entitiesLoading,
  value,
  onValueChange,
  onConfirm,
  mandatory,
  confirmLabel = "Lanjutkan",
}: OrganizationInstansiDialogProps) {
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setLocalError(null)
  }, [open])

  const handleConfirm = () => {
    if (!value) {
      setLocalError("Pilih instansi terlebih dahulu.")
      return
    }
    setLocalError(null)
    onConfirm()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md border-slate-800 bg-slate-900 text-slate-100"
        showCloseButton={!mandatory}
        onPointerDownOutside={(e) => {
          if (mandatory) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (mandatory) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-slate-100">Pilih instansi</DialogTitle>
          <DialogDescription className="text-slate-400">
            Sebagai SuperAdmin, tentukan instansi mana yang akan dikelola untuk
            struktur organisasi. Pilihan ini dipakai sebagai default untuk
            penambahan departemen, divisi, dan jabatan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label className="text-slate-200">Instansi</Label>
          <Select
            value={value}
            onValueChange={onValueChange}
            disabled={entitiesLoading || entities.length === 0}
          >
            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 w-full">
              <SelectValue
                placeholder={
                  entitiesLoading ? "Memuat..." : "Pilih instansi / entity"
                }
              />
            </SelectTrigger>
            <SelectContent className="border-slate-800 bg-slate-900">
              {entities.map((ent) => (
                <SelectItem key={ent.id} value={String(ent.id)}>
                  {ent.code} — {ent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {localError && (
            <p className="text-sm text-red-400">{localError}</p>
          )}
          {!entitiesLoading && entities.length === 0 && (
            <p className="text-sm text-amber-400">
              Belum ada data entity. Tambahkan di Master Data → Entity terlebih
              dahulu.
            </p>
          )}
        </div>

        <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-end">
          {!mandatory && (
            <Button
              type="button"
              variant="ghost"
              className="text-slate-400"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
          )}
          <Button
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleConfirm}
            disabled={entitiesLoading || entities.length === 0}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
