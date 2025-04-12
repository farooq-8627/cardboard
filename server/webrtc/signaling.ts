import { WebSocket, WebSocketServer } from 'ws';

// Connection store to track peers
type ClientConnection = {
  ws: WebSocket;
  id: string;
  role: 'mobile' | 'browser' | 'unknown';
  sessionId?: string;
  peerId?: string;
};

const clients: Map<string, ClientConnection> = new Map();

// Generate a unique ID for each client
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Find a client by their WebSocket connection
function findClientByWs(ws: WebSocket): ClientConnection | undefined {
  for (const client of clients.values()) {
    if (client.ws === ws) {
      return client;
    }
  }
  return undefined;
}

// Handle incoming WebSocket messages for WebRTC signaling
export function handleSignaling(message: string, ws: WebSocket, wss: WebSocketServer) {
  try {
    const data = JSON.parse(message.toString());
    
    // Handle different message types
    switch (data.type) {
      case 'register':
        handleRegister(data, ws);
        break;
      
      case 'join':
        handleJoin(data, ws);
        break;
      
      case 'offer':
        handleOffer(data, ws);
        break;
      
      case 'answer':
        handleAnswer(data, ws);
        break;
      
      case 'ice-candidate':
        handleIceCandidate(data, ws);
        break;
      
      case 'disconnect':
        handleDisconnect(data, ws);
        break;
      
      default:
        console.warn('Unknown message type:', data.type);
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid message format'
    }));
  }
}

// Handle client registration
function handleRegister(data: any, ws: WebSocket) {
  const { role } = data;
  const clientId = generateId();
  
  // Store the client connection
  clients.set(clientId, {
    ws,
    id: clientId,
    role: role || 'unknown'
  });
  
  // Confirm registration
  ws.send(JSON.stringify({
    type: 'registered',
    id: clientId
  }));
  
  console.log(`Client registered: ${clientId} as ${role}`);
}

// Handle session join request
function handleJoin(data: any, ws: WebSocket) {
  const { sessionId } = data;
  const client = findClientByWs(ws);
  
  if (!client) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Not registered'
    }));
    return;
  }
  
  // Update client with session ID
  client.sessionId = sessionId;
  
  // Find available peer in this session
  const peers = Array.from(clients.values()).filter(c => 
    c.id !== client.id && c.sessionId === sessionId
  );
  
  if (peers.length > 0) {
    const peer = peers[0];
    
    // Connect these peers
    client.peerId = peer.id;
    peer.peerId = client.id;
    
    // Notify both peers they can connect
    client.ws.send(JSON.stringify({
      type: 'ready',
      peerId: peer.id,
      initiator: client.role === 'browser'
    }));
    
    peer.ws.send(JSON.stringify({
      type: 'ready',
      peerId: client.id,
      initiator: peer.role === 'browser'
    }));
    
    console.log(`Peers connected: ${client.id} and ${peer.id} in session ${sessionId}`);
  } else {
    // Wait for peer
    ws.send(JSON.stringify({
      type: 'waiting',
      sessionId
    }));
    
    console.log(`Client ${client.id} waiting for peer in session ${sessionId}`);
  }
}

// Handle WebRTC offer
function handleOffer(data: any, ws: WebSocket) {
  const { offer, peerId } = data;
  const peer = clients.get(peerId);
  
  if (!peer) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Peer not found'
    }));
    return;
  }
  
  // Forward offer to peer
  peer.ws.send(JSON.stringify({
    type: 'offer',
    offer,
    peerId: findClientByWs(ws)?.id
  }));
}

// Handle WebRTC answer
function handleAnswer(data: any, ws: WebSocket) {
  const { answer, peerId } = data;
  const peer = clients.get(peerId);
  
  if (!peer) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Peer not found'
    }));
    return;
  }
  
  // Forward answer to peer
  peer.ws.send(JSON.stringify({
    type: 'answer',
    answer,
    peerId: findClientByWs(ws)?.id
  }));
}

// Handle ICE candidate exchange
function handleIceCandidate(data: any, ws: WebSocket) {
  const { candidate, peerId } = data;
  const peer = clients.get(peerId);
  
  if (!peer) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Peer not found'
    }));
    return;
  }
  
  // Forward ICE candidate to peer
  peer.ws.send(JSON.stringify({
    type: 'ice-candidate',
    candidate,
    peerId: findClientByWs(ws)?.id
  }));
}

// Handle disconnection
function handleDisconnect(data: any, ws: WebSocket) {
  const client = findClientByWs(ws);
  
  if (client) {
    // Notify peer if connected
    if (client.peerId) {
      const peer = clients.get(client.peerId);
      if (peer) {
        peer.ws.send(JSON.stringify({
          type: 'peer-disconnected',
          peerId: client.id
        }));
        peer.peerId = undefined;
      }
    }
    
    // Remove client
    clients.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }
}
