// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 text-center bg-gradient-to-br from-blue-50 to-white">
      <h1 className="text-4xl sm:text-5xl font-bold text-blue-800 mb-4">Bienvenido a TaskFlow</h1>
      <p className="text-gray-600 max-w-xl mb-6">
        Organiza tus tareas, colabora en proyectos y mejora tu productividad personal o en equipo.
      </p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/register"
          className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition"
        >
          Registrarse
        </Link>
      </div>
    </div>
  );
}
