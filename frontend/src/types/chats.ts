// src/types/chats.ts
import type { ISODateString } from "./common";

export interface ChatMessage {
  id: string; // uuid
  proyectoId: string;
  sender: string; // email
  text: string;
  ts: ISODateString; // ISO string
  edited?: boolean;
}

/** Para enviar un mensaje nuevo al backend */
export interface ChatMessageInput {
  proyectoId: string;
  text: string;
}
