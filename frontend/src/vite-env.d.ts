/// <reference types="vite/client" />

/**
 * Vite environment variable types
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_REPORTING: string
  readonly VITE_DEV_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
