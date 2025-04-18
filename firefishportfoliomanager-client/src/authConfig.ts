// Read environment variables for redirect URI and API base URL
const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI || window.location.origin;
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const msalConfig = {
  auth: {
    clientId: "57a6eef3-33fe-4728-93a7-68864c66c991", // Musí být stejné jako ClientId v appsettings.json
    authority: "https://login.microsoftonline.com/ad80ab49-c9d0-4fab-b3f4-a0c7bb45d548", // Instance + TenantId
    redirectUri: REDIRECT_URI, // use environment variable instead of hard-coded URL
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  }
};

// Scopes pro přístup k API
export const loginRequest = {
  scopes: ["User.Read", "api://57a6eef3-33fe-4728-93a7-68864c66c991/FireFish.Access"]
};

// API konfigurace
export const apiConfig = {
  baseUrl: API_BASE_URL, // use environment variable instead of hard-coded URL
  scopes: ["api://57a6eef3-33fe-4728-93a7-68864c66c991/FireFish.Access"]
};
