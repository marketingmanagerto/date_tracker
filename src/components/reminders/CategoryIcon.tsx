import type { Category } from "@prisma/client";
import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: Pick<Category, "icon" | "color">;
  size?: "sm" | "md" | "lg";
}

export function CategoryIcon({ category, size = "md" }: CategoryIconProps) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-sm" : size === "lg" ? "h-12 w-12 text-2xl" : "h-9 w-9 text-lg";
  return (
    <div
      className={cn("rounded-xl flex items-center justify-center shrink-0", sizeClass)}
      style={{ backgroundColor: `${category.color}22`, border: `1.5px solid ${category.color}44` }}
    >
      <span>{category.icon}</span>
    </div>
  );
}
