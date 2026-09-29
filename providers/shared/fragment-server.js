import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { serveStatic } from '@hono/node-server/serve-static';
import { serve } from '@hono/node-server';
import { state, validId } from './state.js';

export function serveFragments(provider, render) {
  const app = new Hono();
  app.use('*', cors({ origin: origin => origin || '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));
  app.get('/health', c => c.text('ok'));
  app.use('/island/*', async (c, next) => {
    if (!validId(c.req.query('id'))) return c.text('Invalid island id', 400);
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.get('/island/view', async c => c.html(await render({
    count: state(c.req.query('id')).count,
    time: new Date().toISOString(),
    action: `/island/increment?id=${c.req.query('id')}`,
  })));
  app.post('/island/increment', c => {
    const id = c.req.query('id');
    const count = ++state(id).count;
    console.info(`counter.increment provider=${provider} instance=${id.slice(0, 8)} count=${count}`);
    return c.body(null, 204);
  });
  app.get('/island/events', c => streamSSE(c, async stream => {
    while (!stream.aborted) {
      await stream.writeSSE({ event: 'refresh', data: 'refresh' });
      await stream.sleep(1000);
    }
  }));
  app.use('*', serveStatic({ root: `./providers/${provider}/public` }));
  serve({ fetch: app.fetch, port: 3000, hostname: '0.0.0.0' });
}
