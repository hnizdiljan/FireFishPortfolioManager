/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REDIRECT_URI?: string; // Optional, as it has a fallback in authConfig
  readonly VITE_API_BASE_URL: string;
  // Přidejte další proměnné prostředí, které používáte
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 