import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const getPref = () =>
    localStorage.getItem("theme") ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  const [theme, setTheme] = useState<"light" | "dark">(getPref() as "light" | "dark");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200"
      title="Cambiar tema"
      aria-label="Cambiar tema claro/oscuro"
    >
      {theme === "dark" ? "🌙 Oscuro" : "☀️ Claro"}
    </button>
  );
}
