/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_API?: string; // 'true' | 'false'
  readonly VITE_AUTH_TOKEN_KEY?: string;
  readonly VITE_HTTP_TIMEOUT_MS?: string;
  readonly VITE_HTTP_RETRY_ATTEMPTS?: string;
  readonly VITE_HTTP_RETRY_DELAY_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
