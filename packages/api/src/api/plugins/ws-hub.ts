import type { WebSocket } from '@fastify/websocket';

const clients = new Set<WebSocket>();

export const wsHub = {
  add(ws: WebSocket): void {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  },
  broadcast(data: unknown): void {
    const msg = JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === 1) client.send(msg);
    }
  },
};
