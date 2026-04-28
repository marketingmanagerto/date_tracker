import type { Category } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  Cake, Heart, Star, Bell, Briefcase, Car, Home, Plane,
  Stethoscope, GraduationCap, Dog, CreditCard, Scale, Flame,
  Gift, Music, type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  cake: Cake,
  heart: Heart,
  star: Star,
  bell: Bell,
  briefcase: Briefcase,
  car: Car,
  home: Home,
  plane: Plane,
  stethoscope: Stethoscope,
  "graduation-cap": GraduationCap,
  dog: Dog,
  "credit-card": CreditCard,
  scale: Scale,
  flame: Flame,
  gift: Gift,
  music: Music,
};

interface CategoryIconProps {
  category: Pick<Category, "icon" | "color">;
  size?: "sm" | "md" | "lg";
}

export function CategoryIcon({ category, size = "md" }: CategoryIconProps) {
  const Icon = ICON_MAP[category.icon] ?? Star;
  const sizeClass = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : size === "lg" ? 24 : 18;

  return (
    <div
      className={cn("rounded-xl flex items-center justify-center shrink-0", sizeClass)}
      style={{ backgroundColor: `${category.color}22`, border: `1.5px solid ${category.color}44` }}
    >
      <Icon size={iconSize} style={{ color: category.color }} strokeWidth={1.75} />
    </div>
  );
}

export { ICON_MAP };
