import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockIsModelLoaded, mockDetectWithNer } = vi.hoisted(() => ({
  mockIsModelLoaded: vi.fn(),
  mockDetectWithNer: vi.fn(),
}))

vi.mock("gliner", () => ({ Gliner: vi.fn() }))

vi.mock("../src/detector/model-loader", () => ({
  isModelLoaded: mockIsModelLoaded,
  getGlinerInstance: vi.fn(),
  loadModel: vi.fn(),
  getModelStatus: vi.fn(),
  _resetForTests: vi.fn(),
  NER_MODEL_ID: "onnx-community/gliner_small-v2",
}))

vi.mock("../src/detector/ner-detector", () => ({
  detectWithNer: mockDetectWithNer,
}))

import { detect } from "../src/detector/detector"

beforeEach(() => {
  vi.clearAllMocks()
  mockIsModelLoaded.mockReturnValue(false)
  mockDetectWithNer.mockResolvedValue([])
})

describe("detect — regex-only fallback", () => {
  it("returns tierComplete: 1 when NER is not loaded", async () => {
    mockIsModelLoaded.mockReturnValue(false)
    const result = await detect("user@example.com")
    expect(result.tierComplete).toBe(1)
    expect(result.entities.some((e) => e.type === "EMAIL")).toBe(true)
  })

  it("returns tierComplete: 1 when skipNer is true", async () => {
    mockIsModelLoaded.mockReturnValue(true)
    const result = await detect("user@example.com", { skipNer: true })
    expect(result.tierComplete).toBe(1)
    expect(mockDetectWithNer).not.toHaveBeenCalled()
  })

  it("returns tierComplete: 1 when NER throws", async () => {
    mockIsModelLoaded.mockReturnValue(true)
    mockDetectWithNer.mockRejectedValue(new Error("NER crash"))
    const result = await detect("user@example.com")
    expect(result.tierComplete).toBe(1)
    expect(result.entities.some((e) => e.type === "EMAIL")).toBe(true)
  })
})

describe("detect — NER merge", () => {
  it("returns tierComplete: 2 when NER succeeds", async () => {
    mockIsModelLoaded.mockReturnValue(true)
    mockDetectWithNer.mockResolvedValue([
      {
        type: "PERSON_NAME",
        value: "Jean Dupont",
        startIndex: 0,
        endIndex: 11,
        confidence: 0.9,
        source: "ner",
      },
    ])
    const result = await detect("Jean Dupont user@example.com")
    expect(result.tierComplete).toBe(2)
    expect(result.entities.some((e) => e.type === "PERSON_NAME")).toBe(true)
    expect(result.entities.some((e) => e.type === "EMAIL")).toBe(true)
  })

  it("deduplicates overlapping spans — keeps higher confidence", async () => {
    // NER detects same span as email span, but with lower confidence — regex wins
    mockIsModelLoaded.mockReturnValue(true)
    mockDetectWithNer.mockResolvedValue([
      {
        type: "PERSON_NAME",
        value: "user@example.com",
        startIndex: 0,
        endIndex: 16,
        confidence: 0.6,
        source: "ner",
      },
    ])
    const result = await detect("user@example.com")
    const atSpan = result.entities.filter(
      (e) => e.startIndex === 0 && e.endIndex === 16
    )
    expect(atSpan).toHaveLength(1)
    expect(atSpan[0]!.source).toBe("regex") // confidence 1.0 > 0.6
  })
})

describe("detect — sensitivity filtering", () => {
  beforeEach(() => {
    mockIsModelLoaded.mockReturnValue(true)
    mockDetectWithNer.mockResolvedValue([
      {
        type: "PERSON_NAME",
        value: "LowConf",
        startIndex: 20,
        endIndex: 27,
        confidence: 0.55,
        source: "ner",
      },
      {
        type: "ORGANIZATION",
        value: "HighConfCorp",
        startIndex: 30,
        endIndex: 42,
        confidence: 0.95,
        source: "ner",
      },
    ])
  })

  it("medium sensitivity filters out <0.7 confidence NER", async () => {
    const result = await detect("text user@ex.com LowConf HighConfCorp", {
      sensitivity: "medium",
    })
    const nerEntities = result.entities.filter((e) => e.source === "ner")
    expect(nerEntities.every((e) => e.confidence >= 0.7)).toBe(true)
  })

  it("high sensitivity keeps ≥0.5 confidence NER", async () => {
    const result = await detect("text user@ex.com LowConf HighConfCorp", {
      sensitivity: "high",
    })
    const nerEntities = result.entities.filter((e) => e.source === "ner")
    expect(nerEntities.length).toBeGreaterThanOrEqual(1)
  })

  it("low sensitivity keeps only ≥0.9 confidence NER", async () => {
    const result = await detect("text user@ex.com LowConf HighConfCorp", {
      sensitivity: "low",
    })
    const nerEntities = result.entities.filter((e) => e.source === "ner")
    expect(nerEntities.every((e) => e.confidence >= 0.9)).toBe(true)
  })

  it("regex entities (confidence 1.0) always pass all sensitivity levels", async () => {
    const result = await detect("user@example.com LowConf HighConfCorp", {
      sensitivity: "low",
    })
    expect(result.entities.some((e) => e.type === "EMAIL")).toBe(true)
  })
})

describe("detect — result structure", () => {
  it("includes processingTimeMs", async () => {
    const result = await detect("test")
    expect(typeof result.processingTimeMs).toBe("number")
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0)
  })

  it("includes riskScore", async () => {
    const result = await detect("user@example.com")
    expect(result.riskScore).toHaveProperty("score")
    expect(result.riskScore).toHaveProperty("level")
  })
})
