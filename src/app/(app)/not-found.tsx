import { ButtonLink } from "@/components/ui/button-link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
            <SearchX className="h-7 w-7 text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
        <ButtonLink href="/dashboard">Back to Dashboard</ButtonLink>
      </div>
    </div>
  );
}
