import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export default function Protegido() {
  const usuario = useAuthStore((state) => state.usuario);
  return usuario ? <Outlet /> : <Navigate to="/login" />;
}
