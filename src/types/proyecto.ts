import { TareaType } from "./tarea";
import { EstadoID } from "../components/project/constantes";

export type ProyectoType = {
id: string;
nombre: string;
descripcion: string;
color: string;
deadline?: string | null;
creadoPor: string;
usuarios: string[]; // emails de usuarios colaboradores
tareas: Record<EstadoID, TareaType[]>;
};
