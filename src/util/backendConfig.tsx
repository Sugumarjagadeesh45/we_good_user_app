import { Platform } from 'react-native';

// -----------------------------------------
// 🏠 LOCALHOST CONFIGURATION
// -----------------------------------------

const PORT = '5001';
const LOCAL_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// Base URL for API calls
export const API_BASE_URL = `http://${LOCAL_IP}:${PORT}`;

console.log("🚀 User App API configured for LOCALHOST:", API_BASE_URL);

// Add this function to get your server URL for map tiles
export const getMapTileUrl = () => {
  return `${API_BASE_URL}/data/v3`;
};

// ----------- MAIN URL FUNCTIONS -------------- //

export const getBackendUrl = (): string => {
  return API_BASE_URL; 
};

export const getSocketUrl = (): string => {
  return getBackendUrl();
};

// ----------- IMAGE URL HANDLERS -------------- ///
// Main image URL handler
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return "";

  const backendUrl = getBackendUrl();

  // If it's already a complete URL
  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Handle different path formats
  if (imagePath.startsWith("/uploads/")) {
    return `${backendUrl}${imagePath}`;
  }

  if (imagePath.startsWith("uploads/")) {
    return `${backendUrl}/${imagePath}`;
  }

  // Default case
  return `${backendUrl}/uploads/${imagePath}`;
};

// Add this missing function that your components need
export const getProductImageUrl = (imagePath: string): string => {
  return getImageUrl(imagePath);
};

// ----------- ENV BASED API CONFIG -------------- //

export const API_CONFIG = {
  BASE_URL: getBackendUrl(),
  getImageUrl: (path: string) => getImageUrl(path),
  getProductImageUrl: (path: string) => getProductImageUrl(path),
};

// ----------- DEFAULT EXPORT -------------- //

export default {
  getBackendUrl,
  getSocketUrl,
  getImageUrl,
  getProductImageUrl,
  API_CONFIG,
  API_BASE_URL,
};





// import { Platform } from "react-native";

// const LOCAL_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
// const PORT = '5001';

// // Base URL for API calls
// export const API_BASE_URL = `http://${LOCAL_IP}:${PORT}`;

// console.log("🚀 User App API configured for LOCALHOST:", API_BASE_URL);

// // Add this function to get your server URL for map tiles
// export const getMapTileUrl = () => {
//   return `${API_BASE_URL}/data/v3`;
// };

// // ----------- MAIN URL FUNCTIONS -------------- //

// export const getBackendUrl = (): string => {
//   return API_BASE_URL; // Always use local URL
// };

// export const getSocketUrl = (): string => {
//   return getBackendUrl();
// };

// // ----------- IMAGE URL HANDLERS -------------- ///
// // Main image URL handler
// export const getImageUrl = (imagePath: string): string => {
//   if (!imagePath) return "";

//   const backendUrl = getBackendUrl();

//   // If it's already a complete URL
//   if (imagePath.startsWith("http")) {
//     // Replace any production URL with local URL if needed (optional)
//     if (imagePath.includes('ba-lhhs.onrender.com')) {
//       return imagePath.replace('https://ba-lhhs.onrender.com', backendUrl);
//     }
//     return imagePath;
//   }

//   // Handle different path formats
//   if (imagePath.startsWith("/uploads/")) {
//     return `${backendUrl}${imagePath}`;
//   }

//   if (imagePath.startsWith("uploads/")) {
//     return `${backendUrl}/${imagePath}`;
//   }

//   // Default case
//   return `${backendUrl}/uploads/${imagePath}`;
// };

// // Add this missing function that your components need
// export const getProductImageUrl = (imagePath: string): string => {
//   return getImageUrl(imagePath);
// };

// // ----------- ENV BASED API CONFIG -------------- //

// export const API_CONFIG = {
//   BASE_URL: getBackendUrl(),
//   getImageUrl: (path: string) => getImageUrl(path),
//   getProductImageUrl: (path: string) => getProductImageUrl(path),
// };

// // ----------- DEFAULT EXPORT -------------- //

// export default {
//   getBackendUrl,
//   getSocketUrl,
//   getImageUrl,
//   getProductImageUrl,
//   API_CONFIG,
//   API_BASE_URL,
// };
