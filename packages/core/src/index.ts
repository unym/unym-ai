// Public API
export { detect } from "./detector/detector"
export { detectWithRegex } from "./detector/regex-detector"
export { detectWithNer } from "./detector/ner-detector"
export {
  loadModel,
  isModelLoaded,
  getModelStatus,
  getGlinerInstance,
  NER_MODEL_ID,
  _setLoadedInstance,
  _resetForTests,
} from "./detector/model-loader"
export { calculateRiskScore } from "./scorer/risk-scorer"
export { ENTITY_WEIGHTS, RISK_THRESHOLDS } from "./scorer/risk-levels"

// Types
export type { EntityType, Entity } from "./types/entities"
export type { RiskLevel, RiskScore } from "./types/risk"
export type { DetectionResult, DetectionOptions, ModelStatus } from "./types/detection"
export type { MappingEntry, AnonymizationResult, AnonymizationMode } from "./types/mapping"

// Anonymization
export { anonymize, anonymizeText, pseudonymizeText } from "./anonymizer/index"
export type { AnonymizeOptions } from "./anonymizer/index"

// Feature flags
export { flags } from "./feature-flags"
export type { Flags } from "./feature-flags"
