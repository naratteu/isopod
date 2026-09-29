// The host knows only mount(element, { signal }) -> cleanup. No provider protocol lives here.
class RemoteIsland extends HTMLElement {
  static observedAttributes = ['disabled'];
  controller;
  cleanup;

  connectedCallback() { this.start(); }
  disconnectedCallback() { this.stop(); }
  attributeChangedCallback() {
    if (!this.isConnected) return;
    if (this.hasAttribute('disabled')) {
      this.stop();
      this.setStatus('연결 해제됨', 'disconnected');
    } else this.start();
  }
  setStatus(message, state) {
    this.dataset.state = state;
    this.querySelector('[data-status]').textContent = message;
  }
  stop() {
    this.controller?.abort();
    this.controller = undefined;
    const cleanup = this.cleanup;
    this.cleanup = undefined;
    Promise.resolve().then(() => cleanup?.()).catch(console.error);
  }
  async start() {
    if (this.hasAttribute('disabled') || this.controller) return;
    const controller = this.controller = new AbortController();
    // Fresh container prevents an old async mount from writing into a new instance.
    const root = document.createElement('div');
    root.setAttribute('data-root', '');
    this.querySelector('[data-root]').replaceWith(root);
    this.setStatus('공급자에 연결하는 중…', 'loading');
    try {
      const configured = window.isopodProviderUrls?.[this.dataset.provider];
      const raw = configured ? `${configured}/${this.dataset.entry || 'remote.js'}` : this.dataset.src;
      const url = new URL(raw.replace(/([^:]\/)\/+/g, '$1'), location.href);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid module URL');
      const provider = await import(url.href);
      controller.signal.throwIfAborted();
      const scope = window.isopodCounterScope === 'global' ? 'global' : 'personal';
      this.dataset.counterScope = scope;
      this.closest('.island-card')?.querySelector('[data-counter-label]')?.replaceChildren(scope === 'global' ? '전역' : '개인');
      const cleanup = await provider.mount(root, { signal: controller.signal, scope });
      if (controller.signal.aborted) { await cleanup?.(); return; }
      if (typeof cleanup !== 'function') throw new Error('Provider must return a cleanup function');
      this.cleanup = cleanup;
      this.setStatus('', 'connected');
    } catch (error) {
      if (!controller.signal.aborted) {
        this.stop();
        this.setStatus(`연결 실패 · ${error.message}`, 'error');
      }
    }
  }
}
customElements.define('remote-island', RemoteIsland);

const providerUrls = () => window.isopodProviderUrls ||= {};
const ids = ['react', 'svelte', 'rsc', 'svelte-ssr', 'hono', 'next', 'blazor', 'phoenix'];
const fields = [...document.querySelectorAll('[data-provider-url]')];
fields.forEach(field => { field.value = providerUrls()[field.dataset.providerUrl] || ''; });

const commandText = (kind) => {
  if (kind === 'local') return 'git clone https://github.com/naratteu/isopod.git && cd isopod && docker compose up --build -d';
  if (kind === 'cloudflare') return ids.map((id, index) => `cloudflared tunnel --url http://localhost:${[5101,5102,5105,5104,5103,5105,5106,5107][index]} # ${id}`).join('\n');
};
const output = document.querySelector('[data-command-output]');
const status = document.querySelector('[data-config-status]');
const quickstartStatus = document.querySelector('[data-quickstart-status]');
document.querySelector('[data-provider-config]')?.addEventListener('submit', event => {
  event.preventDefault();
  const values = Object.fromEntries(fields.filter(field => field.value.trim()).map(field => [field.dataset.providerUrl, field.value.trim().replace(/\/$/, '')]));
  if (Object.values(values).some(value => !/^https?:\/\/[^\s]+$/i.test(value))) {
    status.textContent = '주소는 http:// 또는 https://로 시작해야 합니다.';
    return;
  }
  localStorage.setItem('isopod.provider-urls', JSON.stringify(values));
  location.reload();
});
const copyCommand = async kind => {
  output.value = commandText(kind);
  await navigator.clipboard.writeText(output.value);
  status.textContent = '명령을 클립보드에 복사했습니다.';
};
document.querySelector('[data-copy-local]')?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(commandText('local'));
  if (quickstartStatus) quickstartStatus.textContent = '복사했습니다.';
});
document.querySelector('[data-copy-cloudflare]')?.addEventListener('click', async () => {
  await copyCommand('cloudflare');
});
document.querySelector('[data-clear-provider]')?.addEventListener('click', () => {
  localStorage.removeItem('isopod.provider-urls');
  location.href = location.pathname;
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-toggle-island]');
  if (!button) return;
  const island = button.closest('.island-card').querySelector('remote-island');
  if (island.dataset.state === 'error') { island.start(); return; }
  island.toggleAttribute('disabled');
  button.textContent = island.hasAttribute('disabled') ? '다시 연결' : '연결 해제';
});
