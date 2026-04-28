"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-5xl">⚠️</p>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} variant="outline">Try again</Button>
      </div>
    </div>
  );
}
