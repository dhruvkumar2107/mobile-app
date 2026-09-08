const { WebSocketServer } = require('ws');

let wss;
const clients = new Set();

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const channel = url.searchParams.get('channel') || 'general';
    ws._channel = channel;
    clients.add(ws);

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));

    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
  });

  console.log('WebSocket server initialized');
  return wss;
}

function broadcast(channel, event, data) {
  const message = JSON.stringify({ type: event, channel, data, timestamp: new Date().toISOString() });
  clients.forEach((client) => {
    if (client.readyState === 1 && (!channel || client._channel === channel || client._channel === 'general')) {
      try { client.send(message); } catch (e) { /* skip */ }
    }
  });
}

function broadcastToAll(event, data) {
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
  clients.forEach((client) => {
    if (client.readyState === 1) {
      try { client.send(message); } catch (e) { /* skip */ }
    }
  });
}

module.exports = { initWebSocket, broadcast, broadcastToAll };
