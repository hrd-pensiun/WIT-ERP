"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { insForge } from "@/lib/insforge"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!insForge) {
      setIsLoading(false)
      return
    }

    insForge.auth.getCurrentUser().then(({ data }) => {
      if (data.user) {
        router.replace('/crm/pipeline')
        return
      }

      setIsLoading(false)
    })
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
