"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { insForge } from "@/lib/insforge"

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    if (!insForge) {
      router.replace("/login")
      return
    }

    insForge.auth.getCurrentUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login")
        return
      }

      router.replace("/crm/pipeline")
    })
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Loading...</div>
    </div>
  )
}
