/**
 * Node.js module-resolve hook.
 * Redirects every `import … from "onnxruntime-node"` to our shim,
 * EXCEPT when the shim itself imports the real package (avoids loop).
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const shimURL = pathToFileURL(
  join(dirname(fileURLToPath(import.meta.url)), "ort-shim.mjs"),
).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier === "onnxruntime-node" && context.parentURL !== shimURL) {
    return { url: shimURL, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}