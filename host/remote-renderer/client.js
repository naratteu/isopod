export default element => async (_Component, props) => {
  const island = document.createElement('remote-island');
  island.dataset.provider = props.provider;
  island.dataset.src = props.src;
  island.dataset.entry = props.entry || 'remote.js';
  island.dataset.counterScope = props.scope;
  island.innerHTML = '<p data-status role="status">공급자에 연결하는 중…</p><div data-root></div>';
  element.append(island);
  element.addEventListener('astro:unmount', () => island.remove(), { once: true });
};
