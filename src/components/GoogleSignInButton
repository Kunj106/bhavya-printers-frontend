import { useEffect, useRef, useId } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let gsiScriptPromise: Promise<void> | null = null;

/** Loads the Google Identity Services script exactly once, however many
 *  GoogleSignInButton instances end up mounted across the app. */
function loadGsiScript(): Promise<void> {
  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}

interface GoogleSignInButtonProps {
  onIdToken: (idToken: string) => void;
  onError?: (message: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  disabled?: boolean;
}

/**
 * Renders Google's official Sign-In button. When the user completes
 * Google Sign-In, calls onIdToken with the raw idToken so the caller can
 * POST it to whichever backend endpoint applies (admin login, bank login,
 * or bank google-register).
 *
 * Requires VITE_GOOGLE_CLIENT_ID to be set in your frontend .env file,
 * matching the Client ID configured as google.client.id on the backend.
 */
export function GoogleSignInButton({ onIdToken, onError, text = 'signin_with', disabled }: GoogleSignInButtonProps) {
  const buttonDivRef = useRef<HTMLDivElement>(null);
  const reactId = useId();

  useEffect(() => {
    let cancelled = false;

    if (!GOOGLE_CLIENT_ID) {
      onError?.('Google Sign-In is not configured (missing VITE_GOOGLE_CLIENT_ID).');
      return;
    }

    loadGsiScript()
      .then(() => {
        if (cancelled || !buttonDivRef.current) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential: string }) => {
            if (response?.credential) {
              onIdToken(response.credential);
            } else {
              onError?.('Google Sign-In did not return a credential.');
            }
          },
        });

        window.google.accounts.id.renderButton(buttonDivRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          width: 320,
          shape: 'rectangular',
        });
      })
      .catch((err: Error) => {
        onError?.(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div
      key={reactId}
      ref={buttonDivRef}
      className={disabled ? 'pointer-events-none opacity-50' : ''}
    />
  );
}