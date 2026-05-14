import { Injectable } from '@angular/core';

type TrustedScriptName = 'google-gsi' | 'razorpay-checkout';

@Injectable({ providedIn: 'root' })
export class ThirdPartyScriptService {
  private readonly trustedSources: Record<TrustedScriptName, string> = {
    'google-gsi': 'https://accounts.google.com/gsi/client',
    'razorpay-checkout': 'https://checkout.razorpay.com/v1/checkout.js'
  };

  private readonly loadingScripts = new Map<TrustedScriptName, Promise<void>>();

  load(name: TrustedScriptName): Promise<void> {
    const existingPromise = this.loadingScripts.get(name);
    if (existingPromise) {
      return existingPromise;
    }

    const source = this.trustedSources[name];
    const existingScript = document.querySelector<HTMLScriptElement>(`script[data-sdk="${name}"]`);
    if (existingScript?.dataset['loaded'] === 'true') {
      return Promise.resolve();
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const script = existingScript ?? document.createElement('script');
      script.src = source;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'strict-origin-when-cross-origin';
      script.dataset['sdk'] = name;

      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = () => {
        this.loadingScripts.delete(name);
        reject(new Error(`Unable to load trusted script: ${name}`));
      };

      if (!existingScript) {
        document.head.appendChild(script);
      }
    });

    this.loadingScripts.set(name, loadPromise);
    return loadPromise;
  }
}
