import type { PdfCompressionMode } from "./profiles";

export type TargetSizeFeasibilityStatus =
  | "invalid-target"
  | "already-under-target"
  | "achievable-with-known-profile"
  | "below-known-profiles";

export interface TargetSizeCandidate {
  mode: PdfCompressionMode;
  outputBytes: number;
}

export interface TargetSizeFeasibilityResult {
  status: TargetSizeFeasibilityStatus;
  targetBytes: number;
  recommendedMode: PdfCompressionMode | null;
  smallestKnownOutputBytes: number | null;
}

const QUALITY_ORDER: PdfCompressionMode[] = [
  "best-quality",
  "balanced",
  "smaller-file",
];

/**
 * Milestone 6 feasibility prototype for a future "under X MB" feature.
 *
 * It deliberately does not attempt to predict JPEG/PDF output size before
 * encoding. Instead, it evaluates measured candidate outputs and recommends
 * the least aggressive profile that actually satisfies the requested target.
 * A production target-size feature would need iterative encoding/search when
 * none of the known profiles lands below the target.
 */
export function evaluateTargetSizeFeasibility(
  originalBytes: number,
  targetBytes: number,
  candidates: TargetSizeCandidate[],
): TargetSizeFeasibilityResult {
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    return {
      status: "invalid-target",
      targetBytes,
      recommendedMode: null,
      smallestKnownOutputBytes: null,
    };
  }

  if (originalBytes <= targetBytes) {
    return {
      status: "already-under-target",
      targetBytes,
      recommendedMode: null,
      smallestKnownOutputBytes: originalBytes,
    };
  }

  const validCandidates = candidates.filter(
    (candidate) =>
      Number.isFinite(candidate.outputBytes) && candidate.outputBytes > 0,
  );

  const smallestKnownOutputBytes = validCandidates.length > 0
    ? Math.min(...validCandidates.map((candidate) => candidate.outputBytes))
    : null;

  for (const mode of QUALITY_ORDER) {
    const candidate = validCandidates.find((item) => item.mode === mode);
    if (candidate && candidate.outputBytes <= targetBytes) {
      return {
        status: "achievable-with-known-profile",
        targetBytes,
        recommendedMode: mode,
        smallestKnownOutputBytes,
      };
    }
  }

  return {
    status: "below-known-profiles",
    targetBytes,
    recommendedMode: null,
    smallestKnownOutputBytes,
  };
}
