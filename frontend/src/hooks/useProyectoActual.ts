// src/hooks/useProyectoActual.ts
import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTareasStore } from "../store/tareasStore";
import { useAuthStore } from "../store/authStore";
import type { Proyecto } from "../types";

export function useProyectoActual() {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const email = useAuthStore((s) => s.usuario?.email || "");
  const emailLower = (email ?? "").trim().toLowerCase();

  const idRemap = useTareasStore((s) => s.idRemap);
  const realId = useMemo(
    () => (paramId && idRemap[paramId]) || paramId || "",
    [paramId, idRemap],
  );

  // 🔹 NUEVO: acción para traer el proyecto (con tareas) desde el backend
  const fetchProyectoAndHydrate = useTareasStore(
    (s) => (s as any).fetchProyectoAndHydrate,
  );

  // Si el id era temporal y ya tenemos el real, redirigimos
  useEffect(() => {
    if (!paramId) return;
    const mapped = idRemap[paramId];
    if (paramId.startsWith("temp-") && mapped && mapped !== paramId) {
      navigate(`/proyecto/${mapped}`, { replace: true });
    }
  }, [paramId, idRemap, navigate]);

  // 🔹 NUEVO: al tener un id real, pedimos al backend y mezclamos en el store
  useEffect(() => {
    if (!realId) return;
    fetchProyectoAndHydrate?.(realId);
  }, [realId, fetchProyectoAndHydrate]);

  const proyecto = useTareasStore((state) =>
    realId
      ? (state.getProyectoPorId(emailLower, realId) as Proyecto | null)
      : null,
  );

  const agregarTarea = useTareasStore((s) => s.agregarTarea);
  const eliminarTarea = useTareasStore((s) => s.eliminarTarea);
  const moverTarea = useTareasStore((s) => s.moverTarea);
  const editarTarea = useTareasStore((s) => s.editarTarea);

  const searchTerm = useTareasStore((s) => s.searchTerm);
  const filterPrioridad = useTareasStore((s) => s.filterPrioridad);
  const setSearchTerm = useTareasStore((s) => s.setSearchTerm);
  const setFilterPrioridad = useTareasStore((s) => s.setFilterPrioridad);

  return {
    proyectoId: realId,
    proyecto,
    agregarTarea,
    eliminarTarea,
    moverTarea,
    editarTarea,
    proyectoDeadline: proyecto?.deadline ?? null,
    searchTerm,
    filterPrioridad,
    setSearchTerm,
    setFilterPrioridad,
  };
}
