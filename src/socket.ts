import io from 'socket.io-client';
import { Platform } from 'react-native';

// -----------------------------------------
//  SOCKET CONFIGURATION (NGROK for Real Devices)
// -----------------------------------------
// Use ngrok URL for socket connections (driver/user location tracking)
const SOCKET_URL = 'https://383797b4d7ae.ngrok-free.app';

console.log('🔗 Connecting Socket to NGROK:', SOCKET_URL);

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
