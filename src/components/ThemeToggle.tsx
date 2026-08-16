"use client";

import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-muted px-1 transition-colors hover:border-foreground/30"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-sm"
        style={{ marginLeft: isDark ? "auto" : 0 }}
      >
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-accent" />
          ) : (
            <Sun className="h-4 w-4 text-accent" />
          )}
        </motion.span>
      </motion.span>
    </button>
  );
}
