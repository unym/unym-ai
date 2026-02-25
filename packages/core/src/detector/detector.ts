import type { DetectionResult, DetectionOptions, Entity } from "../types"
import { detectWithRegex } from "./regex-detector"
import { detectWithNer } from "./ner-detector"
import { isModelLoaded } from "./model-loader"
import { calculateRiskScore } from "../scorer/risk-scorer"

// ---------------------------------------------------------------------------
// Confidence thresholds by sensitivity
// ---------------------------------------------------------------------------

const SENSITIVITY_THRESHOLDS: Record<
  NonNullable<DetectionOptions["sensitivity"]>,
  number
> = {
  low: 0.9,
  medium: 0.7,
  high: 0.5,
}

// ---------------------------------------------------------------------------
// Overlap deduplication
// ---------------------------------------------------------------------------

/**
 * Merges regex and NER entities, deduplicating overlapping spans.
 * For overlapping regions: keeps the entity with the higher confidence.
 * When confidence is equal, prefers regex (deterministic).
 *
 * Combined is sorted by startIndex; since result is non-overlapping and also
 * sorted, a new candidate can only ever overlap with the LAST entity in result
 * — giving O(n log n) total (dominated by the sort).
 */
function mergeEntities(
  regexEntities: Entity[],
  nerEntities: Entity[]
): Entity[] {
  const combined = [...regexEntities, ...nerEntities]
  combined.sort((a, b) => a.startIndex - b.startIndex)

  const result: Entity[] = []
  for (const candidate of combined) {
    const last = result[result.length - 1]
    const overlaps =
      last !== undefined &&
      candidate.startIndex < last.endIndex &&
      candidate.endIndex > last.startIndex

    if (!overlaps) {
      result.push(candidate)
    } else if (candidate.confidence > last.confidence) {
      // Replace last with higher-confidence entity
      result[result.length - 1] = candidate
    }
    // Otherwise keep existing (equal or higher confidence)
  }

  return result
}

// ---------------------------------------------------------------------------
// Sensitivity filter
// ---------------------------------------------------------------------------

function filterBySensitivity(
  entities: Entity[],
  sensitivity: NonNullable<DetectionOptions["sensitivity"]>
): Entity[] {
  const threshold = SENSITIVITY_THRESHOLDS[sensitivity]
  // Regex entities always have confidence = 1.0, never filtered out
  return entities.filter((e) => e.confidence >= threshold)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detects PII in text using a two-tier approach:
 * - Tier 1: regex (synchronous, instant, structured PII)
 * - Tier 2: GLiNER NER (async, contextual PII)
 *
 * If NER is unavailable, returns regex-only results with tierComplete: 1.
 */
export async function detect(
  text: string,
  options?: DetectionOptions
): Promise<DetectionResult> {
  const startTime = performance.now()
  const sensitivity = options?.sensitivity ?? "medium"

  const regexEntities = detectWithRegex(text)

  let allEntities = regexEntities
  let tierComplete: 1 | 2 = 1

  if (!options?.skipNer && isModelLoaded()) {
    try {
      const nerEntities = await detectWithNer(text)
      allEntities = mergeEntities(regexEntities, nerEntities)
      tierComplete = 2
    } catch {
      // NER failure → regex-only fallback, tierComplete stays 1
    }
  }

  const filtered = filterBySensitivity(allEntities, sensitivity)
  const riskScore = calculateRiskScore(filtered)

  return {
    entities: filtered,
    riskScore,
    tierComplete,
    processingTimeMs: performance.now() - startTime,
  }
}
