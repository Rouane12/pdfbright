const PDF_WORKER_URL = "/vendor/pdf.worker.min.mjs";

export type BeforeSendStatus = "clear" | "review" | "attention";

export interface BeforeSendMetadataField {
  label: string;
  value: string;
  privacyRelevant: boolean;
}

export interface BeforeSendFinding {
  id:
    | "personal-metadata"
    | "comments"
    | "forms"
    | "external-links"
    | "attachments"
    | "scripts-actions"
    | "signatures"
    | "security-restrictions"
    | "collection"
    | "xfa";
  label: string;
  detail: string;
  status: Exclude<BeforeSendStatus, "clear">;
  count?: number;
}

export interface BeforeSendReport {
  status: BeforeSendStatus;
  headline: string;
  summary: string;
  pageCount: number;
  fileSizeBytes: number;
  metadata: BeforeSendMetadataField[];
  findings: BeforeSendFinding[];
  counts: {
    annotations: number;
    comments: number;
    forms: number;
    externalLinks: number;
    attachments: number;
    scriptsAndActions: number;
    signatures: number;
  };
  documentInfo: {
    pdfVersion: string | null;
    creator: string | null;
    producer: string | null;
    encryptedOrRestricted: boolean;
    collectionPresent: boolean;
    xfaPresent: boolean;
  };
}

export interface InspectBeforeSendOptions {
  signal?: AbortSignal;
  onProgress?: (message: string) => void;
}

export class BeforeSendInspectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BeforeSendInspectionError";
  }
}

type UnknownRecord = Record<string, unknown>;

const MARKUP_ANNOTATION_TYPES = new Set([
  1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 26,
]);

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" ? (value as UnknownRecord) : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function collectionSize(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Map) return value.size;
  if (Array.isArray(value)) return value.length;
  const object = record(value);
  return object ? Object.keys(object).length : 0;
}

function countFormFields(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Map) {
    let total = 0;
    for (const fields of value.values()) {
      total += Array.isArray(fields) ? fields.length : 1;
    }
    return total;
  }

  const object = record(value);
  if (!object) return 0;
  return Object.values(object).reduce<number>(
    (total, fields) => total + (Array.isArray(fields) ? fields.length : 1),
    0,
  );
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Inspection cancelled.", "AbortError");
  }
}

function metadataField(
  info: UnknownRecord,
  key: string,
  label: string,
  privacyRelevant: boolean,
): BeforeSendMetadataField | null {
  const value = stringValue(info[key]);
  return value ? { label, value, privacyRelevant } : null;
}

function nestedString(source: UnknownRecord, key: string, nestedKey: string) {
  return stringValue(record(source[key])?.[nestedKey]);
}

function statusFor(findings: BeforeSendFinding[]): BeforeSendStatus {
  if (findings.some((finding) => finding.status === "attention")) return "attention";
  if (findings.length > 0) return "review";
  return "clear";
}

function headlineFor(status: BeforeSendStatus) {
  if (status === "clear") return "No obvious send-risk signals detected";
  if (status === "review") return "Review a few details before you send it";
  return "This PDF contains items worth checking carefully";
}

function summaryFor(status: BeforeSendStatus, count: number) {
  if (status === "clear") {
    return "PDFBright did not find obvious metadata, annotation, attachment, form, link, or action signals that need review.";
  }

  return `PDFBright found ${count} send-check categor${count === 1 ? "y" : "ies"} worth reviewing. Nothing here is uploaded or removed automatically.`;
}

