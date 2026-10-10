import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["server/tests/**/*.test.ts"],
    setupFiles: ["./server/tests/isolation.ts"],
    maxWorkers: 1,
  },
});
