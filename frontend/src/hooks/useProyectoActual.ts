import { useParams } from "react-router-dom";
import { useTareasStore } from "../store/tareasStore";
import { useAuthStore } from "../store/authStore";
import { Proyecto } from "../types"; // <- usa el modelo centralizado

export function useProyectoActual() {
  const { id: proyectoId } = useParams<{ id: string }>();
  const email = useAuthStore((state) => state.usuario?.email || "");

  // getProyectoPorId ya devuelve Proyecto | null si tu store está tipado con TareasStore
  const proyecto = useTareasStore((state) =>
    proyectoId ? state.getProyectoPorId(email, proyectoId) : null
  ) as Proyecto | null;

  // acciones
  const agregarTarea = useTareasStore((state) => state.agregarTarea);
  const eliminarTarea = useTareasStore((state) => state.eliminarTarea);
  const moverTarea   = useTareasStore((state) => state.moverTarea);
  const editarTarea  = useTareasStore((state) => state.editarTarea);

  // filtros
  const searchTerm        = useTareasStore((state) => state.searchTerm);
  const filterPrioridad   = useTareasStore((state) => state.filterPrioridad);
  const setSearchTerm     = useTareasStore((state) => state.setSearchTerm);
  const setFilterPrioridad= useTareasStore((state) => state.setFilterPrioridad);

  return {
    proyectoId,
    proyecto,
    agregarTarea,
    eliminarTarea,
    moverTarea,
    editarTarea,
    proyectoDeadline: proyecto?.deadline ?? null, // <- string | null, consistente con Columna/Tarea
    searchTerm,
    filterPrioridad,
    setSearchTerm,
    setFilterPrioridad,
  };
}
