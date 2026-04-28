import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <p className="text-6xl">🔍</p>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
        <ButtonLink href="/dashboard">Back to Dashboard</ButtonLink>
      </div>
    </div>
  );
}
