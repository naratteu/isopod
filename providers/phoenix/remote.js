import { Socket } from './deps/phoenix/priv/static/phoenix.mjs';
import { LiveSocket } from './deps/phoenix_live_view/priv/static/phoenix_live_view.esm.js';

let socket;
let csrfToken;
let disconnected = Promise.resolve();
export async function mount(element, { signal }) {
  const origin = new URL(import.meta.url).origin;
  const response = await fetch(`${origin}/island`, { credentials: 'include', signal, cache: 'no-store' });
  if (!response.ok) throw new Error(`LiveView ${response.status}`);
  const html = new DOMParser().parseFromString(await response.text(), 'text/html');
  const root = html.querySelector('[data-phx-session]');
  const csrf = html.querySelector('meta[name="csrf-token"]')?.content;
  if (!root || !csrf) throw new Error('Invalid LiveView bootstrap');
  // The host page has no Phoenix document root; mark this island as the one main view
  // so LiveView's join-error and navigation paths never dereference a missing main view.
  root.setAttribute('data-phx-main', '');
  await disconnected;
  signal.throwIfAborted();
  element.append(root);
  // ponytail: one LiveSocket owner per document; scope root discovery before adding multiple Phoenix providers.
  csrfToken = csrf;
  // Reuse the client so remounts do not accumulate its document-level event listeners.
  socket ??= new LiveSocket(`${origin}/live`, Socket, {
    params: () => ({ _csrf_token: csrfToken }),
  });
  // This LiveView is an island, so page-level history scroll restoration must stay disabled.
  socket.maybeScroll = () => {};
  socket.redirect = () => {};
  socket.historyRedirect = () => {};
  socket.historyPatch = () => {};
  // LiveView 1.2 also claims document.body as a dead view. An embedded provider must not own the host.
  // This private hook is covered by the remount test and pinned to the mix.lock version.
  socket.joinDeadView = () => {};
  socket.connect();
  return () => {
    socket.destroyAllViews();
    disconnected = new Promise(resolve => socket.disconnect(resolve));
    return disconnected;
  };
}