export async function inspectPdfBeforeSend(
  file: File,
  options: InspectBeforeSendOptions = {},
): Promise<BeforeSendReport> {
  const { signal, onProgress } = options;
  abortIfNeeded(signal);

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!looksLikePdf) {
    throw new BeforeSendInspectionError("Please choose a PDF file.");
  }

  if (file.size === 0) {
    throw new BeforeSendInspectionError("This PDF appears to be empty.");
  }

  onProgress?.("Opening the PDF locally…");
  const bytes = new Uint8Array(await file.arrayBuffer());
  abortIfNeeded(signal);

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  const loadingTask = pdfjs.getDocument({ data: bytes });

  try {
    const documentProxy = await loadingTask.promise;
    abortIfNeeded(signal);
    onProgress?.("Checking document metadata and hidden baggage…");

    const [
      metadataResult,
      attachments,
      documentJsActions,
      openAction,
      permissions,
      signatures,
      fieldObjects,
    ] = await Promise.all([
      documentProxy.getMetadata(),
      documentProxy.getAttachments(),
      documentProxy.getJSActions(),
      documentProxy.getOpenAction(),
      documentProxy.getPermissions(),
      documentProxy.getSignatures(),
      documentProxy.getFieldObjects(),
    ]);

    abortIfNeeded(signal);

    const info = record(metadataResult.info) ?? {};
    const metadata = [
      metadataField(info, "Title", "Title", false),
      metadataField(info, "Author", "Author", true),
      metadataField(info, "Subject", "Subject", true),
      metadataField(info, "Keywords", "Keywords", true),
      metadataField(info, "Creator", "Creator application", false),
      metadataField(info, "Producer", "PDF producer", false),
      metadataField(info, "CreationDate", "Created", false),
      metadataField(info, "ModDate", "Modified", false),
    ].filter((field): field is BeforeSendMetadataField => field !== null);

    let annotationCount = 0;
    let commentCount = 0;
    let externalLinkCount = 0;
    let pageAttachmentCount = 0;
    let pageJsActionCount = 0;

    onProgress?.("Inspecting page annotations, links, and actions…");

    for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
      abortIfNeeded(signal);
      const page = await documentProxy.getPage(pageNumber);

      try {
        const [annotations, pageJsActions] = await Promise.all([
          page.getAnnotations({ intent: "any" }),
          page.getJSActions(),
        ]);

        pageJsActionCount += collectionSize(pageJsActions);

        for (const rawAnnotation of annotations) {
          const annotation = record(rawAnnotation);
          if (!annotation) continue;
          annotationCount += 1;

          if (
            stringValue(annotation.url) ||
            stringValue(annotation.unsafeUrl)
          ) {
            externalLinkCount += 1;
          }

          const annotationType =
            typeof annotation.annotationType === "number"
              ? annotation.annotationType
              : null;

          const hasCommentText =
            Boolean(nestedString(annotation, "contentsObj", "str")) ||
            Boolean(stringValue(annotation.contents));

          if (
            hasCommentText ||
            (annotationType !== null && MARKUP_ANNOTATION_TYPES.has(annotationType))
          ) {
            commentCount += 1;
          }

          if (annotationType === 17 || record(annotation.file)) {
            pageAttachmentCount += 1;
          }
        }
      } finally {
        page.cleanup();
      }
    }

    const attachmentCount = collectionSize(attachments) + pageAttachmentCount;
    const formCount = countFormFields(fieldObjects);
    const documentJsActionCount = collectionSize(documentJsActions);
    const openActionCount = openAction ? 1 : 0;
    const scriptsAndActions =
      documentJsActionCount + pageJsActionCount + openActionCount;
    const signatureCount = Array.isArray(signatures) ? signatures.length : collectionSize(signatures);
    const encryptedOrRestricted =
      Boolean(stringValue(info.EncryptFilterName)) ||
      (permissions instanceof Set ? permissions.size > 0 : Boolean(permissions));
    const collectionPresent = info.IsCollectionPresent === true;
    const xfaPresent = info.IsXFAPresent === true;

    const findings: BeforeSendFinding[] = [];
    const personalMetadataCount = metadata.filter((field) => field.privacyRelevant).length;

    if (personalMetadataCount > 0) {
      findings.push({
        id: "personal-metadata",
        label: "Personal metadata is present",
        detail:
          "Author, subject, or keyword metadata can reveal information you may not intend to share.",
        status: "review",
        count: personalMetadataCount,
      });
    }

    if (commentCount > 0) {
      findings.push({
        id: "comments",
        label: "Comments or review annotations are present",
        detail:
          "Review notes, highlights, markups, or similar annotations can expose editing history or internal feedback.",
        status: "review",
        count: commentCount,
      });
    }

    if (formCount > 0) {
      findings.push({
        id: "forms",
        label: "Interactive form fields are present",
        detail:
          "Form fields may contain editable values or behaviors that remain interactive after sharing.",
        status: "review",
        count: formCount,
      });
    }

    if (externalLinkCount > 0) {
      findings.push({
        id: "external-links",
        label: "External links are present",
        detail:
          "Links can send recipients outside the PDF. Review destinations before sharing the file.",
        status: "review",
        count: externalLinkCount,
      });
    }

    if (attachmentCount > 0) {
      findings.push({
        id: "attachments",
        label: "Embedded files are present",
        detail:
          "The PDF contains file attachments that recipients may be able to open separately from the visible pages.",
        status: "attention",
        count: attachmentCount,
      });
    }

    if (scriptsAndActions > 0) {
      findings.push({
        id: "scripts-actions",
        label: "Automatic actions or JavaScript are present",
        detail:
          "The document contains scripted or automatic behavior. Review it carefully before distributing the PDF.",
        status: "attention",
        count: scriptsAndActions,
      });
    }

    if (signatureCount > 0) {
      findings.push({
        id: "signatures",
        label: "Digital signatures are present",
        detail:
          "A signature can be important evidence. Editing the PDF afterward may affect signature validity.",
        status: "review",
        count: signatureCount,
      });
    }

    if (encryptedOrRestricted) {
      findings.push({
        id: "security-restrictions",
        label: "Security restrictions are present",
        detail:
          "This PDF reports encryption or permission restrictions. Recipients may have limits on copying, editing, or printing.",
        status: "review",
      });
    }

    if (collectionPresent) {
      findings.push({
        id: "collection",
        label: "This PDF is a collection or portfolio",
        detail:
          "PDF portfolios can contain additional files or structure beyond the page view.",
        status: "attention",
      });
    }

    if (xfaPresent) {
      findings.push({
        id: "xfa",
        label: "XFA form content is present",
        detail:
          "XFA forms can behave differently across PDF viewers and may contain interactive form data.",
        status: "review",
      });
    }

    const status = statusFor(findings);

    return {
      status,
      headline: headlineFor(status),
      summary: summaryFor(status, findings.length),
      pageCount: documentProxy.numPages,
      fileSizeBytes: file.size,
      metadata,
      findings,
      counts: {
        annotations: annotationCount,
        comments: commentCount,
        forms: formCount,
        externalLinks: externalLinkCount,
        attachments: attachmentCount,
        scriptsAndActions,
        signatures: signatureCount,
      },
      documentInfo: {
        pdfVersion: stringValue(info.PDFFormatVersion),
        creator: stringValue(info.Creator),
        producer: stringValue(info.Producer),
        encryptedOrRestricted,
        collectionPresent,
        xfaPresent,
      },
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;

    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      throw new BeforeSendInspectionError(
        "This PDF is password-protected. Unlock it before running the send check.",
      );
    }
    if (name === "InvalidPDFException") {
      throw new BeforeSendInspectionError("This PDF appears to be damaged or invalid.");
    }

    if (error instanceof BeforeSendInspectionError) throw error;
    throw new BeforeSendInspectionError(
      "PDFBright could not inspect this PDF safely in your browser.",
    );
  } finally {
    await loadingTask.destroy();
  }
}
