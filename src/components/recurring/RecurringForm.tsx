"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, BellRing } from "lucide-react";
import { toast } from "sonner";

import { createRecurringTaskSchema, type CreateRecurringTaskInput } from "@/lib/validations";
import type { RecurringTask } from "@prisma/client";
import { useTestNotification } from "@/hooks/useTestNotification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface RecurringFormProps {
  task?: RecurringTask;
  onSuccess: () => void;
  onCancel: () => void;
}

const INTERVALS = [
  { value: "HOURLY",  label: "Hour(s)" },
  { value: "DAILY",   label: "Day(s)"  },
  { value: "WEEKLY",  label: "Week(s)" },
  { value: "MONTHLY", label: "Month(s)"},
  { value: "YEARLY",  label: "Year(s)" },
] as const;

export function RecurringForm({ task, onSuccess, onCancel }: RecurringFormProps) {
  const [saving, setSaving] = useState(false);
  const isEdit = !!task;
  const { sendTest, testing } = useTestNotification();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateRecurringTaskInput>({
    resolver: zodResolver(createRecurringTaskSchema),
    defaultValues: {
      title:         task?.title ?? "",
      notes:         task?.notes ?? "",
      interval:      task?.interval ?? "DAILY",
      intervalValue: task?.intervalValue ?? 1,
      notifyEmail:   task?.notifyEmail ?? true,
      notifyDiscord: task?.notifyDiscord ?? false,
    },
  });

  const interval      = watch("interval");
  const notifyEmail   = watch("notifyEmail");
  const notifyDiscord = watch("notifyDiscord");

  async function onSubmit(data: CreateRecurringTaskInput) {
    setSaving(true);
    const url    = isEdit ? `/api/recurring/${task!.id}` : "/api/recurring";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error?.message || "Something went wrong");
      return;
    }
    toast.success(isEdit ? "Updated!" : "Recurring reminder created!");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">What should I remind you?</Label>
        <Input id="title" placeholder="e.g. Drink water, Take medication, Check emails" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Interval */}
      <div className="space-y-1.5">
        <Label>Repeat every</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={99}
            className="w-20 shrink-0"
            {...register("intervalValue")}
          />
          <Select value={interval} onValueChange={(v) => setValue("interval", v as CreateRecurringTaskInput["interval"])}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INTERVALS.map((i) => (
                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {errors.intervalValue && <p className="text-xs text-destructive">{errors.intervalValue.message}</p>}
        <p className="text-xs text-muted-foreground">
          {interval === "HOURLY"
            ? "Notifications fire on the hour. Cron runs every hour — set to 1 for hourly pings."
            : "Cron runs hourly and fires at the right time."}
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Note <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea id="notes" placeholder="Any extra context for this reminder…" rows={2} {...register("notes")} />
      </div>

      {/* Notifications */}
      <div className="space-y-3 pt-1 border-t">
        <p className="text-sm font-medium pt-2">Notify via</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Email</p>
            <p className="text-xs text-muted-foreground">Sends an email each time this fires</p>
          </div>
          <Switch checked={notifyEmail} onCheckedChange={(v) => setValue("notifyEmail", v)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Discord</p>
            <p className="text-xs text-muted-foreground">Requires Discord webhook in Settings</p>
          </div>
          <Switch checked={notifyDiscord} onCheckedChange={(v) => setValue("notifyDiscord", v)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create reminder"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          type="button"
          variant="outline"
          disabled={testing}
          onClick={() => sendTest(watch("title"), watch("notes") ?? undefined)}
          className="ml-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950/30"
        >
          {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
          Test notification
        </Button>
      </div>
    </form>
  );
}
