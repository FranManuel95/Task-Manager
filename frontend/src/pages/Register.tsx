import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Extras = {
  name?: string;
  avatarUrl?: string;   // el backend espera 'avatarUrl'
  birthdate?: string;   // yyyy-mm-dd
  jobTitle?: string;
  phone?: string;
};

export default function Register() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // nuevos campos (UI)
  const [name, setName] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");   // input -> luego mapeamos a avatarUrl
  const [birthdate, setBirthdate] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const [loading, setLoading] = useState(false);

  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) return toast.error("El email es obligatorio");
    if (!password) return toast.error("La contraseña es obligatoria");
    if (phone && !/^[\d+\s()-]{6,}$/.test(phone)) {
      return toast.error("El teléfono no parece válido");
    }

    const extras: Extras = {
      name: name.trim() || undefined,
      avatarUrl: photoUrl.trim() || undefined,
      birthdate: birthdate || undefined,
      jobTitle: jobTitle.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    setLoading(true);
    const success = await register({ email, password, ...extras });
    setLoading(false);

    if (success) {
      toast.success("Registro exitoso. Por favor inicia sesión.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center theme-bg transition-colors duration-500 px-4">
      <form
        onSubmit={handleSubmit}
        className="theme-card w-full max-w-md rounded-2xl shadow-xl border border-[rgb(var(--color-border))] p-8 space-y-5"
      >
        <h2 className="text-2xl font-semibold text-[rgb(var(--color-fg))]">
          Crear cuenta
        </h2>

        <div className="grid grid-cols-1 gap-3">
          <label className="block space-y-1">
            <span className="text-sm text-[rgb(var(--color-fg-muted))]">Correo electrónico</span>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         px-3 py-2 outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[rgb(var(--color-fg-muted))]">Contraseña</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         px-3 py-2 outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            />
          </label>

          {/* Campos nuevos */}
          <label className="block space-y-1">
            <span className="text-sm text-[rgb(var(--color-fg-muted))]">Nombre y apellidos</span>
            <input
              type="text"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         px-3 py-2 outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[rgb(var(--color-fg-muted))]">Foto (URL)</span>
            <input
              type="url"
              placeholder="https://…"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         px-3 py-2 outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[rgb(var(--color-fg-muted))]">Fecha de nacimiento</span>
            <input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         px-3 py-2 outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600 dark:[color-scheme:dark] date-icon-pointer"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[rgb(var(--color-fg-muted))]">Puesto de trabajo</span>
            <input
              type="text"
              placeholder="Ej. Desarrollador"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         px-3 py-2 outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-[rgb(var(--color-fg-muted))]">Teléfono de contacto</span>
            <input
              type="tel"
              placeholder="+34 600 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="w-full rounded-lg border border-[rgb(var(--color-border))]
                         bg-[rgb(var(--color-card))] text-[rgb(var(--color-fg))]
                         px-3 py-2 outline-none transition
                         focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600
                         placeholder:text-gray-400 dark:placeholder:text-neutral-500"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-4 py-2 font-medium text-white transition
                     bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-indigo-400
                     disabled:opacity-60 disabled:cursor-not-allowed
                     dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:cursor-pointer"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}
