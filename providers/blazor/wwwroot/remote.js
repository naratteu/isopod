const origin = new URL(import.meta.url).origin;
let started;
function start() {
  return started ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${origin}/_framework/blazor.server.js`;
    script.setAttribute('autostart', 'false');
    script.onerror = () => { started = undefined; script.remove(); reject(new Error('Blazor script unavailable')); };
    script.onload = () => window.Blazor.start({
      // This provider has no JS initializers; prevent the runtime fetching them from the host origin.
      initializers: { beforeStart: [], afterStarted: [] },
      configureSignalR: builder => builder.withUrl(`${origin}/_blazor`, { withCredentials: false }),
      reconnectionHandler: {
        onConnectionDown: () => document.querySelectorAll('[data-blazor-status]').forEach(el => el.textContent = '서버 연결 끊김 · 다시 연결해 주세요'),
        onConnectionUp: () => document.querySelectorAll('[data-blazor-status]').forEach(el => el.textContent = ''),
      },
    }).then(resolve, reject);
    document.head.append(script);
  });
}
export async function mount(element, { signal }) {
  await start();
  signal.throwIfAborted();
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.setAttribute('data-blazor-status', '');
  const target = document.createElement('div');
  element.append(target, status);
  const component = await window.Blazor.rootComponents.add(target, 'counter', {});
  // Blazor keeps one shared circuit for this provider; dispose each root on unmount.
  return () => component.dispose();
}
