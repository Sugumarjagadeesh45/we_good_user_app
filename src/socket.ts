import io from 'socket.io-client';
import { Platform } from 'react-native';

// -----------------------------------------
//  LOCALHOST CONFIGURATION
// -----------------------------------------
const PORT = '5001';
const IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const SOCKET_URL = `http://${IP}:${PORT}`;

console.log('🔗 Connecting Socket to LOCAL SERVER:', SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: true,
  autoConnect: true,
  secure: false, // Localhost is usually http
});


socket.on('connect', () => {
  console.log('✅ SOCKET CONNECTED:', socket.id);
});

socket.on('connect_error', (error) => {
  console.log('❌ SOCKET ERROR:', error.message);
});

export default socket;
