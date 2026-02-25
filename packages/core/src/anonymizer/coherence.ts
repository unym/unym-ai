import type { EntityType } from "../types/entities"

/**
 * CoherenceMap ensures identical original values map to the same replacement
 * within a single anonymization session, using case-insensitive normalization
 * for PERSON_NAME entities.
 */
export class CoherenceMap {
  private map = new Map<string, string>()

  private normalize(value: string, type: EntityType): string {
    if (type === "PERSON_NAME") {
      return value.toLowerCase().trim()
    }
    return value.trim()
  }

  /**
   * Returns an existing replacement for `original`, or generates and stores
   * a new one using `generator`.
   */
  getOrCreate(
    original: string,
    type: EntityType,
    generator: () => string
  ): string {
    const key = `${type}:${this.normalize(original, type)}`
    if (this.map.has(key)) return this.map.get(key)!
    const replacement = generator()
    this.map.set(key, replacement)
    return replacement
  }

  /** Returns all mappings as an iterable of [key, replacement] pairs (for testing). */
  entries(): IterableIterator<[string, string]> {
    return this.map.entries()
  }

  size(): number {
    return this.map.size
  }
}
