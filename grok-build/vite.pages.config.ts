import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const spaRoot = fileURLToPath(new URL("./spa", import.meta.url));
const srcDir = fileURLToPath(new URL("./src", import.meta.url));
const publicDir = fileURLToPath(new URL("./public", import.meta.url));
const outDir = fileURLToPath(new URL("./dist-ops", import.meta.url));

export default defineConfig({
  root: spaRoot,
  base: "/GRIDRUNNER/ops/",
  publicDir,
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: { "@": srcDir },
  },
  build: {
    outDir,
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: "bundle",
  },
});
