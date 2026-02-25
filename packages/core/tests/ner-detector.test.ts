import { describe, it, expect, vi, beforeEach } from "vitest"

// Hoist mock refs so they are available inside vi.mock factory
const { mockInference, mockInitialize, MockGliner, mockGetGlinerInstance } = vi.hoisted(() => {
  const mockInference = vi.fn()
  const mockInitialize = vi.fn().mockResolvedValue(undefined)
  const MockGliner = vi.fn().mockImplementation(() => ({
    initialize: mockInitialize,
    inference: mockInference,
  }))
  const mockGetGlinerInstance = vi.fn()
  return { mockInference, mockInitialize, MockGliner, mockGetGlinerInstance }
})

vi.mock("gliner", () => ({ Gliner: MockGliner }))

vi.mock("../src/detector/model-loader", () => ({
  getGlinerInstance: mockGetGlinerInstance,
  isModelLoaded: vi.fn(),
  loadModel: vi.fn(),
  getModelStatus: vi.fn(),
  _resetForTests: vi.fn(),
  NER_MODEL_ID: "onnx-community/gliner_small-v2",
}))

import { detectWithNer } from "../src/detector/ner-detector"

beforeEach(() => {
  vi.clearAllMocks()
  mockInference.mockResolvedValue([[]])
  mockGetGlinerInstance.mockReturnValue({ initialize: mockInitialize, inference: mockInference })
})

describe("detectWithNer — when model not loaded", () => {
  it("throws when getGlinerInstance returns null", async () => {
    mockGetGlinerInstance.mockReturnValue(null)
    await expect(detectWithNer("some text")).rejects.toThrow("NER model not loaded")
  })
})

describe("detectWithNer — entity extraction", () => {
  it("maps person name label to PERSON_NAME entity type", async () => {
    mockInference.mockResolvedValue([
      [{ spanText: "Jean Dupont", start: 0, end: 11, label: "person name", score: 0.92 }],
    ])
    const result = await detectWithNer("Jean Dupont visited Paris.")
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: "PERSON_NAME",
      value: "Jean Dupont",
      startIndex: 0,
      endIndex: 11,
      confidence: 0.92,
      source: "ner",
    })
  })

  it("maps organization label to ORGANIZATION", async () => {
    mockInference.mockResolvedValue([
      [{ spanText: "Anthropic", start: 10, end: 19, label: "organization", score: 0.88 }],
    ])
    const result = await detectWithNer("Worked at Anthropic in 2024.")
    expect(result[0]!.type).toBe("ORGANIZATION")
  })

  it("maps street address label to ADDRESS", async () => {
    mockInference.mockResolvedValue([
      [{ spanText: "10 rue de la Paix", start: 5, end: 23, label: "street address", score: 0.75 }],
    ])
    const result = await detectWithNer("At: 10 rue de la Paix, Paris")
    expect(result[0]!.type).toBe("ADDRESS")
  })

  it("maps date of birth label to DATE_OF_BIRTH", async () => {
    mockInference.mockResolvedValue([
      [{ spanText: "3rd March 1985", start: 4, end: 18, label: "date of birth", score: 0.80 }],
    ])
    const result = await detectWithNer("DOB: 3rd March 1985")
    expect(result[0]!.type).toBe("DATE_OF_BIRTH")
  })

  it("ignores unknown labels", async () => {
    mockInference.mockResolvedValue([
      [{ spanText: "unknown", start: 0, end: 7, label: "unknown-label", score: 0.9 }],
    ])
    const result = await detectWithNer("unknown text")
    expect(result).toHaveLength(0)
  })

  it("returns multiple entities sorted by startIndex", async () => {
    mockInference.mockResolvedValue([
      [
        { spanText: "Marie Curie", start: 12, end: 23, label: "person name", score: 0.95 },
        { spanText: "Institut", start: 0, end: 8, label: "organization", score: 0.82 },
      ],
    ])
    const result = await detectWithNer("Institut de Marie Curie")
    expect(result[0]!.startIndex).toBeLessThan(result[1]!.startIndex)
  })

  it("passes correct labels to gliner.inference", async () => {
    await detectWithNer("some text")
    expect(mockInference).toHaveBeenCalledWith(
      expect.objectContaining({
        entities: ["person name", "organization", "street address", "date of birth"],
        flatNer: true,
      })
    )
  })
})

describe("detectWithNer — chunking", () => {
  it("processes short text as single chunk", async () => {
    await detectWithNer("Short text.")
    expect(mockInference).toHaveBeenCalledTimes(1)
    expect(mockInference).toHaveBeenCalledWith(
      expect.objectContaining({ texts: ["Short text."] })
    )
  })

  it("splits long text into multiple chunks and adjusts offsets", async () => {
    const sentence = "This is a sentence that ends here. "
    const longText = sentence.repeat(40) // ~1400 chars

    let callCount = 0
    mockInference.mockImplementation(async () => {
      callCount++
      if (callCount === 2) {
        return [[{ spanText: "Alice", start: 5, end: 10, label: "person name", score: 0.9 }]]
      }
      return [[]]
    })

    const result = await detectWithNer(longText)
    // Long text must be chunked — verify multiple inference calls were made
    expect(mockInference.mock.calls.length).toBeGreaterThan(1)
    // Chunk 2 emits an entity at local offset 5; global offset must be adjusted
    expect(result).toHaveLength(1)
    expect(result[0]!.startIndex).toBeGreaterThan(5)
  })
})
