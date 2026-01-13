import io from 'socket.io-client';
import { Platform } from 'react-native';

// -----------------------------------------
//  SOCKET CONFIGURATION (LOCALHOST + NGROK)
// -----------------------------------------
// Use localhost via ngrok tunnel for socket connections (driver/user location tracking)
// IMPORTANT: Update this ngrok URL whenever you restart ngrok
const SOCKET_URL = 'https://a6edc4973eae.ngrok-free.app';

console.log('🔗 Connecting Socket to LOCALHOST (via ngrok):', SOCKET_URL);

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: true,
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('✅ Socket Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.log('❌ SOCKET ERROR:', error.message);
});

export default socket;
