"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { createReminderSchema, type CreateReminderInput } from "@/lib/validations";
import type { Category } from "@prisma/client";
import type { ReminderWithCategory } from "@/types";
import { ICON_MAP } from "@/components/reminders/CategoryIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ReminderFormProps {
  categories: Category[];
  reminder?: ReminderWithCategory;
  onSuccess?: () => void;
}

type Tab = "one-time" | "recurring";

const RECURRENCE_OPTIONS = [
  { value: "DAILY",   label: "Every day" },
  { value: "WEEKLY",  label: "Every week" },
  { value: "MONTHLY", label: "Every month" },
  { value: "YEARLY",  label: "Every year" },
  { value: "CUSTOM",  label: "Custom (RRule)" },
] as const;

export function ReminderForm({ categories, reminder, onSuccess }: ReminderFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const isEdit = !!reminder;
  const initialTab: Tab = !reminder || reminder.recurrenceType === "NONE" ? "one-time" : "recurring";
  const [tab, setTab] = useState<Tab>(initialTab);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateReminderInput>({
    resolver: zodResolver(createReminderSchema),
    defaultValues: {
      title: reminder?.title ?? "",
      categoryId: reminder?.categoryId ?? "",
      date: reminder ? new Date(reminder.date) : new Date(),
      isAllDay: reminder?.isAllDay ?? true,
      recurrenceType: reminder?.recurrenceType ?? "NONE",
      rruleString: reminder?.rruleString ?? "",
      advanceDays: reminder?.advanceDays ?? 7,
      notes: reminder?.notes ?? "",
      status: reminder?.status ?? "ACTIVE",
    },
  });

  const selectedDate = watch("date");
  const recurrenceType = watch("recurrenceType");
  const selectedCategoryId = watch("categoryId");

  // Auto-switch tab when a category with a default recurrence is selected
  useEffect(() => {
    if (!selectedCategoryId) return;
    const cat = categories.find((c) => c.id === selectedCategoryId) as (Category & { defaultRecurrence?: string }) | undefined;
    if (cat && cat.defaultRecurrence && cat.defaultRecurrence !== "NONE") {
      setTab("recurring");
      setValue("recurrenceType", cat.defaultRecurrence as CreateReminderInput["recurrenceType"]);
    }
  }, [selectedCategoryId, categories, setValue]);

  function handleTabChange(value: string) {
    const next = value as Tab;
    setTab(next);
    if (next === "one-time") {
      setValue("recurrenceType", "NONE");
    } else if (recurrenceType === "NONE") {
      setValue("recurrenceType", "YEARLY");
    }
  }

  async function onSubmit(data: CreateReminderInput) {
    setSaving(true);
    const url = isEdit ? `/api/reminders/${reminder.id}` : "/api/reminders";
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

    toast.success(isEdit ? "Reminder updated!" : "Reminder created!");
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/reminders");
      router.refresh();
    }
  }

  // Shared fields rendered in both tabs
  const sharedFields = (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="e.g. Mom's Birthday, Car Insurance Renewal" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={watch("categoryId") || undefined} onValueChange={(v) => v && setValue("categoryId", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => {
              const Icon = ICON_MAP[cat.icon];
              return (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    {Icon && <Icon size={14} strokeWidth={1.75} style={{ color: cat.color }} />}
                    <span>{cat.name}</span>
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label>{tab === "recurring" ? "Start date" : "Date"}</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger
            className={cn(
              "inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-border bg-background px-3 text-sm font-normal",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {selectedDate ? format(new Date(selectedDate), "PPP") : "Pick a date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(d) => { if (d) { setValue("date", d); setDateOpen(false); } }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>
    </div>
  );

  const bottomFields = (
    <div className="space-y-5">
      {/* Advance notice */}
      <div className="space-y-1.5">
        <Label htmlFor="advanceDays">Remind me (days before)</Label>
        <Input id="advanceDays" type="number" min={0} max={365} className="w-32" {...register("advanceDays")} />
        {errors.advanceDays && <p className="text-xs text-destructive">{errors.advanceDays.message}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Any extra details..." rows={3} {...register("notes")} />
      </div>

      {/* Status (edit only) */}
      {isEdit && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            defaultValue={reminder.status}
            onValueChange={(v) => setValue("status", v as CreateReminderInput["status"])}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SNOOZED">Snoozed</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="one-time" className="flex-1">One Time</TabsTrigger>
          <TabsTrigger value="recurring" className="flex-1">Recurring</TabsTrigger>
        </TabsList>

        <TabsContent value="one-time" className="mt-5 space-y-5">
          {sharedFields}
        </TabsContent>

        <TabsContent value="recurring" className="mt-5 space-y-5">
          {sharedFields}

          {/* Recurrence frequency */}
          <div className="space-y-1.5">
            <Label>Repeats</Label>
            <Select
              value={recurrenceType === "NONE" ? "YEARLY" : recurrenceType}
              onValueChange={(v) => setValue("recurrenceType", v as CreateReminderInput["recurrenceType"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom RRule */}
          {recurrenceType === "CUSTOM" && (
            <div className="space-y-1.5">
              <Label htmlFor="rruleString">RRule string</Label>
              <Input
                id="rruleString"
                placeholder="e.g. FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=15"
                {...register("rruleString")}
              />
              <p className="text-xs text-muted-foreground">RFC 5545 RRULE format for complex patterns.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {bottomFields}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create reminder"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
