import { ChatMessage } from "../../types";

export interface ChatTransport {
  /** Suscribe a mensajes de un proyecto. Devuelve una función para desuscribir. */
  subscribe: (
    proyectoId: string,
    handler: (msg: ChatMessage) => void,
  ) => () => void;

  /** Envía (broadcast local o transporte real) un mensaje del proyecto. */
  send: (proyectoId: string, msg: ChatMessage) => Promise<void>;
}
