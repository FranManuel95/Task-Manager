/// <reference types="vite/client" />

// (Opcional) declara tus variables VITE_* para autocompletado estricto
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
