import type { PixelHeuristicResult } from "./types";

type WorkerResultMessage = {
  type: "analysis-result";
  requestId: string;
  result: PixelHeuristicResult;
};

type WorkerErrorMessage = {
  type: "analysis-error";
  requestId: string;
  message: string;
};

type WorkerMessage = WorkerResultMessage | WorkerErrorMessage;

type PendingRequest = {
  resolve: (value: PixelHeuristicResult) => void;
  reject: (reason?: unknown) => void;
};

export class PixelAnalysisWorkerClient {
  private readonly worker: Worker;
  private readonly pending = new Map<string, PendingRequest>();
  private sequence = 0;

  constructor() {
    this.worker = new Worker(new URL("../../workers/pdf-analysis.worker.ts", import.meta.url), {
      type: "module",
      name: "pdfbright-analysis",
    });

    this.worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      const request = this.pending.get(message.requestId);
      if (!request) return;

      this.pending.delete(message.requestId);

      if (message.type === "analysis-result") {
        request.resolve(message.result);
      } else {
        request.reject(new Error(message.message));
      }
    });

    this.worker.addEventListener("error", () => {
      for (const request of this.pending.values()) {
        request.reject(new Error("Analysis worker failed."));
      }
      this.pending.clear();
    });
  }

  analyze(
    imageData: ImageData,
    signal?: AbortSignal,
  ): Promise<PixelHeuristicResult> {
    if (signal?.aborted) {
      return Promise.reject(new DOMException("Analysis cancelled.", "AbortError"));
    }

    const requestId = `pixel-${Date.now()}-${this.sequence++}`;
    const rgbaBuffer = imageData.data.buffer.slice(0) as ArrayBuffer;

    return new Promise((resolve, reject) => {
      const abortHandler = () => {
        this.pending.delete(requestId);
        reject(new DOMException("Analysis cancelled.", "AbortError"));
      };

      if (signal) {
        signal.addEventListener("abort", abortHandler, { once: true });
      }

      this.pending.set(requestId, {
        resolve: (result) => {
          signal?.removeEventListener("abort", abortHandler);
          resolve(result);
        },
        reject: (reason) => {
          signal?.removeEventListener("abort", abortHandler);
          reject(reason);
        },
      });

      this.worker.postMessage(
        {
          type: "analyze-pixels",
          requestId,
          width: imageData.width,
          height: imageData.height,
          rgbaBuffer,
        },
        [rgbaBuffer],
      );
    });
  }

  destroy() {
    this.worker.terminate();
    for (const request of this.pending.values()) {
      request.reject(new DOMException("Analysis worker closed.", "AbortError"));
    }
    this.pending.clear();
  }
}
