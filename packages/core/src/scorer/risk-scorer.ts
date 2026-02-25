import type { Entity, RiskScore } from "../types"
import { ENTITY_WEIGHTS, RISK_THRESHOLDS } from "./risk-levels"

export function calculateRiskScore(entities: Entity[]): RiskScore {
  const score = entities.reduce(
    (sum, e) => sum + (ENTITY_WEIGHTS[e.type] ?? 0),
    0
  )
  const threshold = RISK_THRESHOLDS.find((t) => score >= t.min)!
  return { score, level: threshold.level }
}
