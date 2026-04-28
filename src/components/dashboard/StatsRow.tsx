interface StatsRowProps {
  totalActive: number;
  dueThisWeek: number;
  overdueCount: number;
  monthCount: number;
}

export function StatsRow({ totalActive, dueThisWeek, overdueCount, monthCount }: StatsRowProps) {
  const stats = [
    { label: "Active reminders", value: totalActive, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Due this week", value: dueThisWeek, color: "text-amber-600 dark:text-amber-400" },
    { label: "Needs attention", value: overdueCount, color: overdueCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400" },
    { label: "This month", value: monthCount, color: "text-blue-600 dark:text-blue-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
          <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
