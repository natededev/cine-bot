/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_ENABLE_DEBUG_MODE: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_TYPING_INDICATOR_DELAY: string;
  readonly VITE_MAX_MESSAGES: string;
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string;
  readonly DEV: boolean; // Vite development mode
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
