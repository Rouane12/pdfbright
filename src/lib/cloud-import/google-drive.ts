export type GoogleDriveImportStage = "authorizing" | "picking" | "downloading";

export type GoogleDriveImportErrorCode =
  | "not-configured"
  | "script-load-failed"
  | "authorization-failed"
  | "picker-failed"
  | "download-failed"
  | "invalid-selection";

export class GoogleDriveImportError extends Error {
  constructor(
    public readonly code: GoogleDriveImportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GoogleDriveImportError";
  }
}

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

type GoogleTokenClient = {
  callback: (response: GoogleTokenResponse) => void;
  requestAccessToken: (options?: { prompt?: string }) => void;
};

type GooglePickerDocument = {
  id?: string;
  name?: string;
  mimeType?: string;
  resourceKey?: string;
};

type GooglePickerResponse = {
  action?: string;
  docs?: GooglePickerDocument[];
};

type GoogleDocsView = {
  setMimeTypes: (mimeTypes: string) => GoogleDocsView;
  setMode: (mode: string) => GoogleDocsView;
};

type GooglePicker = {
  setVisible: (visible: boolean) => void;
};

type GooglePickerBuilder = {
  setDeveloperKey: (developerKey: string) => GooglePickerBuilder;
  setAppId: (appId: string) => GooglePickerBuilder;
  setOAuthToken: (accessToken: string) => GooglePickerBuilder;
  setOrigin: (origin: string) => GooglePickerBuilder;
  addView: (view: GoogleDocsView) => GooglePickerBuilder;
  setCallback: (callback: (response: GooglePickerResponse) => void) => GooglePickerBuilder;
  build: () => GooglePicker;
};

type GooglePickerNamespace = {
  Action: {
    PICKED: string;
    CANCEL: string;
  };
  DocsViewMode: {
    LIST: string;
  };
  DocsView: new () => GoogleDocsView;
  PickerBuilder: new () => GooglePickerBuilder;
};

type GoogleWindow = Window & {
  gapi?: {
    load: (
      library: string,
      options:
        | (() => void)
        | {
            callback?: () => void;
            onerror?: () => void;
            timeout?: number;
            ontimeout?: () => void;
          },
    ) => void;
  };
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (response: GoogleTokenResponse) => void;
          error_callback?: () => void;
        }) => GoogleTokenClient;
      };
    };
    picker?: GooglePickerNamespace;
  };
};

type GoogleDriveConfig = {
  clientId: string;
  apiKey: string;
  appId: string;
};

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const PDF_MIME_TYPE = "application/pdf";
const GAPI_SCRIPT_ID = "pdfbright-google-api";
const GIS_SCRIPT_ID = "pdfbright-google-identity";
const GAPI_SCRIPT_URL = "https://apis.google.com/js/api.js";
const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const PICKER_LOAD_TIMEOUT_MS = 10_000;

let pickerReadyPromise: Promise<void> | null = null;
let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function getGoogleWindow() {
  if (typeof window === "undefined") {
    throw new GoogleDriveImportError(
      "script-load-failed",
      "Google Drive import is only available in the browser.",
    );
  }
  return window as GoogleWindow;
}

function getConfig(): GoogleDriveConfig {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID?.trim();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY?.trim();
  const appId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID?.trim();

  if (!clientId || !apiKey || !appId) {
    throw new GoogleDriveImportError(
      "not-configured",
      "Google Drive import is not configured yet. Choose a PDF from your device for now.",
    );
  }

  return { clientId, apiKey, appId };
}

function loadScript(id: string, src: string, isReady: () => boolean) {
  if (isReady()) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      cleanup();
      if (isReady()) {
        resolve();
      } else {
        reject(
          new GoogleDriveImportError(
            "script-load-failed",
            "Google Drive could not finish loading. Please try again.",
          ),
        );
      }
    };

    const handleError = () => {
      cleanup();
      reject(
        new GoogleDriveImportError(
          "script-load-failed",
          "Google Drive could not be loaded. Check your connection and try again.",
        ),
      );
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.id = id;
      script.src = src;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
}

async function loadGoogleLibraries() {
  const googleWindow = getGoogleWindow();

  await Promise.all([
    loadScript(GAPI_SCRIPT_ID, GAPI_SCRIPT_URL, () => Boolean(googleWindow.gapi)),
    loadScript(
      GIS_SCRIPT_ID,
      GIS_SCRIPT_URL,
      () => Boolean(googleWindow.google?.accounts?.oauth2),
    ),
  ]);

  if (googleWindow.google?.picker) return;

  if (!pickerReadyPromise) {
    pickerReadyPromise = new Promise<void>((resolve, reject) => {
      const gapi = googleWindow.gapi;
      if (!gapi) {
        reject(
          new GoogleDriveImportError(
            "script-load-failed",
            "Google Drive could not initialize. Please try again.",
          ),
        );
        return;
      }

      gapi.load("picker", {
        callback: () => {
          if (googleWindow.google?.picker) {
            resolve();
          } else {
            reject(
              new GoogleDriveImportError(
                "script-load-failed",
                "Google Drive picker could not initialize. Please try again.",
              ),
            );
          }
        },
        onerror: () => {
          reject(
            new GoogleDriveImportError(
              "script-load-failed",
              "Google Drive picker could not be loaded. Please try again.",
            ),
          );
        },
        timeout: PICKER_LOAD_TIMEOUT_MS,
        ontimeout: () => {
          reject(
            new GoogleDriveImportError(
              "script-load-failed",
              "Google Drive picker took too long to load. Please try again.",
            ),
          );
        },
      });
    }).catch((error) => {
      pickerReadyPromise = null;
      throw error;
    });
  }

  await pickerReadyPromise;
}

