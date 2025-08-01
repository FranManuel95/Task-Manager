import { useParams } from "react-router-dom";
import { useTareasStore } from "../store/tareasStore";

export function useProyectoActual() {
  const { id: proyectoId } = useParams();

  const proyecto = useTareasStore((state) => state.proyectos[proyectoId]);

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
    editarTarea, // 👈 añadido aquí
    searchTerm,
    filterPrioridad,
    setSearchTerm,
    setFilterPrioridad,
  };
}
