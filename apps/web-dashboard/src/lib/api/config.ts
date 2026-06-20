export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

export function getApiConfig(): ApiConfig {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3003';
  const apiKey = import.meta.env.VITE_API_KEY ?? '';

  if (!apiKey) {
    throw new Error('VITE_API_KEY is required for API requests');
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey,
  };
}
