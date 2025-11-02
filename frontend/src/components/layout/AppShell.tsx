import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../store/authStore";

export default function AppShell({ children }: { children: ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => (s as any).logout); // por si el store lo expone
  const email = usuario?.email ?? "";

  // Tema
  const [theme, setTheme] = useState(localStorage.theme ?? "light");
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.theme = theme;
  }, [theme]);

  // Dropdown usuario
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpenMenu(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const handleLogout = () => {
    if (typeof logout === "function") logout();
    else console.warn("logout() no está definido en authStore");
  };

  return (
    <div className="min-h-dvh theme-bg transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-30 theme-card/80 backdrop-blur border-b flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
          
          <span className="text-sm font-semibold">Gestor de Tareas</span>
        </div>

        {/* Zona derecha: selector tema + usuario (antes “rectángulo rojo”) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg bg-indigo-600 text-white px-3 py-1 text-sm hover:bg-indigo-700 transition"
            title="Cambiar tema"
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? "🌙 Oscuro" : "☀️ Claro"}
          </button>

          {/* Email con desplegable */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu((v) => !v);
              }}
              className="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-1 text-sm hover:bg-[rgb(var(--color-card))]/80 transition"
              title={email || "Usuario"}
              aria-haspopup="menu"
              aria-expanded={openMenu}
            >
              {email || "Usuario"}
            </button>

            {openMenu && (
              <div
                role="menu"
                className="absolute right-0 mt-1 w-56 rounded-xl theme-card shadow-card overflow-hidden"
              >
                <div className="px-3 py-2 text-xs text-gray-500 truncate">
                  Sesión iniciada como<br />
                  <span className="font-medium text-[rgb(var(--color-fg))]">{email || "—"}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--color-card))]/70 transition"
                  role="menuitem"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="p-6">{children}</main>
    </div>
  );
}
