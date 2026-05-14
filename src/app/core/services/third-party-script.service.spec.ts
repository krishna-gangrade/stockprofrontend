import { TestBed } from '@angular/core/testing';
import { ThirdPartyScriptService } from './third-party-script.service';

describe('ThirdPartyScriptService', () => {
  let service: ThirdPartyScriptService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ThirdPartyScriptService]
    });

    service = TestBed.inject(ThirdPartyScriptService);
    document.head.querySelectorAll('script[data-sdk]').forEach(script => script.remove());
  });

  afterEach(() => {
    document.head.querySelectorAll('script[data-sdk]').forEach(script => script.remove());
  });

  it('creates and resolves a trusted script element', async () => {
    const promise = service.load('google-gsi');
    const script = document.head.querySelector('script[data-sdk="google-gsi"]') as HTMLScriptElement | null;

    expect(script).not.toBeNull();
    expect(script?.src).toContain('https://accounts.google.com/gsi/client');
    expect(script?.async).toBeTrue();
    expect(script?.defer).toBeTrue();
    expect(script?.crossOrigin).toBe('anonymous');
    expect(script?.referrerPolicy).toBe('strict-origin-when-cross-origin');

    script?.onload?.(new Event('load'));
    await expectAsync(promise).toBeResolved();
    expect(script?.dataset['loaded']).toBe('true');
  });

  it('reuses the same pending promise for duplicate loads', async () => {
    const firstPromise = service.load('razorpay-checkout');
    const secondPromise = service.load('razorpay-checkout');

    expect(secondPromise).toBe(firstPromise);
    const script = document.head.querySelector('script[data-sdk="razorpay-checkout"]') as HTMLScriptElement | null;
    expect(document.head.querySelectorAll('script[data-sdk="razorpay-checkout"]').length).toBe(1);

    script?.onload?.(new Event('load'));
    await expectAsync(firstPromise).toBeResolved();
  });

  it('returns immediately when a script is already marked as loaded', async () => {
    const script = document.createElement('script');
    script.dataset['sdk'] = 'google-gsi';
    script.dataset['loaded'] = 'true';
    document.head.appendChild(script);

    await expectAsync(service.load('google-gsi')).toBeResolved();
    expect(document.head.querySelectorAll('script[data-sdk="google-gsi"]').length).toBe(1);
  });

  it('reuses an existing script element that is not loaded yet', async () => {
    const script = document.createElement('script');
    script.dataset['sdk'] = 'razorpay-checkout';
    document.head.appendChild(script);

    const promise = service.load('razorpay-checkout');

    expect(document.head.querySelectorAll('script[data-sdk="razorpay-checkout"]').length).toBe(1);
    expect(script.src).toContain('https://checkout.razorpay.com/v1/checkout.js');

    script.onload?.(new Event('load'));
    await expectAsync(promise).toBeResolved();
  });

  it('rejects failed loads and retries cleanly', async () => {
    const firstPromise = service.load('google-gsi');
    const firstScript = document.head.querySelector('script[data-sdk="google-gsi"]') as HTMLScriptElement;

    firstScript.onerror?.(new Event('error'));
    await expectAsync(firstPromise).toBeRejectedWithError('Unable to load trusted script: google-gsi');

    firstScript.remove();

    const retryPromise = service.load('google-gsi');
    const retryScript = document.head.querySelector('script[data-sdk="google-gsi"]') as HTMLScriptElement;

    expect(retryPromise).not.toBe(firstPromise);
    retryScript.onload?.(new Event('load'));
    await expectAsync(retryPromise).toBeResolved();
  });
});
