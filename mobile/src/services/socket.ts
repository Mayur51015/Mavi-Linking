/**
 * Socket.IO Real-time Connection Service
 * ──────────────────────────────────────
 * Manages resilient WebSocket connection to EduTalentX backend.
 * Handles auth handshake, joinRoom, reconnections, and cleanup.
 */

import { io, Socket } from 'socket.io-client';
import { ENVIRONMENTS, EnvironmentType } from '../config/environment';

let socketInstance: Socket | null = null;
let currentConnectedUserId: string | null = null;

export const connectSocket = (
  token: string,
  userId: string,
  envType: EnvironmentType = 'production',
  customUrl?: string
): Socket => {
  if (socketInstance && socketInstance.connected && currentConnectedUserId === userId) {
    return socketInstance;
  }

  // Disconnect existing socket before re-establishing
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  const socketUrl = envType === 'custom' && customUrl
    ? customUrl.replace(/\/api\/?$/u, '')
    : ENVIRONMENTS[envType]?.socketUrl || ENVIRONMENTS.production.socketUrl;

  console.log('[Socket] Connecting to real-time endpoint:', socketUrl);

  const socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 15000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected. Joining user room:', userId);
    currentConnectedUserId = userId;
    socket.emit('joinRoom', userId);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    if (reason === 'io server disconnect') {
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  socketInstance = socket;
  return socket;
};

export const getSocket = (): Socket | null => socketInstance;

export const disconnectSocket = () => {
  if (socketInstance) {
    console.log('[Socket] Disconnecting socket.');
    socketInstance.disconnect();
    socketInstance = null;
    currentConnectedUserId = null;
  }
};
