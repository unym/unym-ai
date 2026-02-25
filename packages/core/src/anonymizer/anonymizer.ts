import type { Entity, EntityType } from "../types/entities"
import type { AnonymizationResult, MappingEntry } from "../types/mapping"
import { CoherenceMap } from "./coherence"

/**
 * Applies placeholder-based anonymization.
 * Each entity is replaced with a typed placeholder: [TYPE_N].
 * Numbering is sequential per type; identical originals get the same number.
 * Replacements are applied right-to-left to preserve index integrity.
 */
export function anonymizeText(
  text: string,
  entities: Entity[]
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

  const coherence = new CoherenceMap()
  // Per-type counter for placeholder numbering
  const typeCounters = new Map<EntityType, number>()
  // Per-type set of known originals for counter allocation
  const typeOriginals = new Map<EntityType, Map<string, number>>()

  // Build placeholder for a given original value and type
  function getPlaceholder(original: string, type: EntityType): string {
    return coherence.getOrCreate(original, type, () => {
      if (!typeOriginals.has(type)) {
        typeOriginals.set(type, new Map())
        typeCounters.set(type, 0)
      }
      const originals = typeOriginals.get(type)!
      const normalizedKey = type === "PERSON_NAME" ? original.toLowerCase().trim() : original.trim()
      if (!originals.has(normalizedKey)) {
        const n = (typeCounters.get(type) ?? 0) + 1
        typeCounters.set(type, n)
        originals.set(normalizedKey, n)
      }
      const n = originals.get(normalizedKey)!
      return `[${type === "PERSON_NAME" ? "NAME" : type}_${n}]`
    })
  }

  // Collect replacement instructions
  const replacements: {
    startIndex: number
    endIndex: number
    replacement: string
    entity: Entity
  }[] = nonOverlapping.map((entity) => ({
    startIndex: entity.startIndex,
    endIndex: entity.endIndex,
    replacement: getPlaceholder(entity.value, entity.type),
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
