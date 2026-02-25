import type { EntityType, RiskLevel } from "../types"

export const ENTITY_WEIGHTS: Record<EntityType, number> = {
  PERSON_NAME: 3,
  EMAIL: 3,
  PHONE: 3,
  ADDRESS: 4,
  FINANCIAL: 5,
  NATIONAL_ID: 5,
  ORGANIZATION: 2,
  DATE_OF_BIRTH: 3,
  IP_ADDRESS: 2,
}

export const RISK_THRESHOLDS: Array<{ min: number; level: RiskLevel }> = [
  { min: 16, level: "HIGH" },
  { min: 6, level: "MEDIUM" },
  { min: 1, level: "LOW" },
  { min: 0, level: "NONE" },
]
