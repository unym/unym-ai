// /**
//  * Re-export onnxruntime-node with proper ESM named exports.
//  * Fixes: cjs-module-lexer can't detect names from `module.exports = require(…)`.
//  */
// import ort from "onnxruntime-node";   // default import → gets module.exports ✓
// export default ort;
// export const { InferenceSession, Tensor, env } = ort;

/**
 * Re-export onnxruntime-node with proper ESM named exports + BigInt fix.
 *
 * Fix 1 (previous): cjs-module-lexer can't detect named exports from
 *         `module.exports = require(…)` pattern → re-export them explicitly.
 *
 * Fix 2 (this):     GLiNER.js passes Number[] for int64 tensors, but
 *         onnxruntime requires BigInt values for BigInt64Array construction
 *         → Proxy the Tensor constructor to auto-convert.
 */
import ort from "onnxruntime-node";

// ---- Fix 2: intercept `new Tensor("int64", numberArray, dims)` ----
const _Tensor = ort.Tensor;

const PatchedTensor = new Proxy(_Tensor, {
  construct(target, [type, data, dims]) {
    if (
      (type === "int64" || type === "uint64") &&
      Array.isArray(data)
    ) {
      data = data.map((v) => (typeof v === "number" ? BigInt(v) : v));
    }
    return new target(type, data, dims);
  },
});

// ---- Exports ----
export default { ...ort, Tensor: PatchedTensor };
export const InferenceSession = ort.InferenceSession;
export const Tensor = PatchedTensor;
export const env = ort.env;