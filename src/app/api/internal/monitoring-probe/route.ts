import { NextResponse } from "next/server";
import { captureServerException } from "@/lib/analytics/server";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await captureServerException(
    "monitoring_probe",
    new Error("PDFBright controlled monitoring probe"),
    null,
    { step: "verification" },
  );

  return NextResponse.json({ ok: true });
}
