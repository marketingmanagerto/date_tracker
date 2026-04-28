"use client";

import { useState, useMemo } from "react";
import type { Category } from "@prisma/client";
import type { ReminderWithCategory } from "@/types";
import { ReminderCard } from "./ReminderCard";
import { ReminderRow } from "./ReminderRow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { daysUntilNext } from "@/lib/rrule-helpers";
import { ICON_MAP } from "@/components/reminders/CategoryIcon";

const STATUS_TABS = ["ACTIVE", "SNOOZED", "ARCHIVED", "ALL"] as const;
type StatusTab = typeof STATUS_TABS[number];

interface Props {
  reminders: ReminderWithCategory[];
  categories: Category[];
}

export function RemindersClient({ reminders, categories }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusTab>("ACTIVE");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");

  const filtered = useMemo(() => {
    return reminders
      .filter((r) => status === "ALL" || r.status === status)
      .filter((r) => !categoryFilter || r.categoryId === categoryFilter)
      .filter((r) => !search || r.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const da = daysUntilNext(a) ?? 9999;
        const db = daysUntilNext(b) ?? 9999;
        return da - db;
      });
  }, [reminders, status, categoryFilter, search]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              status === tab
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={!categoryFilter ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setCategoryFilter(null)}
        >
          All categories
        </Badge>
        {categories.map((cat) => {
          const Icon = ICON_MAP[cat.icon];
          return (
            <Badge
              key={cat.id}
              variant={categoryFilter === cat.id ? "default" : "outline"}
              className="cursor-pointer flex items-center gap-1"
              onClick={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
            >
              {Icon && <Icon size={11} strokeWidth={1.75} />}
              {cat.name}
            </Badge>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="font-medium">No reminders found</p>
          <p className="text-sm">Try adjusting your filters or add a new reminder.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => <ReminderCard key={r.id} reminder={r} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => <ReminderRow key={r.id} reminder={r} />)}
        </div>
      )}
    </div>
  );
}
