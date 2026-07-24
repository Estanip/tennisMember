"use client";

import { useTheme } from "@/context/theme-context";

export function ThemeToggle({
  className = "btn btn-secondary theme-toggle",
}: {
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? "Claro" : "Oscuro"}
    </button>
  );
}
