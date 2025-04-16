export const msalConfig = {
  auth: {
    clientId: "57a6eef3-33fe-4728-93a7-68864c66c991", // Musí být stejné jako ClientId v appsettings.json
    authority: "https://login.microsoftonline.com/ad80ab49-c9d0-4fab-b3f4-a0c7bb45d548", // Instance + TenantId
    redirectUri: "http://localhost:3000", // URL, kam bude uživatel přesměrován po přihlášení
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
  baseUrl: "https://localhost:7227",
  scopes: ["api://57a6eef3-33fe-4728-93a7-68864c66c991/FireFish.Access"]
};
