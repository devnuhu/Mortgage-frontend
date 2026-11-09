// src/services/cpas-config.js
// Base URL for the external CPAS API. __CPAS_API_URL__ is injected by
// vite.config.js: "/cpas-api" (proxied by the dev server) during development,
// the real CPAS URL in production builds.
export const CPAS_API_BASE_URL = __CPAS_API_URL__;
