"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createExpenseSchema, type CreateExpenseInput } from "@/lib/validations";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";
import type { Expense } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ExpenseFormProps {
  expense?: Expense;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExpenseForm({ expense, onSuccess, onCancel }: ExpenseFormProps) {
  const [saving, setSaving] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const isEdit = !!expense;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      name:        expense?.name ?? "",
      amount:      expense ? Number(expense.amount) : undefined,
      type:        expense?.type ?? "PERSONAL",
      card:        expense?.card ?? "",
      frequency:   expense?.frequency ?? "MONTHLY",
      nextDueDate: expense ? new Date(expense.nextDueDate) : new Date(),
      category:    expense?.category ?? "",
      notes:       expense?.notes ?? "",
      status:      expense?.status ?? "ACTIVE",
    },
  });

  const selectedDate = watch("nextDueDate");
  const selectedType = watch("type");
  const selectedFrequency = watch("frequency");

  async function onSubmit(data: CreateExpenseInput) {
    setSaving(true);
    const url    = isEdit ? `/api/expenses/${expense!.id}` : "/api/expenses";
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
    toast.success(isEdit ? "Expense updated!" : "Expense added!");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div className="space-y-1.5">
        <Label>Type</Label>
        <div className="flex gap-2">
          {(["PERSONAL", "BUSINESS"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue("type", t)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium border transition-colors",
                selectedType === t
                  ? t === "PERSONAL"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-emerald-600 text-white border-emerald-600"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              )}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g. Netflix, AWS, Office Rent" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Amount + Frequency */}
      <div className="flex gap-3">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="amount">Amount ($)</Label>
          <Input id="amount" type="number" step="0.01" min="0" placeholder="0.00" {...register("amount")} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1.5 flex-1">
          <Label>Frequency</Label>
          <Select value={selectedFrequency} onValueChange={(v) => setValue("frequency", v as CreateExpenseInput["frequency"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
              <SelectItem value="ONE_TIME">One-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Card */}
      <div className="space-y-1.5">
        <Label htmlFor="card">Card / Payment method</Label>
        <Input id="card" placeholder="e.g. Visa 4242, Amex Gold, Bank Transfer" {...register("card")} />
        {errors.card && <p className="text-xs text-destructive">{errors.card.message}</p>}
      </div>

      {/* Category + Next due */}
      <div className="flex gap-3">
        <div className="space-y-1.5 flex-1">
          <Label>Category</Label>
          <Select
            value={watch("category") || undefined}
            onValueChange={(v) => v && setValue("category", v)}
          >
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>
        <div className="space-y-1.5 flex-1">
          <Label>Next due date</Label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger
              className={cn(
                "inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-border bg-background px-3 text-sm font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {selectedDate ? format(new Date(selectedDate), "MMM d, yyyy") : "Pick a date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(d) => { if (d) { setValue("nextDueDate", d); setDateOpen(false); } }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.nextDueDate && <p className="text-xs text-destructive">{errors.nextDueDate.message}</p>}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Any extra details…" rows={2} {...register("notes")} />
      </div>

      {/* Status (edit only) */}
      {isEdit && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            defaultValue={expense.status}
            onValueChange={(v) => setValue("status", v as CreateExpenseInput["status"])}
          >
            <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PAUSED">Paused</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Add expense"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
