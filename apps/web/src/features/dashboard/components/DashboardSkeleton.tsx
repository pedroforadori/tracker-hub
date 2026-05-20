export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-3 w-40 rounded bg-muted" />
        <div className="mt-2 h-8 w-32 rounded bg-muted" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
            <div className="h-4 w-4 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-border bg-card p-6 h-72" />
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-4 h-24 rounded-xl bg-muted" />
          <div className="h-24 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
