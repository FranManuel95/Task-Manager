import { Tarea, Prioridad } from "../types/tarea";
import { Proyecto } from "../types/proyecto";
import { Estado } from "../types/estado";

export interface TareasStore {
  usuarioActual: string | null;
  setUsuarioActual: (email: string) => void;

  proyectos: Record<string, Record<string, Proyecto>>;

  searchTerm: string;
  filterPrioridad: string;
  setSearchTerm: (term: string) => void;
  setFilterPrioridad: (prioridad: string) => void;

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

  agregarTarea: (
    proyectoId: string,
    estado: Estado,
    titulo: string,
    deadline?: string | null
  ) => void;

  editarTarea: (
    proyectoId: string,
    columnaId: Estado,
    tareaId: string,
    nuevoTitulo: string,
    nuevaDescripcion: string,
    prioridad: Prioridad,
    deadline: string | null,
    etiquetas: string[]
  ) => void;

  eliminarTarea: (proyectoId: string, estado: Estado, id: string) => void;

  moverTarea: (proyectoId: string, tareaId: string, destino: Estado) => void;

  agregarColaborador: (proyectoId: string, nuevoEmail: string) => void;
}
