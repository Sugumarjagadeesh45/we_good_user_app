import { io } from 'socket.io-client';
import { getSocketUrl } from './util/backendConfig';

const URL = getSocketUrl();

const socket = io(URL, {
  transports: ['websocket'], // Recommended for React Native
  reconnection: true,
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('🔌 Connected to Socket.IO server:', URL);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected from Socket.IO server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔌 Socket.IO connection error:', error.message);
});

export default socket;