import type { EntityType } from "./entities"

export interface MappingEntry {
  original: string
  replacement: string
  type: EntityType
  positions: { startIndex: number; endIndex: number }[]
}

export interface AnonymizationResult {
  processedText: string
  mappings: MappingEntry[]
}

export type AnonymizationMode = "anonymize" | "pseudonymize"
