export const OCR_LANGUAGE_OPTIONS = [
  { code: "eng", label: "English" },
  { code: "fra", label: "French" },
  { code: "spa", label: "Spanish" },
  { code: "deu", label: "German" },
  { code: "por", label: "Portuguese" },
] as const;

export type PdfOcrLanguage = (typeof OCR_LANGUAGE_OPTIONS)[number]["code"];

export interface PdfOcrWord {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface PdfOcrTarget {
  originalPageNumber: number;
  outputPageNumber: number;
}

export interface PdfOcrPageResult {
  originalPageNumber: number;
  outputPageNumber: number;
  language: PdfOcrLanguage;
  words: PdfOcrWord[];
  recognizedCharacters: number;
  meanConfidence: number;
  renderWidthPixels: number;
  renderHeightPixels: number;
  durationMs: number;
}

export interface PdfOcrRunResult {
  pages: PdfOcrPageResult[];
  durationMs: number;
}

export interface PdfOcrProgress {
  phase: "loading" | "recognizing";
  pageNumber?: number;
  pageCount?: number;
  pageProgress?: number;
}
