import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Protegido() {
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  if (!usuario) return <Navigate to="/" replace />;

  const displayName = usuario.name?.trim() || usuario.email;

  return (
    <div>
      

      <main role="main">
        <Outlet />
      </main>
    </div>
  );
}
