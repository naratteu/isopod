import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { serve } from '@hono/node-server';

const app = new Hono();
app.use('*', cors({ origin: origin => origin || '*' }));
app.get('/health', c => c.text('ok'));
app.use('*', serveStatic({ root: `./providers/${process.env.PROVIDER}/public` }));
serve({ fetch: app.fetch, port: 3000, hostname: '0.0.0.0' });
