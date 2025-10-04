import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Extras = {
  name?: string;
  avatarUrl?: string;   // 👈 el backend espera 'avatarUrl'
  birthdate?: string;   // yyyy-mm-dd
  jobTitle?: string;
  phone?: string;
};

export default function Register() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // nuevos campos (UI)
  const [name, setName] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");   // seguimos llamándole photoUrl en el input
  const [birthdate, setBirthdate] = useState<string>(""); // input="date" -> yyyy-mm-dd
  const [jobTitle, setJobTitle] = useState<string>("");
  const [phone, setPhone] = useState<string>("");

  const [loading, setLoading] = useState(false);

  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const navigate = useNavigate();

  useEffect(() => {
    clearError(); // Limpia error anterior al montar
  }, [clearError]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // validaciones mínimas
    if (!email.trim()) return toast.error("El email es obligatorio");
    if (!password) return toast.error("La contraseña es obligatoria");
    if (phone && !/^[\d+\s()-]{6,}$/.test(phone)) {
      return toast.error("El teléfono no parece válido");
    }

    const extras: Extras = {
      name: name.trim() || undefined,
      avatarUrl: photoUrl.trim() || undefined,   // 👈 mapeamos a 'avatarUrl'
      birthdate: birthdate || undefined,         // el backend parsea string a Date
      jobTitle: jobTitle.trim() || undefined,
      phone: phone.trim() || undefined,
    };

    setLoading(true);
    // ...
    const success = await register({ email, password, ...extras });
// ...

    setLoading(false);

    if (success) {
      toast.success("Registro exitoso. Por favor inicia sesión.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold">Crear cuenta</h2>

        <div className="grid grid-cols-1 gap-3">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />

          {/* Campos nuevos */}
          <input
            type="text"
            placeholder="Nombre y apellidos"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />

          <input
            type="url"
            placeholder="Foto (URL)"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />

          <input
            type="date"
            placeholder="Fecha de nacimiento"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />

          <input
            type="text"
            placeholder="Puesto de trabajo"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />

          <input
            type="tel"
            placeholder="Teléfono de contacto"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className="w-full border border-gray-300 px-3 py-2 rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}
