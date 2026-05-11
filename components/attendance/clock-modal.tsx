"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Camera, MapPin, Clock, CheckCircle2, Loader2,
  AlertCircle, RefreshCw, LogIn, LogOut,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import { uploadAttendanceSelfie } from "@/lib/attendance-upload"
import { useAttendance } from "@/hooks/useAttendance"

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase    = "loading" | "check-in" | "check-out" | "done"
type GeoState = "loading" | "found" | "denied" | "skipped"
type CamState = "starting" | "streaming" | "captured" | "fallback"

interface GeoData { lat: number; lng: number; label: string }
interface TodayRecord { id: string; check_in: string; check_out: string | null }

// ── Reverse geocode via Nominatim ─────────────────────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "id" } }
    )
    const json = await res.json()
    return (json.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }
}

// ── ClockModal ────────────────────────────────────────────────────────────────
export function ClockModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const tenantId = getTenantId()
  const { checkInFull, checkOutFull, getTodayRecord } = useAttendance(tenantId)

  // State
  const [phase, setPhase]         = useState<Phase>("loading")
  const [todayRec, setTodayRec]   = useState<TodayRecord | null>(null)
  const [userProfileId, setUPId]  = useState<string | null>(null)
  const [camState, setCamState]   = useState<CamState>("starting")
  const [geoState, setGeoState]   = useState<GeoState>("loading")
  const [geo, setGeo]             = useState<GeoData | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [capturedUrl, setCapturedUrl]   = useState<string | null>(null)
  const [reason, setReason]       = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [nowStr, setNowStr]       = useState("")

  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Live clock
  useEffect(() => {
    const tick = () => setNowStr(
      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── On open: load user profile + today record ─────────────────────────────
  useEffect(() => {
    if (!open) return
    setPhase("loading")
    setReason("")
    setCapturedBlob(null)
    setCapturedUrl(null)
    setSubmitError(null)
    setGeo(null)
    setGeoState("loading")
    setCamState("starting")

    ;(async () => {
      try {
        if (!insForge || !user?.id) { setPhase("check-in"); return }

        // Try by user_id first, then fallback by email
        let pid: string | null = null

        const { data: byUid } = await (insForge as any)
          .from("user_profiles")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("user_id", user.id)
          .maybeSingle()

        pid = byUid?.id ?? null

        if (!pid && user.email) {
          const { data: byEmail } = await (insForge as any)
            .from("user_profiles")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("email", user.email)
            .maybeSingle()
          pid = byEmail?.id ?? null
        }

        setUPId(pid)

        if (pid) {
          const rec = await getTodayRecord(pid) as TodayRecord | null
          setTodayRec(rec)
          setPhase(rec?.check_in && !rec?.check_out ? "check-out" : "check-in")
        } else {
          // Show error but still allow check-in attempt
          setSubmitError("Profil karyawan tidak ditemukan — hubungi HR Admin")
          setPhase("check-in")
        }
      } catch (e: any) {
        setSubmitError(e?.message ?? "Gagal memuat profil")
        setPhase("check-in")
      }
    })()
  }, [open, user?.id]) // eslint-disable-line

  // ── Start camera when phase is ready ─────────────────────────────────────
  useEffect(() => {
    if (!open || phase === "loading" || phase === "done") return
    setCamState("starting")
    setCapturedBlob(null)
    setCapturedUrl(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("fallback")
      return
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setCamState("streaming")
      })
      .catch(() => setCamState("fallback"))

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open, phase])

  // ── Geolocation ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || phase === "loading" || phase === "done") return
    if (!navigator.geolocation) { setGeoState("skipped"); return }

    setGeoState("loading")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const label = await reverseGeocode(lat, lng)
        setGeo({ lat, lng, label })
        setGeoState("found")
      },
      () => setGeoState("denied"),
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [open, phase])

  // ── Capture photo from video ──────────────────────────────────────────────
  const capturePhoto = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext("2d")?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (!blob) return
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setCapturedBlob(blob)
      setCapturedUrl(URL.createObjectURL(blob))
      setCamState("captured")
    }, "image/jpeg", 0.85)
  }, [])

  const retakePhoto = useCallback(() => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    setCapturedBlob(null)
    setCapturedUrl(null)
    setCamState("starting")

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setCamState("streaming")
      })
      .catch(() => setCamState("fallback"))
  }, [capturedUrl])

  // ── Handle file input fallback ────────────────────────────────────────────
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCapturedBlob(file)
    setCapturedUrl(URL.createObjectURL(file))
    setCamState("captured")
  }, [])

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!userProfileId && phase === "check-in") {
      setSubmitError("Profil karyawan tidak ditemukan")
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      let photo_url: string | undefined
      if (capturedBlob) {
        photo_url = await uploadAttendanceSelfie(
          capturedBlob, tenantId, userProfileId ?? "anon",
          phase === "check-in" ? "checkin" : "checkout"
        )
      }

      const geoPayload = geo
        ? { lat: geo.lat, lng: geo.lng, location: geo.label }
        : {}

      if (phase === "check-in") {
        await checkInFull(userProfileId!, {
          ...geoPayload,
          reason: reason.trim() || undefined,
          photo_url,
        })
      } else if (phase === "check-out" && todayRec) {
        await checkOutFull(todayRec.id, todayRec.check_in, {
          ...geoPayload,
          reason: reason.trim() || undefined,
          photo_url,
        })
      }

      setPhase("done")
    } catch (err: any) {
      setSubmitError(err.message ?? "Terjadi kesalahan")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Cleanup on close ──────────────────────────────────────────────────────
  const handleClose = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (capturedUrl) URL.revokeObjectURL(capturedUrl)
    onClose()
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const isCheckIn  = phase === "check-in"
  const canSubmit  = (camState === "captured" || camState === "fallback") && !submitting
  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              isCheckIn ? "bg-emerald-500/15 text-emerald-500" : "bg-blue-500/15 text-blue-400"
            }`}>
              {isCheckIn ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
            </div>
            <div>
              <DialogTitle className="text-base leading-tight">
                {phase === "loading" ? "Memuat..." : phase === "done"
                  ? (isCheckIn ? "Clock In Berhasil" : "Clock Out Berhasil")
                  : (isCheckIn ? "Clock In" : "Clock Out")}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-bold tabular-nums text-foreground">{nowStr}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Loading state */}
          {phase === "loading" && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Done state */}
          {phase === "done" && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {isCheckIn ? "Selamat bekerja! Absensi masuk tercatat." : "Terima kasih! Absensi pulang tercatat."}
              </p>
              <Button onClick={handleClose} className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                Tutup
              </Button>
            </div>
          )}

          {/* Active: camera + geo + reason */}
          {(phase === "check-in" || phase === "check-out") && (
            <>
              {/* Camera area */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                {/* Video stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${
                    camState === "streaming" ? "block" : "hidden"
                  }`}
                />

                {/* Captured image */}
                {capturedUrl && camState === "captured" && (
                  <img src={capturedUrl} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" />
                )}

                {/* Starting / fallback */}
                {(camState === "starting" || camState === "fallback") && !capturedUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
                    {camState === "starting"
                      ? <><Loader2 className="w-6 h-6 animate-spin" /><span className="text-xs">Memuat kamera...</span></>
                      : <><Camera className="w-6 h-6" /><span className="text-xs">Kamera tidak tersedia</span></>
                    }
                  </div>
                )}

                {/* Capture / retake overlay button */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-2">
                  {camState === "streaming" && (
                    <button
                      onClick={capturePhoto}
                      className="w-12 h-12 rounded-full bg-white border-4 border-white/30 hover:scale-105 transition-transform shadow-lg"
                      title="Ambil foto"
                    />
                  )}
                  {camState === "captured" && (
                    <button
                      onClick={retakePhoto}
                      className="flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Ulangi
                    </button>
                  )}
                  {camState === "fallback" && !capturedUrl && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-white/20 text-white text-xs px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" /> Pilih Foto
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Hidden file input fallback */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileInput}
              />

              {/* Geolocation row */}
              <div className="flex items-start gap-2 text-sm">
                {geoState === "loading" && (
                  <><Loader2 className="w-3.5 h-3.5 mt-0.5 shrink-0 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground text-xs">Mengambil lokasi...</span></>
                )}
                {geoState === "found" && geo && (
                  <><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                  <span className="text-xs text-foreground line-clamp-2">{geo.label}</span></>
                )}
                {(geoState === "denied" || geoState === "skipped") && (
                  <><AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Lokasi tidak tersedia — akan diabaikan</span></>
                )}
              </div>

              {/* Reason */}
              <Textarea
                placeholder="Keterangan (opsional) — misal: WFH, Dinas Luar..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />

              {/* Error */}
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button variant="ghost" onClick={handleClose} disabled={submitting} className="flex-1 text-muted-foreground">
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`flex-1 text-white gap-1.5 ${
                    isCheckIn
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                    : isCheckIn
                      ? <><LogIn className="w-4 h-4" />Clock In</>
                      : <><LogOut className="w-4 h-4" />Clock Out</>
                  }
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
