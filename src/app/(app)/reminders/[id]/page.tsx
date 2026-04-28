import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CategoryIcon } from "@/components/reminders/CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { urgencyStyle, priorityStyle, formatDate, formatDateShort } from "@/lib/utils";
import { daysUntilNext, recurrenceLabel } from "@/lib/rrule-helpers";
import { EditIcon } from "lucide-react";
import { DeleteReminderButton } from "@/components/reminders/DeleteReminderButton";

export default async function ReminderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  const reminder = await prisma.reminder.findFirst({
    where: { id, userId: session.user.id },
    include: { category: true },
  });

  if (!reminder) notFound();

  const days = daysUntilNext(reminder);
  const urgency = urgencyStyle(days);
  const priority = priorityStyle(reminder.priority);
  const recurrence = recurrenceLabel(reminder.recurrenceType, reminder.rruleString);

  return (
    <>
      <TopBar title={reminder.title} />
      <main className="flex-1 p-4 md:p-6 max-w-2xl space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <CategoryIcon category={reminder.category} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{reminder.title}</h2>
                  <p className="text-sm text-muted-foreground">{reminder.category.name}</p>
                </div>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${urgency.pillClass}`}>
                {urgency.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                <p className="font-medium text-sm">{formatDateShort(reminder.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Repeats</p>
                <p className="font-medium text-sm">{recurrence}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Priority</p>
                <Badge variant="secondary" className={`text-xs ${priority.class}`}>{priority.label}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notify</p>
                <p className="font-medium text-sm">{reminder.advanceDays} day{reminder.advanceDays !== 1 ? "s" : ""} before</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                <Badge variant="outline" className="text-xs capitalize">{reminder.status.toLowerCase()}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Added</p>
                <p className="font-medium text-sm">{formatDate(reminder.createdAt, "MMM d, yyyy")}</p>
              </div>
            </div>

            {reminder.notes && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reminder.notes}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <ButtonLink href={`/reminders/${reminder.id}/edit`} size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </ButtonLink>
              <DeleteReminderButton reminderId={reminder.id} />
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
