import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const usuario = useAuthStore((state) => state.usuario);
  const clearError = useAuthStore((state) => state.clearError);

  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(email, password);
    setLoading(false);

    if (ok) {
      toast.success("Bienvenido 👋");
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    if (usuario) navigate("/dashboard");
  }, [usuario, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center theme-bg transition-colors duration-500 px-4">
      <form
        onSubmit={handleSubmit}
        className="theme-card w-full max-w-md rounded-2xl shadow-xl border border-[rgb(var(--color-border))] p-8 space-y-5"
      >
        <h2 className="text-2xl font-semibold text-[rgb(var(--color-fg))] ">
          Iniciar sesión
        </h2>

        <label className="block space-y-1">
          <span className="text-sm text-[rgb(var(--color-fg-muted))]">
            Correo electrónico
          </span>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            autoComplete="email"
            className="w-full rounded-lg border border-[rgb(var(--color-border))]
                       bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                       px-3 py-2 outline-none transition
                       focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                       placeholder:text-gray-400 dark:placeholder:text-neutral-500"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-[rgb(var(--color-fg-muted))]">
            Contraseña
          </span>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            autoComplete="current-password"
            className="w-full rounded-lg border border-[rgb(var(--color-border))]
                       bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                       px-3 py-2 outline-none transition
                       focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                       placeholder:text-gray-400 dark:placeholder:text-neutral-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`hover:cursor-pointer w-full rounded-lg px-4 py-2 font-medium text-white transition
                      focus:outline-none focus:ring-2 focus:ring-indigo-400
                      ${
                        loading
                          ? "bg-neutral-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-500"
                      }`}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
