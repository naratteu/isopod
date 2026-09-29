import { serveFragments } from '../shared/fragment-server.js';
import { renderCounter } from './dist/render.js';
serveFragments('svelte-ssr', renderCounter);
