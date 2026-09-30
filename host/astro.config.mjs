import { defineConfig } from 'astro/config';
import remoteRenderer from './remote-renderer/integration.js';

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE || undefined,
  base: process.env.PUBLIC_BASE || undefined,
  integrations: [remoteRenderer()],
});
