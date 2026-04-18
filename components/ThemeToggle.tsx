"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative inline-flex items-center justify-center rounded-lg p-2 text-white transition-all hover:bg-card/10 active:scale-95"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative inline-flex items-center justify-center rounded-lg p-2 text-white transition-all hover:bg-card/10 active:scale-95"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 sm:h-6 sm:w-6" />
      ) : (
        <Moon className="h-5 w-5 sm:h-6 sm:w-6" />
      )}
    </button>
  );
}
