import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTareasStore = create(
  persist(
    (set) => ({
      tareas: {
        "por-hacer": [
          { id: "t1", titulo: "Diseñar el logo", descripcion: "Debe representar el branding" },
          { id: "t2", titulo: "Crear wireframes", descripcion: "" },
],
        "en-progreso": [
          { id: "t3", titulo: "Implementar login", descripcion: "Usar autenticación JWT" },
        ],
        "completado": [
          { id: "t4", titulo: "Configurar Tailwind", descripcion: "Estilos base para el proyecto" },
          { id: "t5", titulo: "Instalar dependencias", descripcion: "Instalar React y React Router" },
        ],
      },

      agregarTarea: (estadoId, titulo) =>
        set((state) => {
          const nuevaTarea = {
            id: `t${Date.now()}`,
            titulo,
            descripcion: "",
            prioridad: "media", // nueva propiedad
          };
      
          return {
            tareas: {
              ...state.tareas,
              [estadoId]: [...state.tareas[estadoId], nuevaTarea],
            },
          };
        }),
      

      eliminarTarea: (estadoId, tareaId) =>
        set((state) => ({
          tareas: {
            ...state.tareas,
            [estadoId]: state.tareas[estadoId].filter((t) => t.id !== tareaId),
          },
        })),

      moverTarea: (tareaId, destinoId) =>
        set((state) => {
          const nuevaTareas = { ...state.tareas };
          let tareaMovida;

          for (const estado in nuevaTareas) {
            nuevaTareas[estado] = nuevaTareas[estado].filter((t) => {
              if (t.id === tareaId) {
                tareaMovida = t;
                return false;
              }
              return true;
            })
          }

          nuevaTareas[destinoId].push(tareaMovida);

          return { tareas: nuevaTareas };
        }),

        editarTarea: (estadoId, tareaId, nuevoTitulo, nuevaDescripcion, nuevaPrioridad) =>
  set((state) => ({
    tareas: {
      ...state.tareas,
      [estadoId]: state.tareas[estadoId].map((t) =>
        t.id === tareaId
          ? {
              ...t,
              titulo: nuevoTitulo ?? t.titulo,
              descripcion: nuevaDescripcion ?? t.descripcion,
              prioridad: nuevaPrioridad ?? t.prioridad,
            }
          : t
      ),
    },
  })),

    }),
    
    {
      name: "task-manager-storage", // nombre de la clave en localStorage
    }
  )
);
