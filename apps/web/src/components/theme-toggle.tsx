"use client";

import { useTheme } from "@/context/theme-context";

const CYCLE = ["light", "dark", "system"] as const;

type ThemeChoice = (typeof CYCLE)[number];

const LABELS: Record<ThemeChoice, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};

export function ThemeToggle({
  className = "btn btn-secondary theme-toggle",
}: {
  className?: string;
}) {
  const { theme, setTheme, mounted } = useTheme();

  const current: ThemeChoice =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";

  function cycleTheme() {
    const index = CYCLE.indexOf(current);
    const next = CYCLE[(index + 1) % CYCLE.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      className={className}
      onClick={cycleTheme}
      aria-label={`Tema: ${LABELS[current]}. Cambiar tema.`}
      title="Cambiar tema (claro / oscuro / sistema)"
    >
      {mounted ? LABELS[current] : "Tema"}
    </button>
  );
}
