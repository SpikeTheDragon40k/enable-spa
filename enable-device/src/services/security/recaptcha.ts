let recaptchaScriptPromise: Promise<void> | null = null;

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const SITE_KEY = '6Lfr8G4sAAAAAO81frUGstTO2ED9cJc9t3XO3gm0';

export function loadRecaptcha(siteKey: string): Promise<void> {
  if (recaptchaScriptPromise) return recaptchaScriptPromise;

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="recaptcha/enterprise.js"]'
    );

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = reject;

    document.body.appendChild(script);
  });

  return recaptchaScriptPromise;
}

export function unloadRecaptcha() {
  const script = document.querySelector(
    'script[src*="recaptcha/enterprise.js"]'
  );
  if (script) {
    script.remove();
  }
  recaptchaScriptPromise = null;
  // Optionally remove grecaptcha from window
  if (window.grecaptcha) {
    delete window.grecaptcha;
  }
}

export const getRecaptchaToken = async (
  action: string
): Promise<string> => {
  await loadRecaptcha(SITE_KEY);

  if (!window.grecaptcha?.enterprise) {
    throw new Error("reCAPTCHA not loaded");
  }

  const token = await new Promise<string>((resolve, reject) => {
    window.grecaptcha.enterprise.ready(() => {
      window.grecaptcha.enterprise
        .execute(SITE_KEY, { action })
        .then((token: string) => resolve(token))
        .catch((err: any) => reject(err));
    });
  });

  unloadRecaptcha();

  return token;
};
