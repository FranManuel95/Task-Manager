import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const usuario = useAuthStore((state) => state.usuario);
  const clearError = useAuthStore((state) => state.clearError);

  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    login(email, password);
  };

  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          autoComplete="current-password"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          autoComplete="current-password"
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />

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
