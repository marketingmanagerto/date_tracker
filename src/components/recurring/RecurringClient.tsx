"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow, formatDistanceStrict } from "date-fns";
import type { RecurringTask } from "@prisma/client";
import { intervalLabel } from "@/lib/recurring-helpers";
import { RecurringForm } from "./RecurringForm";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Pause, Play,
  Timer, Mail, MessageSquare, AlarmClock,
} from "lucide-react";

interface Props {
  tasks: RecurringTask[];
}

function NextFireBadge({ nextFireAt, status }: { nextFireAt: Date; status: string }) {
  if (status === "PAUSED") return <Badge variant="secondary">Paused</Badge>;
  const dist = formatDistanceToNow(new Date(nextFireAt), { addSuffix: true });
  const isPast = new Date(nextFireAt) < new Date();
  return (
    <span className={`text-xs font-medium ${isPast ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"}`}>
      {isPast ? "Pending (next cron)" : `Fires ${dist}`}
    </span>
  );
}

function TaskRow({ task, onEdit, onDelete, onToggle }: {
  task: RecurringTask;
  onEdit: (t: RecurringTask) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, status: string) => void;
}) {
  const isPaused = task.status === "PAUSED";

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border flex items-center gap-3 px-4 py-3 ${isPaused ? "opacity-60" : "border-l-4 border-l-indigo-500"}`}>
      {/* Icon */}
      <div className="shrink-0 h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
        <AlarmClock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{task.title}</p>
          <Badge className="text-xs shrink-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-100">
            {intervalLabel(task.interval, task.intervalValue)}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <NextFireBadge nextFireAt={new Date(task.nextFireAt)} status={task.status} />
          {task.lastFiredAt && (
            <span className="text-xs text-muted-foreground">
              Last: {formatDistanceToNow(new Date(task.lastFiredAt), { addSuffix: true })}
            </span>
          )}
          {/* Notification channel indicators */}
          <span className="flex items-center gap-1.5">
            {task.notifyEmail && <Mail className="h-3 w-3 text-muted-foreground" />}
            {task.notifyDiscord && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
          </span>
        </div>
        {task.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${isPaused ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30" : "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"}`}
          title={isPaused ? "Resume" : "Pause"}
          onClick={() => onToggle(task.id, task.status)}
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function RecurringClient({ tasks: initialTasks }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<RecurringTask[]>(initialTasks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTask | null>(null);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/recurring/${id}`, { method: "DELETE" });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Deleted");
    } else {
      toast.error("Failed to delete");
    }
  }

  async function handleToggle(id: string, currentStatus: string) {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success(nextStatus === "ACTIVE" ? "Resumed" : "Paused");
    } else {
      toast.error("Failed to update");
    }
  }

  function handleSuccess() {
    setDialogOpen(false);
    setEditing(null);
    // Refresh from server
    fetch("/api/recurring")
      .then((r) => r.json())
      .then((data) => setTasks(data))
      .catch(() => null);
    router.refresh();
  }

  const active = tasks.filter((t) => t.status === "ACTIVE");
  const paused = tasks.filter((t) => t.status === "PAUSED");

  return (
    <div className="space-y-5">
      {/* Header stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Timer className="h-4 w-4 text-indigo-500" />
          <span><strong className="text-foreground">{active.length}</strong> active</span>
        </span>
        {paused.length > 0 && (
          <span><strong className="text-foreground">{paused.length}</strong> paused</span>
        )}
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">New recurring reminder</span>
        </Button>
      </div>

      {/* List */}
      {tasks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <AlarmClock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="font-medium text-base">No recurring reminders yet</p>
          <p className="text-sm mt-1">Create one for things like &ldquo;Drink water&rdquo; or &ldquo;Take medication&rdquo;.</p>
          <Button
            className="mt-6 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => { setEditing(null); setDialogOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create your first reminder
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {[...active, ...paused].map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onEdit={(task) => { setEditing(task); setDialogOpen(true); }}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit recurring reminder" : "New recurring reminder"}</DialogTitle>
          </DialogHeader>
          <RecurringForm
            task={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
