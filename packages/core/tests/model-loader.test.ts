import { describe, it, expect, vi, beforeEach } from "vitest"

// vi.hoisted ensures these are available when vi.mock factory runs (which is hoisted)
const { mockInitialize, MockGliner } = vi.hoisted(() => {
  const mockInitialize = vi.fn().mockResolvedValue(undefined)
  const MockGliner = vi.fn().mockImplementation(() => ({ initialize: mockInitialize }))
  return { mockInitialize, MockGliner }
})

vi.mock("gliner", () => ({ Gliner: MockGliner }))

import {
  loadModel,
  isModelLoaded,
  getGlinerInstance,
  getModelStatus,
  _resetForTests,
} from "../src/detector/model-loader"

beforeEach(() => {
  _resetForTests()
  vi.clearAllMocks()
  MockGliner.mockImplementation(() => ({ initialize: mockInitialize }))
  mockInitialize.mockResolvedValue(undefined)
})

describe("loadModel", () => {
  it("sets status to loaded after successful init", async () => {
    await loadModel()
    expect(isModelLoaded()).toBe(true)
    expect(getModelStatus()).toMatchObject({ loaded: true, downloading: false })
  })

  it("exposes a Gliner instance after loading", async () => {
    await loadModel()
    expect(getGlinerInstance()).not.toBeNull()
  })

  it("is idempotent — second call is a no-op", async () => {
    await loadModel()
    await loadModel()
    expect(MockGliner).toHaveBeenCalledTimes(1)
  })

  it("constructs Gliner with correct config", async () => {
    await loadModel()
    expect(MockGliner).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenizerPath: "onnx-community/gliner_small-v2",
        onnxSettings: expect.objectContaining({ executionProvider: "wasm" }),
        transformersSettings: expect.objectContaining({ useBrowserCache: true }),
      })
    )
  })

  it("sets error status on initialize failure — does not throw", async () => {
    mockInitialize.mockRejectedValueOnce(new Error("Network error"))
    await expect(loadModel()).resolves.toBeUndefined()
    expect(isModelLoaded()).toBe(false)
    expect(getModelStatus()).toMatchObject({
      loaded: false,
      downloading: false,
      error: "Network error",
    })
  })

  it("getGlinerInstance returns null after failed load", async () => {
    mockInitialize.mockRejectedValueOnce(new Error("fail"))
    await loadModel()
    expect(getGlinerInstance()).toBeNull()
  })
})

describe("getModelStatus", () => {
  it("returns a copy — mutations do not affect internal state", async () => {
    await loadModel()
    const status = getModelStatus()
    status.loaded = false
    expect(getModelStatus().loaded).toBe(true)
  })
})
