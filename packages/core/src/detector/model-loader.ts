import type { ModelStatus } from "../types"

export const NER_MODEL_ID = "onnx-community/gliner_small-v2"
// HuggingFace CDN URL for the ONNX model artifact
const NER_MODEL_PATH = `https://huggingface.co/${NER_MODEL_ID}/resolve/main/onnx/model.onnx`

/** Minimal interface required by ner-detector — avoids importing gliner at module load time */
export interface GlinerInstance {
  inference(opts: {
    texts: string[]
    entities: string[]
    threshold?: number
    flatNer?: boolean
  }): Promise<
    Array<
      Array<{
        spanText: string
        start: number
        end: number
        label: string
        score: number
      }>
    >
  >
}

let glinerInstance: GlinerInstance | null = null
let modelStatus: ModelStatus = { loaded: false, downloading: false }

/**
 * Initialises and caches the GLiNER PII model.
 * Safe to call multiple times; returns immediately if already loaded.
 * Never throws — failures are reflected in getModelStatus().
 */
export async function loadModel(): Promise<void> {
  if (glinerInstance !== null && modelStatus.loaded) return
  if (modelStatus.downloading) return

  modelStatus = { loaded: false, downloading: true }

  try {
    // Dynamic import so the browser gliner bundle is not loaded in Node.js context
    const { Gliner } = await import("gliner")
    const gliner = new Gliner({
      tokenizerPath: NER_MODEL_ID,
      onnxSettings: {
        modelPath: NER_MODEL_PATH,
        executionProvider: "wasm",
      },
      transformersSettings: {
        allowLocalModels: false,
        useBrowserCache: true,
      },
    })

    await gliner.initialize()
    glinerInstance = gliner
    modelStatus = { loaded: true, downloading: false }
  } catch (error) {
    glinerInstance = null
    modelStatus = {
      loaded: false,
      downloading: false,
      error:
        error instanceof Error ? error.message : "Model initialization failed",
    }
  }
}

export function isModelLoaded(): boolean {
  return glinerInstance !== null && modelStatus.loaded
}

export function getGlinerInstance(): GlinerInstance | null {
  return glinerInstance
}

export function getModelStatus(): ModelStatus {
  return { ...modelStatus }
}

/** Reset singleton state — for testing only, not exported in public API */
export function _resetForTests(): void {
  glinerInstance = null
  modelStatus = { loaded: false, downloading: false }
}

/**
 * Inject a pre-initialized Gliner instance (e.g. from gliner/node in scripts).
 * The instance must expose the same inference() API shape as GlinerInstance.
 * Not exported in public API — for scripts/tests only.
 */
export function _setLoadedInstance(instance: GlinerInstance): void {
  glinerInstance = instance
  modelStatus = { loaded: true, downloading: false }
}
