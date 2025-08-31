import { ChatTransport } from "./ChatTransport";
import { ChatMessage } from "@/types";

const HAS_BC = typeof window !== "undefined" && "BroadcastChannel" in window;

export class LocalBroadcastTransport implements ChatTransport {
  private channels = new Map<string, BroadcastChannel>();

  subscribe(proyectoId: string, handler: (msg: ChatMessage) => void) {
    if (!HAS_BC) {
      // Fallback sin tiempo real entre pestañas (no hacemos nada)
      return () => {};
    }
    const name = `chat-${proyectoId}`;
    const bc = new BroadcastChannel(name);
    bc.onmessage = (ev) => {
      const data = ev.data as ChatMessage;
      if (data?.proyectoId === proyectoId) handler(data);
    };
    this.channels.set(proyectoId, bc);
    return () => {
      bc.close();
      this.channels.delete(proyectoId);
    };
  }

  async send(proyectoId: string, msg: ChatMessage) {
    if (!HAS_BC) return; // sin BroadcastChannel no hay broadcast real-time local
    const name = `chat-${proyectoId}`;
    let bc = this.channels.get(proyectoId);
    if (!bc) {
      bc = new BroadcastChannel(name);
      this.channels.set(proyectoId, bc);
    }
    bc.postMessage(msg);
  }
}
