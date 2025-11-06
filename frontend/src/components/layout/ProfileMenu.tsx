// src/components/layout/ProfileMenu.tsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function ProfileMenu({ showGoProjects = false }: { showGoProjects?: boolean }) {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => (s as any).logout);
  const email = usuario?.email ?? "";
  const displayName = usuario?.name || email || "Usuario";

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onEsc);
    return () => { window.removeEventListener("click", onClick); window.removeEventListener("keydown", onEsc); };
  }, []);

  const ProfileIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-600 dark:text-neutral-300" aria-hidden="true">
      <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M20.592 20.5C19.533 17.41 16.973 15.25 14 15.25h-4c-2.973 0-5.533 2.16-6.592 5.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  const handleLogout = () => typeof logout === "function" ? logout() : console.warn("logout() no definido");

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] p-2 hover:bg-[rgb(var(--color-card))]/80 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-haspopup="menu" aria-expanded={open} aria-label="Abrir menú de usuario" title={displayName}
      >
        {ProfileIcon}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 rounded-xl theme-card shadow-card overflow-hidden border border-[rgb(var(--color-border))]">
          <div className="px-3 py-2 text-xs text-gray-500">
            Sesión iniciada como
            <div className="mt-0.5 truncate font-medium text-[rgb(var(--color-fg))]">{displayName}</div>
            {email && <div className="truncate text-[11px] text-gray-500">{email}</div>}
          </div>
          <div className="h-px bg-[rgb(var(--color-border))]" />
          {showGoProjects && (
            <Link to="/dashboard" className="block px-3 py-2 text-sm hover:bg-[rgb(var(--color-card))]/70 transition" role="menuitem">
              Ir a proyectos
            </Link>
          )}
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm hover:bg-[rgb(var(--color-card))]/70 transition" role="menuitem">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
