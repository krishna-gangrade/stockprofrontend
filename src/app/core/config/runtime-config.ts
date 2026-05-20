import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    __stockproConfig?: {
      googleClientId?: string;
      apiUrl?: string;
    };
  }
}

type RuntimeConfig = {
  googleClientId: string;
  apiUrl: string;
};

export function getRuntimeConfig(): RuntimeConfig {
  const runtimeConfig = window.__stockproConfig;

  return {
    googleClientId: runtimeConfig?.googleClientId?.trim() || environment.googleClientId,
    apiUrl: runtimeConfig?.apiUrl?.trim() || environment.apiUrl
  };
}
