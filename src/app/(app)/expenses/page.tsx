import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";

export const metadata = { title: "Expenses — Remind Me" };

export default async function ExpensesPage() {
  const session = await requireAuth();

  const expenses = await prisma.expense.findMany({
    where: { userId: session.user.id },
    orderBy: { nextDueDate: "asc" },
  });

  return (
    <>
      <TopBar title="Expenses" />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        <ExpensesClient expenses={expenses} />
      </main>
    </>
  );
}
