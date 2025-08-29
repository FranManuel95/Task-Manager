import { useParams } from "react-router-dom";
import { useTareasStore } from "../store/tareasStore";
import { useAuthStore } from "../store/authStore";

type Tarea = {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: "alta" | "media" | "baja";
  deadline?: string;
  etiquetas: string[];
};

type Proyecto = {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  deadline?: string;
  tareas: {
    "por-hacer": Tarea[];
    "en-progreso": Tarea[];
    "completado": Tarea[];
  };
};

export function useProyectoActual() {
  const { id: proyectoId } = useParams<{ id: string }>();
  const email = useAuthStore((state) => state.usuario?.email || "");

  const proyecto = useTareasStore((state) =>
    state.getProyectoPorId(email, proyectoId)
  ) as Proyecto | null;

  // acciones
  const agregarTarea = useTareasStore((state) => state.agregarTarea);
  const eliminarTarea = useTareasStore((state) => state.eliminarTarea);
  const moverTarea = useTareasStore((state) => state.moverTarea);
  const editarTarea = useTareasStore((state) => state.editarTarea);

  // filtros
  const searchTerm = useTareasStore((state) => state.searchTerm);
  const filterPrioridad = useTareasStore((state) => state.filterPrioridad);
  const setSearchTerm = useTareasStore((state) => state.setSearchTerm);
  const setFilterPrioridad = useTareasStore((state) => state.setFilterPrioridad);

  return {
    proyectoId,
    proyecto,
    agregarTarea,
    eliminarTarea,
    moverTarea,
    editarTarea,
    proyectoDeadline: proyecto?.deadline || "",
    searchTerm,
    filterPrioridad,
    setSearchTerm,
    setFilterPrioridad,
  };
}
