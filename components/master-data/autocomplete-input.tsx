"use client"

import { Input } from "@/components/ui/input"
import type { ComponentProps } from "react"

type AutocompleteInputProps = Omit<ComponentProps<typeof Input>, "list"> & {
  /** untuk mengaitkan ke <datalist> */
  datalistId: string
  suggestions: string[]
}

/** Input dengan datalist HTML5 untuk autocomplete master data (kota, provinsi, dll.) */
export function AutocompleteInput({
  datalistId,
  suggestions,
  ...props
}: AutocompleteInputProps) {
  return (
    <>
      <Input list={datalistId} {...props} />
      <datalist id={datalistId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  )
}
