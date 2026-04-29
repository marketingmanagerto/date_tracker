"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, differenceInCalendarDays, startOfDay } from "date-fns";
import type { Expense } from "@prisma/client";
import { FREQUENCY_LABELS, expenseSummary } from "@/lib/expenses";
import { urgencyStyle } from "@/lib/utils";
import { ExpenseForm } from "./ExpenseForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, CheckCircle2, CreditCard,
  TrendingUp, Briefcase, User, ReceiptText,
} from "lucide-react";

interface Props {
  expenses: Expense[];
}

const TYPE_TABS = ["PERSONAL", "BUSINESS", "ALL"] as const;
type TypeTab = typeof TYPE_TABS[number];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

function ExpenseRow({ expense, onEdit, onDelete, onMarkPaid }: {
  expense: Expense;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
}) {
  const days = differenceInCalendarDays(
    startOfDay(new Date(expense.nextDueDate)),
    startOfDay(new Date())
  );
  const urgency = urgencyStyle(expense.status === "ACTIVE" ? days : null);
  const isOneTime = expense.frequency === "ONE_TIME";

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border flex items-center gap-3 px-4 py-3 ${urgency.borderClass}`}>
      {/* Type badge */}
      <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${
        expense.type === "PERSONAL"
          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
      }`}>
        {expense.type === "PERSONAL" ? <User size={14} strokeWidth={1.75} /> : <Briefcase size={14} strokeWidth={1.75} />}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{expense.name}</p>
          <Badge variant="outline" className="text-xs shrink-0">{expense.category}</Badge>
          {expense.status !== "ACTIVE" && (
            <Badge variant="secondary" className={`text-xs shrink-0 ${
              expense.status === "PAUSED" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            }`}>{expense.status.toLowerCase()}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <CreditCard size={11} />
            {expense.card}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs text-muted-foreground">{FREQUENCY_LABELS[expense.frequency]}</span>
          <span className="text-muted-foreground text-xs">·</span>
          <span className="text-xs text-muted-foreground">Due {format(new Date(expense.nextDueDate), "MMM d, yyyy")}</span>
        </div>
      </div>

      {/* Amount + urgency */}
      <div className="text-right shrink-0">
        <p className="font-semibold text-sm text-gray-900 dark:text-white">{formatCurrency(Number(expense.amount))}</p>
        {expense.status === "ACTIVE" && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${urgency.pillClass}`}>
            {urgency.label}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {expense.status === "ACTIVE" && !isOneTime && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
            title="Mark as paid"
            onClick={() => onMarkPaid(expense.id)}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(expense)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(expense.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ExpensesClient({ expenses: initialExpenses }: Props) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [tab, setTab] = useState<TypeTab>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const summary = expenseSummary(expenses);

  const filtered = expenses
    .filter((e) => tab === "ALL" || e.type === tab)
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

  async function handleDelete(id: string) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense deleted");
    } else {
      toast.error("Failed to delete expense");
    }
  }

  async function handleMarkPaid(id: string) {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markPaid: true }),
    });
    if (res.ok) {
      const updated = await res.json();
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success("Marked as paid — next due date advanced");
    } else {
      toast.error("Failed to mark as paid");
    }
  }

  function handleSuccess() {
    setDialogOpen(false);
    setEditing(null);
    router.refresh();
    // Re-fetch to get fresh data
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((data) => setExpenses(data))
      .catch(() => null);
  }

  const personalMonthly  = summary.totalMonthlyPersonal;
  const businessMonthly  = summary.totalMonthlyBusiness;
  const totalMonthly     = summary.totalMonthly;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Personal / month</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(personalMonthly)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Business / month</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(businessMonthly)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total / month</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalMonthly)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1">
          {TYPE_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add expense</span>
        </Button>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ReceiptText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium">No expenses yet</p>
          <p className="text-sm">Add your first expense to start tracking.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              onEdit={(ex) => { setEditing(ex); setDialogOpen(true); }}
              onDelete={handleDelete}
              onMarkPaid={handleMarkPaid}
            />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit expense" : "Add expense"}</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editing ?? undefined}
            onSuccess={handleSuccess}
            onCancel={() => { setDialogOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
