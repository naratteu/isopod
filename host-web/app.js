(() => {
const providers = [
  ['react', 'React', 'CLIENT', 'local', 5101],
  ['svelte', 'Svelte', 'CLIENT', 'local', 5102],
  ['rsc', 'React Server Component', 'SERVER · NEXT', 'local', 5105],
  ['svelte-ssr', 'Svelte SSR', 'SERVER · HTML', 'global', 5104],
  ['hono', 'Hono', 'SERVER · HTML', 'global', 5103],
  ['next', 'Next.js', 'REMOTE CLIENT', 'local', 5105, 'client.js'],
  ['blazor', 'Blazor Server', 'SERVER · C#', 'global', 5106],
  ['phoenix', 'Phoenix LiveView', 'SERVER · ELIXIR', 'global', 5107],
];

const params = new URLSearchParams(location.search);
const configured = JSON.parse(localStorage.getItem('isopod.provider-urls') || '{}');
for (const [id] of providers) {
  const value = params.get(id);
  if (/^https?:\/\/[^\s]+$/i.test(value || '')) configured[id] = value.replace(/\/$/, '');
}
window.isopodProviderUrls = configured;

const fields = document.querySelector('[data-config-fields]');
const collection = document.querySelector('[data-collection]');
for (const [index, [id, label, kind, scope, port, entry = 'remote.js']] of providers.entries()) {
  const field = document.createElement('label');
  field.innerHTML = `<span></span><input name="${id}" data-provider-url="${id}" placeholder="https://... (${port})">`;
  field.querySelector('span').textContent = label;
  fields.append(field);

  const card = document.createElement('section');
  card.className = `island-card${scope === 'global' ? ' global-card' : ''}`;
  card.dataset.provider = id;
  card.dataset.scope = scope;
  card.setAttribute('aria-label', label);
  card.innerHTML = `<header class="card-label"><span>${String(index + 1).padStart(2, '0')}</span><span>${kind}</span></header><remote-island data-provider="${id}" data-counter-scope="${scope}" data-entry="${entry}" data-src="http://localhost:${port}/${entry}"><p data-status role="status">공급자에 연결하는 중…</p><div data-root></div></remote-island><footer class="card-footer"><span>:${port}</span><span data-counter-label>${scope.toUpperCase()}</span><button type="button" data-toggle-island>연결 해제</button></footer>`;
  collection.append(card);
}
})();
