import DarkModeToggle from "../ui/DarkModeToggle";
import ProfileMenu from "./ProfileMenu";
import { useNavigate, Link } from "react-router-dom";

export default function TopBar({
  title,
  showBack = false,
  showGoProjects = false, // <— usa esta prop
}: {
  title: string;
  showBack?: boolean;
  showGoProjects?: boolean;
}) {
  const navigate = useNavigate();
  const backToProjects = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/dashboard", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 theme-card/80 backdrop-blur border-b border-gray-200 dark:border-neutral-700">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* SOLO si showGoProjects es true */}
          {showGoProjects && (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border  px-3 py-1   transition border-black/10 bg-white/80 hover:border-gray-500 hover:cursor-pointer dark:border-white/10 dark:bg-[rgb(--var(--color-card))] dark:hover:bg-gray-400 dark:hover:cursor-pointer"
              role="menuitem"
            >
              Volver a proyectos
            </Link>
          )}

          <DarkModeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
