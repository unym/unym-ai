import type { Entity } from "./entities"
import type { RiskScore } from "./risk"

export interface DetectionResult {
  entities: Entity[]
  riskScore: RiskScore
  tierComplete: 1 | 2
  processingTimeMs: number
}

export interface DetectionOptions {
  sensitivity?: "low" | "medium" | "high"
  skipNer?: boolean
}

export interface ModelStatus {
  loaded: boolean
  downloading: boolean
  progress?: number
  error?: string
}
