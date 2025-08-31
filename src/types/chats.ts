export interface ChatMessage {
  id: string;           // uuid
  proyectoId: string;
  sender: string;       // email
  text: string;
  ts: string;           // ISO string
  edited?: boolean;
}
