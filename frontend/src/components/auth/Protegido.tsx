import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Protegido() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  if (!usuario) return <Navigate to="/" replace />;

  const displayName = usuario.name?.trim() || usuario.email;

  return (
    <div>
      <header className="flex justify-between items-center bg-gray-100 px-4 py-2 text-sm border-b border-gray-200">
        <div className="flex items-center gap-2">
          {usuario.avatarUrl ? (
            <img
              src={usuario.avatarUrl}
              alt={displayName}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-[10px]">🙂</span>
            </div>
          )}
          <p className="font-medium">{displayName}</p>
        </div>

        <button
          onClick={() => void logout()}
          className="text-red-500 hover:text-red-700 transition"
        >
          Cerrar sesión
        </button>
      </header>

      <main role="main">
        <Outlet />
      </main>
    </div>
  );
}
