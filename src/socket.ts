import io from 'socket.io-client';
import { Platform } from 'react-native';

// -----------------------------------------
//  SOCKET CONFIGURATION (LIVE SERVER)
// -----------------------------------------
// Use live production server for socket connections (driver/user location tracking)
const SOCKET_URL = 'https://backend-besafe.onrender.com';

console.log('🔗 Connecting Socket to Live Server:', SOCKET_URL);

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
