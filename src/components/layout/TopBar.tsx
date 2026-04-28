"use client";

import { MobileNav } from "./Sidebar";
import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="h-16 border-b flex items-center justify-between px-4 md:px-6 bg-white dark:bg-gray-950 shrink-0">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-gray-500 dark:text-gray-400"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <div className="h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center">
          <Bell className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
    </header>
  );
}
