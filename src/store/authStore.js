import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      usuario: null,
      error: null,

      login: (email, password) => {
        const users = JSON.parse(localStorage.getItem("mock-users") || "{}");
        const user = users[email];

        if (!user) {
          return set({ error: "Usuario no registrado" });
        }

        if (user.password !== password) {
          return set({ error: "Contraseña incorrecta" });
        }

        set({ usuario: { email }, error: null });
      },

      register: (email, password) => {
  if (!email || !password) {
    set({ error: "Email y contraseña requeridos" });
    return false;
  }

  if (!email.includes("@")) {
    set({ error: "Email inválido" });
    return false;
  }

  if (password.length < 6) {
    set({ error: "La contraseña debe tener al menos 6 caracteres" });
    return false;
  }

  const users = JSON.parse(localStorage.getItem("mock-users") || "{}");

  if (users[email]) {
    set({ error: "El usuario ya está registrado" });
    return false;
  }

  users[email] = { password };
  localStorage.setItem("mock-users", JSON.stringify(users));

  set({ error: null });
  return true;
},


      logout: () => set({ usuario: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
