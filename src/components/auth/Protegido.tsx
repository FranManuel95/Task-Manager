import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";


export default function Protegido() {
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);

  if (!usuario) return <Navigate to="/login" />;

  return (
    <div>
      {/* Header con email y logout */}
      <header className="flex justify-between items-center bg-gray-100 px-4 py-2 text-sm border-b border-gray-200">
        <p>👤 {usuario.email}</p>
        <button
          onClick={logout}
          className="text-red-500 hover:text-red-700 transition"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Contenido de la ruta protegida */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

