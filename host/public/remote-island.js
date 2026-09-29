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
      const url = new URL(this.dataset.src, location.href);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid module URL');
      const provider = await import(url.href);
      controller.signal.throwIfAborted();
      const cleanup = await provider.mount(root, { signal: controller.signal });
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

document.addEventListener('click', event => {
  const button = event.target.closest('[data-toggle-island]');
  if (!button) return;
  const island = button.closest('.island-card').querySelector('remote-island');
  if (island.dataset.state === 'error') { island.start(); return; }
  island.toggleAttribute('disabled');
  button.textContent = island.hasAttribute('disabled') ? '다시 연결' : '연결 해제';
});
