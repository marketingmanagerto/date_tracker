export default function ExpensesLoading() {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 animate-pulse">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-6 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-muted" />
          ))}
        </div>
        <div className="h-8 w-28 rounded-lg bg-muted" />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border p-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-muted rounded w-36" />
              <div className="h-3 bg-muted rounded w-52" />
            </div>
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
