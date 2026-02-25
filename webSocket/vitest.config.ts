import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    silent: false, // <--- asegura que console.log no se silencie
    reporters: "verbose",
  },
});