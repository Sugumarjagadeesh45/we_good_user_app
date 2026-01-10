import { Platform } from 'react-native';

// -----------------------------------------
// 🌐 LIVE SERVER CONFIGURATION
// -----------------------------------------

// Base URL for API calls - Live production server
export const API_BASE_URL = 'https://taxi.webase.co.in';

console.log("🚀 User App API configured for LIVE SERVER:", API_BASE_URL);

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
/**
 * Main image URL handler.
 * @param cacheBust - Appends a timestamp to bypass image cache, useful for profile pictures.
 */
export const getImageUrl = (imagePath: string, cacheBust: boolean = false): string => {
  if (!imagePath) {
    console.log('⚠️ getImageUrl: Empty image path, returning placeholder');
    return "https://via.placeholder.com/150";
  }

  const backendUrl = getBackendUrl();
  console.log(`🖼️ getImageUrl called with: "${imagePath}"`);
  console.log(`🔗 Backend URL: ${backendUrl}`);

  // If it's already a complete URL
  if (imagePath.startsWith("http")) {
    // Fix localhost URLs coming from database
    if (imagePath.includes('localhost') || imagePath.includes('10.0.2.2')) {
      const fixedUrl = imagePath.replace(/https?:\/\/(localhost|10\.0\.2\.2)(:\d+)?/i, backendUrl);
      console.log(`🔄 FIXED localhost URL: ${imagePath} → ${fixedUrl}`);
      return fixedUrl;
    }
    console.log(`✅ Using existing full URL: ${imagePath}`);
    return imagePath;
  }

  // Handle different path formats
  let finalUrl = "";
  if (imagePath.startsWith("/uploads/")) {
    finalUrl = `${backendUrl}${imagePath}`;
  } else if (imagePath.startsWith("uploads/")) {
    finalUrl = `${backendUrl}/${imagePath}`;
  } else {
    // Default case
    finalUrl = `${backendUrl}/uploads/${imagePath}`;
  }

  if (cacheBust) {
    finalUrl += `?t=${Date.now()}`;
    console.log(`✨ Generated image URL (cache-busted): ${finalUrl}`);
  } else {
    console.log(`✨ Generated image URL: ${finalUrl}`);
  }
  return finalUrl;
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
