// src/__tests__/setupStoreForTest.ts
import { useTareasStore } from "../store/tareasStore";
import { useAuthStore } from "../store/authStore"; // 👈 importa tu auth store
import { Proyecto, Tarea, Estado } from "../types";

export const TEST_USER = "test@example.com";
export const TEST_PROYECTO_ID = "test-proyecto";
const STORAGE_KEYS = ["tareas-storage", "auth-storage"]; // 👈 si tu auth usa persist

const initialSnapshot = useTareasStore.getState();

export function resetTareasStore() {
  try {
    for (const k of STORAGE_KEYS) localStorage.removeItem(k);
  } catch {}
  useTareasStore.setState(initialSnapshot, true);
  // Limpia auth también
  try {
    useAuthStore.setState({ usuario: null } as any, true);
  } catch {}
}

export function givenTarea(overrides: Partial<Tarea> = {}): Tarea {
  return {
    id: overrides.id ?? "1",
    titulo: overrides.titulo ?? "Tarea Test",
    descripcion: overrides.descripcion ?? "",
    prioridad: overrides.prioridad ?? "media",
    deadline: overrides.deadline ?? null,
    etiquetas: overrides.etiquetas ?? [],
  };
}

export function setupStoreForTests() {
  const email = TEST_USER;
  const proyectoId = TEST_PROYECTO_ID;

  // 👇 Seed del auth store: ¡claves según tu authStore!
  useAuthStore.setState({
    usuario: { email }, // si tu authStore guarda más campos, añádelos
    // isAuth: true,          // si tienes un flag así, ponlo en true
  } as any);

  const tareaEjemplo = givenTarea();

  useTareasStore.setState((s) => ({
    ...s,
    usuarioActual: email,
    proyectos: {
      ...s.proyectos,
      [email]: {
        ...(s.proyectos[email] ?? {}),
        [proyectoId]: {
          id: proyectoId,
          nombre: "Proyecto de prueba",
          descripcion: "Un proyecto para testing",
          color: "#3B82F6",
          deadline: null,
          creadoPor: email,
          usuarios: [email],
          tareas: {
            "por-hacer": [tareaEjemplo],
            "en-progreso": [],
            completado: [],
          } as Record<Estado, Tarea[]>,
        } as Proyecto,
      },
    },
    searchTerm: "",
    filterPrioridad: "todas",
  }));
}
