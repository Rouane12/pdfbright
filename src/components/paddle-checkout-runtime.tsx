"use client";

import Script from "next/script";

type PaddleRuntime = {
  Environment: {
    set(environment: "sandbox"): void;
  };
  Initialize(options: {
    token: string;
    checkout?: {
      settings?: {
        displayMode?: "overlay";
        theme?: "light" | "dark";
        successUrl?: string;
        showAddDiscounts?: boolean;
      };
    };
  }): void;
  Checkout: {
    open(options: {
      transactionId: string;
      settings?: {
        displayMode?: "overlay";
        theme?: "light" | "dark";
        successUrl?: string;
        showAddDiscounts?: boolean;
      };
    }): void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleRuntime;
    __pdfBrightPaddleInitialized?: boolean;
  }
}

const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim();

export function openPaddleTransaction(transactionId: string) {
  if (!window.Paddle || !window.__pdfBrightPaddleInitialized) {
    throw new Error("Paddle checkout is still loading. Please try again in a moment.");
  }

  window.Paddle.Checkout.open({
    transactionId,
    settings: {
      displayMode: "overlay",
      theme: "light",
      successUrl: `${window.location.origin}/account?checkout=success`,
      showAddDiscounts: false,
    },
  });
}

export function PaddleCheckoutRuntime() {
  if (!clientToken) return null;
  const token = clientToken;

  function initializePaddle() {
    if (!window.Paddle || window.__pdfBrightPaddleInitialized) return;

    // Temporary launch gate: keep every deployed build on Paddle Sandbox until
    // Live account/domain verification is approved and the final live proof is
    // intentionally enabled.
    window.Paddle.Environment.set("sandbox");

    window.Paddle.Initialize({
      token,
      checkout: {
        settings: {
          displayMode: "overlay",
          theme: "light",
          successUrl: `${window.location.origin}/account?checkout=success`,
          showAddDiscounts: false,
        },
      },
    });

    window.__pdfBrightPaddleInitialized = true;
  }

  return (
    <Script
      id="pdfbright-paddle-js"
      src="https://cdn.paddle.com/paddle/v2/paddle.js"
      strategy="afterInteractive"
      onLoad={initializePaddle}
    />
  );
}
