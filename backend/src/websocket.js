const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

let wss;
const clients = new Map();

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const channel = url.searchParams.get('channel') || 'general';
    const token = url.searchParams.get('token');

    let user = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = { id: decoded.id, role: decoded.role };
      } catch (e) {}
    }

    ws._channel = channel;
    ws._user = user;
    ws._isAlive = true;
    ws._connectedAt = new Date().toISOString();
    clients.set(ws, { channel, user });

    ws.on('pong', () => { ws._isAlive = true; });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        }
      } catch (e) {}
    });

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));

    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connected',
      channel,
      authenticated: !!user,
    }));
  });

  const heartbeatInterval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (!ws._isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws._isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(heartbeatInterval));

  console.log('WebSocket server initialized');
  return wss;
}

function broadcast(channel, event, data) {
  const message = JSON.stringify({ type: event, channel, data, timestamp: new Date().toISOString() });
  clients.forEach((clientData, ws) => {
    if (ws.readyState === 1) {
      if (!channel || clientData.channel === channel || clientData.channel === 'general') {
        try { ws.send(message); } catch (e) { /* skip */ }
      }
    }
  });
}

function broadcastToAll(event, data) {
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
  clients.forEach((clientData, ws) => {
    if (ws.readyState === 1) {
      try { ws.send(message); } catch (e) { /* skip */ }
    }
  });
}

function broadcastToUser(userId, event, data) {
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });
  clients.forEach((clientData, ws) => {
    if (ws.readyState === 1 && clientData.user && clientData.user.id === userId) {
      try { ws.send(message); } catch (e) { /* skip */ }
    }
  });
}

module.exports = { initWebSocket, broadcast, broadcastToAll, broadcastToUser };
