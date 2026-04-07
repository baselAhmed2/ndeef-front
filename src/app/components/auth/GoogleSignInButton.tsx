"use client";

import { useEffect, useId, useRef, useState } from "react";

const RAW_GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
const GOOGLE_CLIENT_PLACEHOLDERS = new Set([
  "",
  "your-google-client-id.apps.googleusercontent.com",
]);

function getGoogleClientId() {
  return GOOGLE_CLIENT_PLACEHOLDERS.has(RAW_GOOGLE_CLIENT_ID)
    ? ""
    : RAW_GOOGLE_CLIENT_ID;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, string | number>,
          ) => void;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google sign-in.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in."));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => Promise<void> | void;
  disabled?: boolean;
  text?: "signin_with" | "signup_with" | "continue_with";
}

export function GoogleSignInButton({
  onCredential,
  disabled = false,
  text = "continue_with",
}: GoogleSignInButtonProps) {
  const googleClientId = getGoogleClientId();
  const elementId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const setupGoogleButton = async () => {
      if (disabled || !containerRef.current) return;

      if (!googleClientId) {
        if (!active) return;
        const origin =
          typeof window !== "undefined" ? window.location.origin : "this app";
        const localhostOrigin = "http://localhost:3000";
        const loopbackOrigin = "http://127.0.0.1:3000";
        setError(
          `Google sign-in is not configured yet. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local, then register ${localhostOrigin}, ${loopbackOrigin}, and ${origin} in Google Cloud Console.`,
        );
        containerRef.current.innerHTML = "";
        return;
      }

      try {
        await loadGoogleScript();

        if (!active || !window.google?.accounts?.id || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            const credential = response.credential;
            if (!credential) {
              setError("Google sign-in did not return a valid token.");
              return;
            }

            setError("");
            await onCredential(credential);
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width: 320,
          logo_alignment: "left",
        });
      } catch (setupError) {
        if (!active) return;

        const origin =
          typeof window !== "undefined" ? window.location.origin : "this app";
        setError(
          setupError instanceof Error
            ? `${setupError.message} If Google shows origin_mismatch, add ${origin} to the OAuth client's authorized JavaScript origins.`
            : `Google sign-in is unavailable right now. Check that ${origin} is registered in Google Cloud Console.`,
        );
      }
    };

    setupGoogleButton();

    return () => {
      active = false;
    };
  }, [disabled, googleClientId, onCredential, text]);

  return (
    <div className="space-y-2">
      <div
        id={elementId}
        ref={containerRef}
        className={disabled ? "pointer-events-none opacity-60" : ""}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
