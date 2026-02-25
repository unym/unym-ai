import type { Entity } from "../types/entities"
import type { AnonymizationResult, MappingEntry } from "../types/mapping"
import { CoherenceMap } from "./coherence"
import { createSeededRng, generateFakeValue } from "./strategies"

/**
 * Applies pseudonymization: replaces each entity with a realistic fake value
 * of the same type. Identical originals within the same session receive the
 * same fake value (coherence). Replacements are applied right-to-left.
 */
export function pseudonymizeText(
  text: string,
  entities: Entity[],
  seed = Math.floor(Math.random() * 0xffffffff)
): AnonymizationResult {
  if (entities.length === 0) {
    return { processedText: text, mappings: [] }
  }

  // Guard against overlapping entities: sort by startIndex, drop overlapping spans
  const sortedEntities = [...entities].sort((a, b) => a.startIndex - b.startIndex)
  const nonOverlapping: Entity[] = []
  let lastEnd = -1
  for (const entity of sortedEntities) {
    if (entity.startIndex >= lastEnd) {
      nonOverlapping.push(entity)
      lastEnd = entity.endIndex
    }
  }

  const rng = createSeededRng(seed)
  const coherence = new CoherenceMap()

  // Build collision set: entity values + all word tokens from the original text
  const realValues = new Set<string>(nonOverlapping.map((e) => e.value))
  text.split(/\s+/).filter(Boolean).forEach((token) => realValues.add(token))

  // Collect replacement instructions
  const replacements: {
    startIndex: number
    endIndex: number
    replacement: string
    entity: Entity
  }[] = nonOverlapping.map((entity) => ({
    startIndex: entity.startIndex,
    endIndex: entity.endIndex,
    replacement: coherence.getOrCreate(entity.value, entity.type, () =>
      generateFakeValue(entity.type, rng, realValues)
    ),
    entity,
  }))

  // Apply right-to-left
  const sorted = [...replacements].sort((a, b) => b.startIndex - a.startIndex)
  let result = text
  for (const { startIndex, endIndex, replacement } of sorted) {
    result = result.slice(0, startIndex) + replacement + result.slice(endIndex)
  }

  // Build MappingEntry list, merging positions for identical originals.
  // Use type-aware normalization (mirrors CoherenceMap) to avoid key mismatches.
  const mappingMap = new Map<string, MappingEntry>()
  for (const { startIndex, endIndex, replacement, entity } of replacements) {
    const normalizedValue =
      entity.type === "PERSON_NAME"
        ? entity.value.toLowerCase().trim()
        : entity.value.trim()
    const key = `${entity.type}:${normalizedValue}`
    if (!mappingMap.has(key)) {
      mappingMap.set(key, {
        original: entity.value,
        replacement,
        type: entity.type,
        positions: [],
      })
    }
    mappingMap.get(key)!.positions.push({ startIndex, endIndex })
  }

  return {
    processedText: result,
    mappings: Array.from(mappingMap.values()),
  }
}
