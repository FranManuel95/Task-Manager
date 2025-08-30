import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipo del usuario autenticado
type Usuario = {
  email: string;
};

// Estructura del objeto de usuarios simulados
type MockUser = {
  password: string;
};

type AuthState = {
  usuario: Usuario | null;
  error: string | null;

  login: (email: string, password: string) => void;
  register: (email: string, password: string) => boolean;
  logout: () => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      error: null,

      login: (email: string, password: string) => {
        const users: Record<string, MockUser> = JSON.parse(
          localStorage.getItem("mock-users") ?? "{}"
        );

        const user = users[email];

        if (!user) {
          set({ error: "Usuario no registrado" });
          return;
        }

        if (user.password !== password) {
          set({ error: "Contraseña incorrecta" });
          return;
        }

        set({ usuario: { email }, error: null });
      },

      register: (email: string, password: string) => {
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

        const users: Record<string, MockUser> = JSON.parse(
          localStorage.getItem("mock-users") ?? "{}"
        );

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
