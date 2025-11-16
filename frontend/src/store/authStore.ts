import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, type RegisterPayload } from "../services/api";
import { useTareasStore } from "./tareasStore";

type Usuario = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

type AuthState = {
  usuario: Usuario | null;
  error: string | null;
  loading: boolean;
  hasCheckedSession: boolean; // ⬅️ nuevo

  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: RegisterPayload) => Promise<boolean>;
  me: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      error: null,
      loading: false,
      hasCheckedSession: false, // ⬅️

      async login(email, password) {
        set({ loading: true, error: null });
        try {
          const res = await authApi.login(email, password);
          const usuario: Usuario = {
            email: res.email,
            name: res.name ?? null,
            avatarUrl: res.avatarUrl ?? null,
          };
          set({
            usuario,
            loading: false,
            error: null,
            hasCheckedSession: true,
          });
          try {
            useTareasStore.getState().setUsuarioActual(usuario.email);
          } catch {}
          return true;
        } catch (e: any) {
          const msg =
            e?.status === 401
              ? "Credenciales inválidas"
              : "No se pudo iniciar sesión";
          set({ error: msg, loading: false, hasCheckedSession: true });
          return false;
        }
      },

      async register(payload) {
        set({ loading: true, error: null });
        try {
          await authApi.register(payload);
          set({ loading: false, error: null });
          return true;
        } catch (e: any) {
          const msg =
            e?.status === 409 ? "Ese email ya existe" : "No se pudo registrar";
          set({ error: msg, loading: false });
          return false;
        }
      },

      async me() {
        try {
          const u = await authApi.me(); // puede ser null
          if (!u) {
            set({ usuario: null, hasCheckedSession: true });
            return;
          }
          const usuario: Usuario = {
            email: u.email,
            name: u.name ?? null,
            avatarUrl: u.avatarUrl ?? null,
          };
          set({ usuario, hasCheckedSession: true });
          try {
            useTareasStore.getState().setUsuarioActual(usuario.email);
          } catch {}
        } catch {
          set({ usuario: null, hasCheckedSession: true });
        }
      },

      async logout() {
        try {
          await authApi.logout();
        } catch {}
        set({ usuario: null, hasCheckedSession: true });
        try {
          useTareasStore.getState().setUsuarioActual("");
        } catch {}
      },

      clearError() {
        set({ error: null });
      },
    }),
    { name: "auth-storage" },
  ),
);
