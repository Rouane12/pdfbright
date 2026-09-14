"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function resolveRequestOrigin(requestHeaders: Headers) {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.VERCEL_ENV === "production") {
    return process.env.NEXT_PUBLIC_APP_URL ?? "https://pdfbright.app";
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");

  if (host) {
    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const protocol = forwardedProto ?? (host.startsWith("localhost") ? "http" : "https");
    return `${protocol}://${host}`;
  }

  return requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!validEmail) {
    redirect("/login?error=invalid-email");
  }

  const requestHeaders = await headers();
  const origin = resolveRequestOrigin(requestHeaders);
  const callbackUrl = new URL("/auth/confirm", origin).toString();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    redirect("/login?error=send-failed");
  }

  redirect("/login?sent=1");
}
