/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  /** POST multipart `image` → `{ label, confidence? }` */
  readonly VITE_DETECT_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