async function getAccessToken(clientId: string) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value;
  }

  const googleWindow = getGoogleWindow();
  const oauth2 = googleWindow.google?.accounts?.oauth2;
  if (!oauth2) {
    throw new GoogleDriveImportError(
      "authorization-failed",
      "Google Drive authorization could not start. Please try again.",
    );
  }

  return new Promise<string>((resolve, reject) => {
    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response) => {
        if (!response.access_token || response.error) {
          reject(
            new GoogleDriveImportError(
              "authorization-failed",
              "Google Drive access was not granted. You can try again or choose a local PDF.",
            ),
          );
          return;
        }

        const expiresInSeconds = Math.max(60, response.expires_in ?? 3_600);
        cachedAccessToken = {
          value: response.access_token,
          expiresAt: Date.now() + expiresInSeconds * 1_000,
        };
        resolve(response.access_token);
      },
      error_callback: () => {
        reject(
          new GoogleDriveImportError(
            "authorization-failed",
            "Google Drive authorization was closed or blocked. Please try again.",
          ),
        );
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });
}

function pickPdf(accessToken: string, config: GoogleDriveConfig) {
  const googleWindow = getGoogleWindow();
  const pickerNamespace = googleWindow.google?.picker;

  if (!pickerNamespace) {
    throw new GoogleDriveImportError(
      "picker-failed",
      "Google Drive picker is unavailable. Please try again.",
    );
  }

  return new Promise<GooglePickerDocument | null>((resolve, reject) => {
    try {
      const view = new pickerNamespace.DocsView();
      view.setMimeTypes(PDF_MIME_TYPE);
      view.setMode(pickerNamespace.DocsViewMode.LIST);

      const picker = new pickerNamespace.PickerBuilder()
        .setDeveloperKey(config.apiKey)
        .setAppId(config.appId)
        .setOAuthToken(accessToken)
        .setOrigin(window.location.origin)
        .addView(view)
        .setCallback((response) => {
          if (response.action === pickerNamespace.Action.CANCEL) {
            resolve(null);
            return;
          }

          if (response.action !== pickerNamespace.Action.PICKED) return;

          const selected = response.docs?.[0];
          if (!selected?.id) {
            reject(
              new GoogleDriveImportError(
                "invalid-selection",
                "Google Drive did not return a usable PDF. Please choose the file again.",
              ),
            );
            return;
          }

          if (selected.mimeType && selected.mimeType !== PDF_MIME_TYPE) {
            reject(
              new GoogleDriveImportError(
                "invalid-selection",
                "Please choose a PDF file from Google Drive.",
              ),
            );
            return;
          }

          resolve(selected);
        })
        .build();

      picker.setVisible(true);
    } catch {
      reject(
        new GoogleDriveImportError(
          "picker-failed",
          "Google Drive picker could not open. Please try again.",
        ),
      );
    }
  });
}

async function downloadPdf(
  selected: GooglePickerDocument,
  accessToken: string,
  signal?: AbortSignal,
) {
  if (!selected.id) {
    throw new GoogleDriveImportError(
      "invalid-selection",
      "Google Drive did not return a usable PDF.",
    );
  }

  const headers = new Headers({
    Authorization: `Bearer ${accessToken}`,
    Accept: PDF_MIME_TYPE,
  });

  if (selected.resourceKey) {
    headers.set(
      "X-Goog-Drive-Resource-Keys",
      `${selected.id}/${selected.resourceKey}`,
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(selected.id)}?alt=media&supportsAllDrives=true`,
      {
        method: "GET",
        headers,
        cache: "no-store",
        signal,
      },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new GoogleDriveImportError(
      "download-failed",
      "PDFBright could not import that Google Drive file. Please try again.",
    );
  }

  if (!response.ok) {
    throw new GoogleDriveImportError(
      "download-failed",
      "PDFBright could not download that Google Drive PDF. Check your access and try again.",
    );
  }

  const blob = await response.blob();
  const contentType = blob.type.split(";", 1)[0].toLowerCase();
  if (contentType && contentType !== PDF_MIME_TYPE) {
    throw new GoogleDriveImportError(
      "invalid-selection",
      "The selected Google Drive item was not returned as a PDF.",
    );
  }

  const rawName = selected.name?.trim() || "google-drive-document.pdf";
  const fileName = rawName.toLowerCase().endsWith(".pdf") ? rawName : `${rawName}.pdf`;
  return new File([blob], fileName, {
    type: PDF_MIME_TYPE,
    lastModified: Date.now(),
  });
}

export async function pickGoogleDrivePdf(options: {
  onStage?: (stage: GoogleDriveImportStage) => void;
  signal?: AbortSignal;
} = {}) {
  const config = getConfig();
  options.onStage?.("authorizing");
  await loadGoogleLibraries();
  const accessToken = await getAccessToken(config.clientId);

  if (options.signal?.aborted) return null;

  options.onStage?.("picking");
  const selected = await pickPdf(accessToken, config);
  if (!selected || options.signal?.aborted) return null;

  options.onStage?.("downloading");
  return downloadPdf(selected, accessToken, options.signal);
}
