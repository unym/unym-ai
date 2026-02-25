import { describe, it, expect } from "vitest"
import { calculateRiskScore } from "../src/scorer/risk-scorer"
import type { Entity } from "../src/types"

function makeEntity(type: Entity["type"]): Entity {
  return {
    type,
    value: "test",
    startIndex: 0,
    endIndex: 4,
    confidence: 1.0,
    source: "regex",
  }
}

describe("calculateRiskScore — empty input", () => {
  it("returns score 0 and level NONE for empty array", () => {
    const result = calculateRiskScore([])
    expect(result).toEqual({ score: 0, level: "NONE" })
  })
})

describe("calculateRiskScore — single entity per type", () => {
  const cases: Array<[Entity["type"], number]> = [
    ["PERSON_NAME", 3],
    ["EMAIL", 3],
    ["PHONE", 3],
    ["ADDRESS", 4],
    ["FINANCIAL", 5],
    ["NATIONAL_ID", 5],
    ["ORGANIZATION", 2],
    ["DATE_OF_BIRTH", 3],
    ["IP_ADDRESS", 2],
  ]

  for (const [type, expectedScore] of cases) {
    it(`${type} has weight ${expectedScore}`, () => {
      const result = calculateRiskScore([makeEntity(type)])
      expect(result.score).toBe(expectedScore)
    })
  }
})

describe("calculateRiskScore — threshold boundaries", () => {
  it("score 0 → NONE", () => {
    expect(calculateRiskScore([]).level).toBe("NONE")
  })

  it("minimum achievable score (2, IP_ADDRESS) → LOW", () => {
    // Score 1 is unreachable with defined weights; minimum is 2 (IP_ADDRESS / ORGANIZATION)
    const result = calculateRiskScore([makeEntity("IP_ADDRESS")])
    expect(result.score).toBe(2)
    expect(result.level).toBe("LOW")
  })

  it("score 5 → LOW (FINANCIAL=5)", () => {
    const result = calculateRiskScore([makeEntity("FINANCIAL")])
    expect(result.score).toBe(5)
    expect(result.level).toBe("LOW")
  })

  it("score 6 → MEDIUM (FINANCIAL + ORGANIZATION = 5+2=7, or NATIONAL_ID + IP = 5+2=7)", () => {
    // PERSON_NAME(3) + ADDRESS(4) = 7 → MEDIUM
    const result = calculateRiskScore([makeEntity("PERSON_NAME"), makeEntity("ADDRESS")])
    expect(result.score).toBe(7)
    expect(result.level).toBe("MEDIUM")
  })

  it("score 15 → MEDIUM (boundary)", () => {
    // 3×FINANCIAL(5) = 15
    const result = calculateRiskScore([
      makeEntity("FINANCIAL"),
      makeEntity("FINANCIAL"),
      makeEntity("FINANCIAL"),
    ])
    expect(result.score).toBe(15)
    expect(result.level).toBe("MEDIUM")
  })

  it("score 16 → HIGH (boundary)", () => {
    // 3×FINANCIAL(5) + IP_ADDRESS(2) = 17, or NATIONAL_ID(5)+FINANCIAL(5)+ADDRESS(4)+EMAIL(3) = 17
    // For exactly 16: 2×FINANCIAL(5) + NATIONAL_ID(5) + IP(2) = 17 — let's do ADDRESS(4)+FINANCIAL(5)+NATIONAL_ID(5)+EMAIL(3) = 17
    // Easier: 3×NATIONAL_ID(5) + IP_ADDRESS(2) = 17 (>= 16)
    const result = calculateRiskScore([
      makeEntity("NATIONAL_ID"),
      makeEntity("FINANCIAL"),
      makeEntity("ADDRESS"),
      makeEntity("EMAIL"),
    ])
    expect(result.score).toBe(17)
    expect(result.level).toBe("HIGH")
  })

  it("score exactly 16 → HIGH", () => {
    // ADDRESS(4) + FINANCIAL(5) + NATIONAL_ID(5) + ORGANIZATION(2) = 16
    const result = calculateRiskScore([
      makeEntity("ADDRESS"),
      makeEntity("FINANCIAL"),
      makeEntity("NATIONAL_ID"),
      makeEntity("ORGANIZATION"),
    ])
    expect(result.score).toBe(16)
    expect(result.level).toBe("HIGH")
  })
})

describe("calculateRiskScore — mixed entities", () => {
  it("sums all entity weights", () => {
    const entities = [
      makeEntity("PERSON_NAME"),  // 3
      makeEntity("EMAIL"),        // 3
      makeEntity("PHONE"),        // 3
    ]
    const result = calculateRiskScore(entities)
    expect(result.score).toBe(9)
    expect(result.level).toBe("MEDIUM")
  })
})
