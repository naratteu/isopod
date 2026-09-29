import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE || undefined,
  base: process.env.PUBLIC_BASE || undefined,
});
