/**
 * Preload script (--import): registers the resolve hook before anything loads.
 */
import { register } from "node:module";
register("./ort-hooks.mjs", import.meta.url);