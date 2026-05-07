"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"
import { insForge } from "@/lib/insforge"

export default function LoginPage() {
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!insForge) return
    insForge.auth.getCurrentUser().then(({ data }) => {
      if (data.user) window.location.href = "/"
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const result = await signIn(email, password)
    if (result.success) {
      window.location.href = "/"
    } else {
      setError(result.error || "Login failed")
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #0d1b3e 0%, #0a2a35 45%, #063535 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 px-8 py-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-5xl font-black text-slate-900 tracking-tight leading-none">
              WIT<span className="text-red-500">.</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </div>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full h-12 px-4 rounded-xl bg-slate-100 text-slate-900 placeholder:text-slate-400 border-0 outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm transition-shadow"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full h-12 px-4 pr-11 rounded-xl bg-slate-100 text-slate-900 placeholder:text-slate-400 border-0 outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm transition-shadow"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                  : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold text-sm tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in…
                </span>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a
              href="#"
              className="text-sm font-medium text-slate-700 hover:text-slate-500 transition-colors"
            >
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
