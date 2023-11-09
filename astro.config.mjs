import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import { loadEnv } from "vite";
const env = loadEnv(process.env.NODE_ENV, process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind()],
  site: env.PUBLIC_SITE || undefined,
  base: env.PUBLIC_BASE_URL || undefined,
});
