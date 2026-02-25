import type { Entity } from "../types/entities"
import type { AnonymizationMode, AnonymizationResult } from "../types/mapping"
import { anonymizeText } from "./anonymizer"
import { pseudonymizeText } from "./pseudonymizer"

export interface AnonymizeOptions {
  mode?: AnonymizationMode
  seed?: number
}

/**
 * Unified entry point for anonymization and pseudonymization.
 * Default mode is "pseudonymize".
 */
export function anonymize(
  text: string,
  entities: Entity[],
  options: AnonymizeOptions = {}
): AnonymizationResult {
  const mode = options.mode ?? "pseudonymize"

  if (mode === "anonymize") {
    return anonymizeText(text, entities)
  }
  return pseudonymizeText(text, entities, options.seed)
}

export { anonymizeText } from "./anonymizer"
export { pseudonymizeText } from "./pseudonymizer"
export { CoherenceMap } from "./coherence"
export { generateFakeValue, createSeededRng } from "./strategies"
