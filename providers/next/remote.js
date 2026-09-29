import { mountHTML } from './html-island.js';
export const mount = (element, { signal, scope }) => mountHTML(element, {
  origin: new URL(import.meta.url).origin, view: '/island', events: '/events', signal,
  scope,
});
