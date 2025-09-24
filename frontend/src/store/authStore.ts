import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "../services/api";

export type AuthUser = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  birthdate?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
};

export type RegisterExtras = {
  name?: string;
  avatarUrl?: string;
  birthdate?: string; // yyyy-mm-dd
  jobTitle?: string;
  phone?: string;
};

type AuthState = {
  usuario: AuthUser | null;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, extras?: RegisterExtras) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  // 👇 IMPORTANTE: anotar el genérico aquí
  persist<AuthState>(
    (set) => ({
      usuario: null,
      error: null,

      login: async (email, password) => {
        const em = (email ?? "").trim().toLowerCase();
        if (!em || !password) {
          set({ error: "Email y contraseña requeridos" });
          return false;
        }
        try {
          const res: any = await authApi.login({ email: em, password });
          set({
            usuario: {
              email: res?.user?.email ?? em,
              name: res?.user?.name ?? null,
              avatarUrl: res?.user?.avatarUrl ?? null,
              birthdate: res?.user?.birthdate ?? null,
              jobTitle: res?.user?.jobTitle ?? null,
              phone: res?.user?.phone ?? null,
            },
            error: null,
          });
          return true;
        } catch {
          set({ error: "Credenciales inválidas" });
          return false;
        }
      },

      register: async (email, password, extras) => {
        const em = (email ?? "").trim().toLowerCase();
        if (!em || !password) {
          set({ error: "Email y contraseña requeridos" });
          return false;
        }
        try {
          await authApi.register({
            email: em,
            password,
            name: extras?.name,
            avatarUrl: extras?.avatarUrl,
            birthdate: extras?.birthdate,
            jobTitle: extras?.jobTitle,
            phone: extras?.phone,
          });
          set({ error: null });
          return true;
        } catch {
          set({ error: "No se pudo registrar (¿email ya existe?)" });
          return false;
        }
      },

      logout: () => set({ usuario: null }),
      clearError: () => set({ error: null }),
    }),
    { name: "auth-storage" }
  )
);
