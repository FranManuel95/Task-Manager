// src/pages/Landing.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { motion } from "motion/react";

export default function Home() {
  const usuario = useAuthStore((state) => state.usuario);
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-100 to-purple-200 p-6">
      <motion.div
        className="text-center max-w-xl"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-4xl font-bold mb-4 text-blue-800">Gestor de Tareas</h1>
        <p className="text-gray-700 text-lg mb-8">
          Organiza tus proyectos, asigna tareas, colabora con otros y mantén el control del progreso. 
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/registro"
            className="border border-blue-600 text-blue-600 px-6 py-2 rounded hover:bg-blue-100 transition"
          >
            Registrarse
          </Link>
        </div>
      </motion.div>

      <motion.footer
        className="mt-10 text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        &copy; {new Date().getFullYear()} Task Manager. Todos los derechos reservados.
      </motion.footer>
    </div>
  );
}
