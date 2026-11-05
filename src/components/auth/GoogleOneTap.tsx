"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";

interface GoogleOneTapProps {
  clientId?: string;
  callbackUrl?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
          }) => void;
          prompt: (
            notification?: (notification: {
              isNotDisplayed: () => boolean;
              isSkippedMoment: () => boolean;
            }) => void
          ) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

/**
 * Google One Tap authentication component
 * Features auto_select: true for instant 1-click authorization without password prompts.
 */
export function GoogleOneTap({
  clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  callbackUrl = "/?auth=success",
}: GoogleOneTapProps) {
  useEffect(() => {
    if (!clientId || typeof window === "undefined") return;

    const initializeGoogleOneTap = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (response.credential) {
            await signIn(
              "google",
              { callbackUrl },
              {
                prompt: "select_account",
                credential: response.credential,
              }
            );
          }
        },
        auto_select: true, // Seamless 1-click authorization requirement
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt();
    };

    if (window.google?.accounts?.id) {
      initializeGoogleOneTap();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", initializeGoogleOneTap);
      } else {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogleOneTap;
        document.head.appendChild(script);
      }
    }
  }, [clientId, callbackUrl]);

  return null;
}
