import { Skeleton } from "@/components/ui/skeleton";

function SkeletonCard({ rows = 2 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-2xl">
      <SkeletonCard rows={1} />
      <SkeletonCard rows={3} />
      <SkeletonCard rows={2} />
    </div>
  );
}
