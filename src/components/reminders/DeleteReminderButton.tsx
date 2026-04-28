"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteReminderButton({ reminderId }: { reminderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this reminder? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/reminders/${reminderId}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      toast.success("Reminder deleted");
      router.push("/reminders");
      router.refresh();
    } else {
      toast.error("Failed to delete");
    }
  }

  return (
    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={loading}>
      <Trash2 className="mr-2 h-4 w-4" />
      {loading ? "Deleting..." : "Delete"}
    </Button>
  );
}
