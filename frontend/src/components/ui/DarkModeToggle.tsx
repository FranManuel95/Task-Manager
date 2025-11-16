// src/components/ui/DarkModeToggle.tsx
import { useEffect, useState } from "react";

function getInitialTheme(): "light" | "dark" {
  const stored = (typeof window !== "undefined" &&
    localStorage.getItem("theme")) as "light" | "dark" | null;
  if (stored) return stored;
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}

export default function DarkModeToggle({
  className = "",
}: {
  className?: string;
}) {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={[
        "inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm transition",
        "border-black/10 bg-white/80 dark:border-white/10 hover:cursor-pointer dark:bg-[rgb(--var(--color-card))] dark:hover:bg-gray-400 hover:border-gray-500",
        className,
      ].join(" ")}
      title={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
