import { mountHTML } from './html-island.js';
export const mount = (element, { signal }) => mountHTML(element, {
  origin: new URL(import.meta.url).origin, view: '/island/view', events: '/island/events', signal,
});
