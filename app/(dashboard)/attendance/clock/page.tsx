"use client"

import { useRouter } from "next/navigation"
import { ClockModal } from "@/components/attendance/clock-modal"

export default function ClockPage() {
  const router = useRouter()
  return <ClockModal open={true} onClose={() => router.back()} />
}
