// store/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      usuario: null,
      error: null,
      usuariosRegistrados: [],

      login: (email) => {
        const usuarios = get().usuariosRegistrados;
        const existe = usuarios.find((u) => u.email === email);

        if (!email) {
          return set({ error: "El email es obligatorio" });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
          return set({ error: "El formato del email no es válido" });
        }

        if (!existe) {
          return set({ error: "El usuario no existe" });
        }

        set({ usuario: existe, error: null });
      },

      register: (email) => {
        const usuarios = get().usuariosRegistrados;

        if (!email) {
          return set({ error: "El email es obligatorio" });
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
          return set({ error: "El formato del email no es válido" });
        }

        const yaExiste = usuarios.some((u) => u.email === email);

        if (yaExiste) {
          return set({ error: "Ese email ya está registrado" });
        }

        const nuevoUsuario = { email };
        set({
          usuariosRegistrados: [...usuarios, nuevoUsuario],
          usuario: nuevoUsuario,
          error: null,
        });
      },

      logout: () => {
        set({ usuario: null });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
