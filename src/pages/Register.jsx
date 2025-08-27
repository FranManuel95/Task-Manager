import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);


  const navigate = useNavigate();
  const clearError = useAuthStore((state) => state.clearError);

  useEffect(() => {
  clearError(); // limpia errores al cargar la página
}, []);

useEffect(() => {
  if (error) {
    toast.error(error);
  }
}, [error]);

const handleSubmit = async (e) => {
  e.preventDefault();
  const success = await register(email, password);

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

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => { setEmail(e.target.value); }}
          autoComplete="current-password" 
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => { setPassword(e.target.value); }}
          autoComplete="current-password" 
          className="w-full border border-gray-300 px-3 py-2 rounded"
        />

        
        

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}
