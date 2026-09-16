"use client";

import { useEffect } from "react";
import { captureClientException } from "@/lib/analytics/client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientException("app_runtime", error, "unhandled");
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center px-5 py-16 text-center sm:px-8">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <p className="section-kicker">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          PDFBright hit an unexpected error
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">
          Your original PDF has not been changed. Try the step again, or return to the cleaner and choose the file again.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" className="button button--primary" onClick={reset}>
            Try again
          </button>
          <a className="button button--secondary" href="/#upload">
            Return to cleaner
          </a>
        </div>
      </div>
    </main>
  );
}
