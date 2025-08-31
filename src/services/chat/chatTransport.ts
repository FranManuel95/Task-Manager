import { ChatMessage } from "@/types";

export interface ChatTransport {
  subscribe: (proyectoId: string, handler: (msg: ChatMessage) => void) => () => void;
  send: (proyectoId: string, msg: ChatMessage) => Promise<void>;
}
