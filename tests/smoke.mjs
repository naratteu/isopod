import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const logSince = new Date().toISOString();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
const sockets = [];
page.on('pageerror', error => errors.push(error.message));
page.on('websocket', socket => sockets.push(socket.url()));
const names = ['react', 'svelte', 'rsc', 'svelte-ssr', 'hono', 'next', 'blazor', 'phoenix'];
const globalNames = new Set(['svelte-ssr', 'hono', 'blazor', 'phoenix']);
const base = process.env.HOST_URL || 'http://localhost:4321';
const card = name => page.locator(`[data-provider="${name}"]`);
const counts = Object.fromEntries(names.map(name => [name, 0]));
async function eventually(check, message) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.fail(message);
}
try {
  await page.goto(base);
  assert.equal(await page.locator('astro-island').count(), process.env.HOST_KIND === 'web' ? 0 : 8, 'Expected host implementation');
  for (const name of names) {
    await card(name).locator('output').waitFor({ timeout: 30_000 });
    counts[name] = Number((await card(name).locator('output').textContent()).trim());
    // Phoenix's first HTML is SSR; wait for its socket to join before sending an event.
    if (name === 'phoenix') await card(name).locator('.phx-connected').waitFor();
    await card(name).getByRole('button', { name: '+1', exact: true }).click();
    counts[name] += 1;
    await eventually(async () => (await card(name).locator('output').textContent()).trim() === String(counts[name]), `${name}: increment`);
  }
  const before = await page.locator('remote-island time').allTextContents();
  await eventually(async () => {
    const after = await page.locator('remote-island time').allTextContents();
    return after.length === 8 && after.every((value, index) => value !== before[index]);
  }, 'All eight clocks update without user input');
  assert.equal(await page.locator('iframe').count(), 0);
  assert.equal(await page.locator('remote-island').evaluateAll(elements => elements.some(el => el.shadowRoot)), false);
  const color = () => page.locator('remote-island article button').evaluateAll(buttons => buttons.map(button => getComputedStyle(button).backgroundColor));
  const garden = await color();
  assert.equal(new Set(garden).size, 1, 'One host CSS styles every provider');
  await page.locator('#theme-night').check();
  const night = await color();
  assert.equal(new Set(night).size, 1);
  assert.notEqual(night[0], garden[0], 'Theme actually changes provider styles');
  assert.deepEqual(await page.locator('remote-island output').allTextContents(), names.map(name => String(counts[name])), 'Theme preserves state');
  assert(sockets.some(url => url.includes(':5106/_blazor')), 'Real Blazor SignalR connection');
  assert(sockets.some(url => url.includes(':5107/live/')), 'Real Phoenix LiveSocket connection');

  // A second browser session has independent server state, not a shared demo counter.
  const second = await browser.newPage();
  await second.goto(base);
  await eventually(async () => await second.locator('remote-island output').count() === 8, 'Second session renders');
  const secondCounts = await second.locator('remote-island output').allTextContents();
  for (const [index, name] of names.entries()) {
    assert.equal(secondCounts[index], globalNames.has(name) ? String(counts[name]) : '0', `${name}: scope`);
  }
  await second.close();

  // Each server-side increment must appear in its own container, correlated to an instance.
  for (const [name, service] of [['rsc', 'next'], ['svelte-ssr', 'svelte-ssr'], ['hono', 'hono'], ['blazor', 'blazor'], ['phoenix', 'phoenix']]) {
    await card(name).getByRole('button', { name: '+1', exact: true }).click();
    counts[name] += 1;
    await eventually(async () => (await card(name).locator('output').textContent()).trim() === String(counts[name]), `${name}: second increment`);
    await eventually(() => {
      const logs = execFileSync('docker', ['compose', 'logs', '--no-color', '--since', logSince, service], { encoding: 'utf8' });
      const entries = [...logs.matchAll(new RegExp(`counter\\.increment provider=${name} instance=(\\S+) count=(\\d+)`, 'g'))];
      return entries.some(([, instance, count]) => count === String(counts[name]) && entries.some(([, firstInstance]) => firstInstance === instance));
    }, `${name}: container logs show count=1 and count=2 for the same instance`);
  }

  for (const name of names) {
    await card(name).getByRole('button', { name: '연결 해제', exact: true }).click();
    assert.equal(await card(name).locator('remote-island').getAttribute('data-state'), 'disconnected');
    await card(name).getByRole('button', { name: '다시 연결', exact: true }).click();
    await card(name).locator('output').waitFor();
    if (name === 'phoenix') await card(name).locator('.phx-connected').waitFor();
    await card(name).getByRole('button', { name: '+1', exact: true }).click();
    counts[name] = globalNames.has(name) ? counts[name] + 1 : 1;
    await eventually(async () => (await card(name).locator('output').textContent()).trim() === String(counts[name]), `${name}: remount works`);
  }

  // Disconnect while mount is still pending. Stale mounts must not replace the new instance.
  await card('hono').locator('remote-island').evaluate(el => {
    el.setAttribute('disabled', ''); el.removeAttribute('disabled');
    el.setAttribute('disabled', ''); el.removeAttribute('disabled');
  });
  await eventually(async () => await card('hono').locator('output').count() === 1, 'No duplicate async mounts');

  await page.locator('#theme-garden').check();
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/garden.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No mobile overflow');
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS: 8 components render, increment, tick, share CSS, isolate sessions, and remount; all 5 server counters log their increments.');
} catch (error) {
  console.error(await page.locator('remote-island').evaluateAll(elements => elements.map(el => ({ src: el.dataset.src, state: el.dataset.state, text: el.textContent }))));
  console.error('Browser errors:', errors);
  throw error;
} finally {
  await browser.close();
}
