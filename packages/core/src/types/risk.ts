export type RiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH"

export interface RiskScore {
  score: number
  level: RiskLevel
}
