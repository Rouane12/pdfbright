/// <reference lib="webworker" />

type AnalyzeMessage = {
  type: "analyze-pixels";
  requestId: string;
  width: number;
  height: number;
  rgbaBuffer: ArrayBuffer;
};

type PixelResult = {
  nearWhiteRatio: number;
  darkPixelRatio: number;
  edgeDensity: number;
  blankScore: number;
  likelyBlank: boolean;
  estimatedSkewDegrees: number | null;
  skewConfidence: number;
};

type WorkerResponse =
  | {
      type: "analysis-result";
      requestId: string;
      result: PixelResult;
    }
  | {
      type: "analysis-error";
      requestId: string;
      message: string;
    };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function luminance(r: number, g: number, b: number) {
  return (299 * r + 587 * g + 114 * b) / 1000;
}

function estimateSkew(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  likelyBlank: boolean,
) {
  if (likelyBlank || width < 24 || height < 24) {
    return { estimatedSkewDegrees: null, skewConfidence: 0 };
  }

  const sampleStep = width * height > 90_000 ? 3 : 2;
  const points: Array<[number, number]> = [];
  const maxPoints = 45_000;

  for (let y = 0; y < height && points.length < maxPoints; y += sampleStep) {
    for (let x = 0; x < width && points.length < maxPoints; x += sampleStep) {
      const offset = (y * width + x) * 4;
      const alpha = rgba[offset + 3];
      if (alpha < 32) continue;

      const lum = luminance(rgba[offset], rgba[offset + 1], rgba[offset + 2]);
      if (lum < 170) {
        points.push([x, y]);
      }
    }
  }

  if (points.length < 120) {
    return { estimatedSkewDegrees: null, skewConfidence: 0 };
  }

  const candidates = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3];
  const margin = Math.ceil(width * Math.tan((3 * Math.PI) / 180)) + 3;
  const binCount = height + margin * 2 + 6;

  function scoreCandidate(angleDegrees: number) {
    const bins = new Uint32Array(binCount);
    const tangent = Math.tan((angleDegrees * Math.PI) / 180);
    const centerX = width / 2;

    for (const [x, y] of points) {
      const projectedY = Math.round(y + (x - centerX) * tangent) + margin;
      if (projectedY >= 0 && projectedY < binCount) {
        bins[projectedY] += 1;
      }
    }

    let score = 0;
    for (const count of bins) {
      score += count * count;
    }

    return score / points.length;
  }

  const scores = candidates.map((angle) => ({ angle, score: scoreCandidate(angle) }));
  const zeroScore = scores.find(({ angle }) => angle === 0)?.score ?? 0;
  let best = scores[0];

  for (const candidate of scores.slice(1)) {
    if (candidate.score > best.score) best = candidate;
  }

  if (best.angle === 0 || zeroScore <= 0) {
    return { estimatedSkewDegrees: null, skewConfidence: 0 };
  }

  const improvement = (best.score - zeroScore) / zeroScore;
  const skewConfidence = clamp((improvement - 0.025) / 0.2);

  if (Math.abs(best.angle) < 0.75 || skewConfidence < 0.2) {
    return { estimatedSkewDegrees: null, skewConfidence };
  }

  return {
    estimatedSkewDegrees: Number((-best.angle).toFixed(2)),
    skewConfidence,
  };
}

function analyzePixels(rgba: Uint8ClampedArray, width: number, height: number): PixelResult {
  const step = width * height > 120_000 ? 3 : 2;
  let samples = 0;
  let nearWhite = 0;
  let dark = 0;
  let edgeComparisons = 0;
  let strongEdges = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const offset = (y * width + x) * 4;
      const alpha = rgba[offset + 3];
      if (alpha < 32) continue;

      const lum = luminance(rgba[offset], rgba[offset + 1], rgba[offset + 2]);
      samples += 1;
      if (lum >= 245) nearWhite += 1;
      if (lum <= 190) dark += 1;

      if (x + step < width) {
        const rightOffset = (y * width + (x + step)) * 4;
        const rightLum = luminance(
          rgba[rightOffset],
          rgba[rightOffset + 1],
          rgba[rightOffset + 2],
        );
        edgeComparisons += 1;
        if (Math.abs(lum - rightLum) > 30) strongEdges += 1;
      }

      if (y + step < height) {
        const downOffset = ((y + step) * width + x) * 4;
        const downLum = luminance(
          rgba[downOffset],
          rgba[downOffset + 1],
          rgba[downOffset + 2],
        );
        edgeComparisons += 1;
        if (Math.abs(lum - downLum) > 30) strongEdges += 1;
      }
    }
  }

  if (samples === 0) {
    return {
      nearWhiteRatio: 1,
      darkPixelRatio: 0,
      edgeDensity: 0,
      blankScore: 1,
      likelyBlank: true,
      estimatedSkewDegrees: null,
      skewConfidence: 0,
    };
  }

  const nearWhiteRatio = nearWhite / samples;
  const darkPixelRatio = dark / samples;
  const edgeDensity = edgeComparisons > 0 ? strongEdges / edgeComparisons : 0;
  const blankScore = clamp(
    nearWhiteRatio * 0.78 +
      (1 - clamp(darkPixelRatio / 0.02)) * 0.12 +
      (1 - clamp(edgeDensity / 0.025)) * 0.1,
  );
  const likelyBlank =
    nearWhiteRatio >= 0.992 && darkPixelRatio <= 0.0035 && edgeDensity <= 0.0075;

  const skew = estimateSkew(rgba, width, height, likelyBlank);

  return {
    nearWhiteRatio,
    darkPixelRatio,
    edgeDensity,
    blankScore,
    likelyBlank,
    ...skew,
  };
}

ctx.addEventListener("message", (event: MessageEvent<AnalyzeMessage>) => {
  const message = event.data;
  if (message.type !== "analyze-pixels") return;

  try {
    const rgba = new Uint8ClampedArray(message.rgbaBuffer);
    const result = analyzePixels(rgba, message.width, message.height);
    const response: WorkerResponse = {
      type: "analysis-result",
      requestId: message.requestId,
      result,
    };
    ctx.postMessage(response);
  } catch {
    const response: WorkerResponse = {
      type: "analysis-error",
      requestId: message.requestId,
      message: "Pixel analysis failed.",
    };
    ctx.postMessage(response);
  }
});

export {};
