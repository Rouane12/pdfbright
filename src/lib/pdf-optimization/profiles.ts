export type PdfCompressionMode = "balanced" | "smaller-file" | "best-quality";

export interface PdfCompressionProfile {
  id: PdfCompressionMode;
  label: string;
  description: string;
  maxRenderDimension: number;
  maxRenderScale: number;
  jpegQuality: number;
}

export const PDF_COMPRESSION_PROFILES: Record<PdfCompressionMode, PdfCompressionProfile> = {
  balanced: {
    id: "balanced",
    label: "Balanced",
    description: "Good size reduction while keeping scanned text and normal document details clear.",
    maxRenderDimension: 2400,
    maxRenderScale: 3.2,
    jpegQuality: 0.8,
  },
  "smaller-file": {
    id: "smaller-file",
    label: "Smaller File",
    description: "Stronger image downsampling and compression for sharing when file size matters most.",
    maxRenderDimension: 1800,
    maxRenderScale: 2.5,
    jpegQuality: 0.65,
  },
  "best-quality": {
    id: "best-quality",
    label: "Best Quality",
    description: "Lighter optimization that keeps more scan detail and resolution.",
    maxRenderDimension: 3200,
    maxRenderScale: 4,
    jpegQuality: 0.92,
  },
};

export const PDF_COMPRESSION_OPTIONS = [
  PDF_COMPRESSION_PROFILES.balanced,
  PDF_COMPRESSION_PROFILES["smaller-file"],
  PDF_COMPRESSION_PROFILES["best-quality"],
] as const;
