import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const usuario = useAuthStore((state) => state.usuario);

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email);
  };

  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    if (error) clearError();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold">Iniciar sesión</h2>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={handleInputChange}
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
