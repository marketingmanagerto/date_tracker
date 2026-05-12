export default function RecurringLoading() {
  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl space-y-5 animate-pulse">
      <div className="h-4 w-64 bg-muted rounded" />
      <div className="flex justify-between items-center">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-8 w-40 bg-muted rounded-lg" />
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-4 bg-muted rounded w-16" />
              </div>
              <div className="h-3 bg-muted rounded w-40" />
            </div>
            <div className="flex gap-1">
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
