import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      usuario: null,

      login: (email) =>
        set({
          usuario: { email },
        }),

      logout: () =>
        set({
          usuario: null,
        }),
    }),
    {
      name: "auth-storage",
    }
  )
);
