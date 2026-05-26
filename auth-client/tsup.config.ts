import { defineConfig } from "tsup";

// Builds four artifacts into dist/:
//   index.mjs        ESM      (import { RumpusClient } from '@rumpusroom/auth-client')
//   index.cjs        CommonJS (require)
//   index.global.js  IIFE     (window.RumpusRoom = { RumpusClient })
//   index.d.ts       types
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs", "iife"],
  globalName: "RumpusRoom",
  target: "es2020",
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  outExtension({ format }) {
    if (format === "esm") return { js: ".mjs" };
    if (format === "cjs") return { js: ".cjs" };
    return { js: ".global.js" }; // iife → index.global.js
  },
});
