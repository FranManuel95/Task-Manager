// src/store/tareas.types.ts
import type { Proyecto, Tarea, Prioridad } from "../types";
import type { Estado } from "../types";

export type TareasStore = {
  usuarioActual: string;
  setUsuarioActual: (email: string) => void;

  proyectos: Record<string, Record<string, Proyecto>>; // ownerLower -> id -> Proyecto
  idRemap: Record<string, string>; // tempId -> realId

  // filtros
  searchTerm: string;
  filterPrioridad: Prioridad | "todas";
  setSearchTerm: (v: string) => void;
  setFilterPrioridad: (v: Prioridad | "todas") => void;

  // proyectos
  getProyectosPorUsuario: (email: string) => Record<string, Proyecto>;
  getProyectoPorId: (email: string, id: string) => Proyecto | null;
  agregarProyecto: (
    email: string,
    nombre: string,
    descripcion?: string,
    color?: string,
    deadline?: string | null
  ) => void;
  editarProyecto: (
    id: string,
    nombre: string,
    descripcion: string,
    color: string,
    deadline: string | null
  ) => void;
  eliminarProyecto: (id: string) => void;

  // colaboradores
  agregarColaborador: (proyectoId: string, email: string) => void;

  // tareas
  agregarTarea: (proyectoId: string, estado: Estado, titulo: string) => void;
  eliminarTarea: (proyectoId: string, estado: Estado, tareaId: string) => void;
  moverTarea: (proyectoId: string, tareaId: string, destino: Estado) => void;
  editarTarea: (
    proyectoId: string,
    estado: Estado,
    tareaId: string,
    titulo: string,
    descripcion: string,
    prioridad: Prioridad,
    deadline: string | null,
    etiquetas: string[]
  ) => void;
};
