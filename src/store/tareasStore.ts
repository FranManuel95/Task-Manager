import { create } from "zustand";
import { persist } from "zustand/middleware";

import { TareasStore } from "./tareas.types";

// Acciones separadas
import { createTareaActions } from "./tareas.actions";
import { createProyectoActions } from "./proyectos.actions";
import { createColaboradorActions } from "./colaboradores.actions";

export const useTareasStore = create<TareasStore>()(
  persist(
    (set, get) => ({
      // Estado base
      usuarioActual: null,
      setUsuarioActual: (email: string) => set({ usuarioActual: email }),

      proyectos: {
        "demo@email.com": {
          "1": {
            id: "1",
            nombre: "Landing Page",
            descripcion: "Diseño de sitio institucional",
            color: "#3B82F6",
            deadline: null,
            creadoPor: "",
            usuarios: ["demo@email.com"],
            tareas: {
              "por-hacer": [],
              "en-progreso": [],
              "completado": [],
            },
          },
        },
      },

      // Filtros
      searchTerm: "",
      filterPrioridad: "todas",
      setSearchTerm: (term: string) => set({ searchTerm: term }),
      setFilterPrioridad: (prioridad: string) => set({ filterPrioridad: prioridad }),

      // Acciones (combinadas con spread)
      ...createProyectoActions(set, get),
      ...createTareaActions(set, get),
      ...createColaboradorActions(set, get),
    }),
    {
      name: "tareas-storage", // Nombre de la clave en localStorage
    }
  )
);
