export default function CommercialDashboardDraft() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mx-auto">
          <span className="text-3xl">📊</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Commercial Dashboard</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          Halaman ini masih dalam tahap pengembangan. Dashboard komersial akan menampilkan ringkasan pipeline, revenue, dan performa project secara real-time.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Draft — dalam pengembangan
        </div>
      </div>
    </div>
  )
}
