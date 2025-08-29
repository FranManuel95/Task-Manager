import { useParams } from "react-router-dom";
import { useTareasStore } from "../store/tareasStore";
import { useAuthStore } from "../store/authStore";

export function useProyectoActual() {
  const { id: proyectoId } = useParams();

  const { id } = useParams(); // id del proyecto desde la URL
const email = useAuthStore((state) => state.usuario?.email);
const proyecto = useTareasStore((state) => state.getProyectoPorId(email, id));

  // acciones
  const agregarTarea = useTareasStore((state) => state.agregarTarea);
  const eliminarTarea = useTareasStore((state) => state.eliminarTarea);
  const moverTarea = useTareasStore((state) => state.moverTarea);
  const editarTarea = useTareasStore((state) => state.editarTarea);
  const proyectoDeadline = proyecto?.deadline || "";

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
    proyectoDeadline, // 👈 añadido aquí
    searchTerm,
    filterPrioridad,
    setSearchTerm,
    setFilterPrioridad,
  };
}
