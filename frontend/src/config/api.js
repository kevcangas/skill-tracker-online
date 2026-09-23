/**
 * Resolves the backend base URL dynamically.
 * 
 * In Homelab:
 * - Frontend domain: https://skilltracker.homelab.internal
 * - Backend domain:  https://api-skilltracker.homelab.internal
 * 
 * In Local Dev / Docker:
 * - Empty string '' so relative requests /api/v1/... proxy through Vite dev server or Nginx
 */
export const getApiBaseUrl = () => {
  // 1. Runtime environment injected from .env via docker container (window.__ENV__)
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_BASE_URL) {
    return window.__ENV__.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // 2. Build-time Vite environment variable from .env
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // 3. Browser runtime resolution
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol } = window.location;

    // Check localStorage override
    const customUrl = localStorage.getItem('api_server_url');
    if (customUrl) {
      return customUrl.replace(/\/+$/, '');
    }

    // Homelab internal domain resolution
    if (hostname === 'skilltracker.homelab.internal' || hostname.endsWith('.homelab.internal')) {
      return `${protocol}//api-skilltracker.homelab.internal`;
    }

    // General pattern: skilltracker.<domain> -> api-skilltracker.<domain>
    if (hostname.startsWith('skilltracker.')) {
      return `${protocol}//api-${hostname}`;
    }
  }

  // Fallback to relative URL for local development proxy
  return '';
};

export const apiUrl = (endpoint) => {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
};
