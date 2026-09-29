// This adapter belongs to the providers. The Astro host never interprets their HTML/forms/SSE.
export async function mountHTML(element, { origin, view, events, signal }) {
  const id = crypto.randomUUID();
  const viewURL = new URL(view, origin);
  viewURL.searchParams.set('id', id);
  const eventURL = new URL(events, origin);
  eventURL.searchParams.set('id', id);
  let busy = false;
  let pending = false;
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const content = document.createElement('div');
  element.append(content, status);

  async function refresh() {
    pending = true;
    if (busy || signal.aborted) return;
    busy = true;
    try {
      do {
        pending = false;
        const response = await fetch(viewURL, { signal, cache: 'no-store' });
        if (!response.ok) throw new Error(`HTML ${response.status}`);
        const html = new DOMParser().parseFromString(await response.text(), 'text/html');
        signal.throwIfAborted();
        const article = html.querySelector('article');
        if (!article) throw new Error('Provider returned no article');
        // Only trusted providers are mounted. Reject unexpected executable markup in fragments.
        if (article.querySelector('script,style,link,iframe,object,embed,base') ||
          [article, ...article.querySelectorAll('*')].some(node => [...node.attributes].some(a =>
            /^on/i.test(a.name) || a.name === 'style' || /^\s*javascript:/i.test(a.value)))) {
          throw new Error('Unexpected executable or styled fragment');
        }
        for (const form of article.querySelectorAll('form')) {
          const action = new URL(form.getAttribute('action'), origin);
          if (action.origin !== new URL(origin).origin) throw new Error('Invalid form origin');
          form.action = action.href;
        }
        const focused = content.contains(document.activeElement) && document.activeElement?.tagName === 'BUTTON';
        // ponytail: replace a read-only counter fragment; use DOM morphing before adding editable fields.
        content.replaceChildren(article);
        if (focused) article.querySelector('button')?.focus({ preventScroll: true });
        status.textContent = '';
      } while (pending && !signal.aborted);
    } finally {
      busy = false;
    }
  }

  function report(error) {
    if (!signal.aborted) status.textContent = `연결 확인 중 · ${error.message}`;
  }
  await refresh();
  const stream = new EventSource(eventURL);
  stream.addEventListener('refresh', () => refresh().catch(report));
  stream.onerror = () => { status.textContent = '서버에 다시 연결하는 중…'; };
  signal.addEventListener('abort', () => stream.close(), { once: true });
  element.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const button = form.querySelector('button');
    if (button.disabled) return;
    button.disabled = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST', body: new URLSearchParams(new FormData(form)), signal,
      });
      if (!response.ok) throw new Error(`POST ${response.status}`);
      await refresh();
    } catch (error) {
      report(error);
    } finally {
      button.disabled = false;
    }
  }, { signal });
  return () => stream.close();
}
