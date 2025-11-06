// src/components/layout/TopBar.tsx
import DarkModeToggle from "../ui/DarkModeToggle";
import ProfileMenu from "./ProfileMenu";
import { useNavigate } from "react-router-dom";

export default function TopBar({
  title,
  showBack = false,
}: {
  title: string;
  showBack?: boolean;
}) {
  const navigate = useNavigate();
  const backToProjects = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/dashboard", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 theme-card/80 backdrop-blur border-b dark:border-neutral-700">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Izquierda */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={backToProjects}
              className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-card))] px-3 py-1.5 text-sm hover:bg-[rgb(var(--color-card))]/80 transition focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Volver a proyectos"
              title="Volver a proyectos"
            >
              <span aria-hidden>←</span>
              <span className="hidden sm:inline">Volver a proyectos</span>
            </button>
          )}
          <h1 className="text-sm font-semibold">{title}</h1>
        </div>

        {/* Derecha */}
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          {/* En Project mostramos también el acceso rápido a proyectos en el menú */}
          <ProfileMenu showGoProjects={showBack} />
        </div>
      </div>
    </header>
  );
}
