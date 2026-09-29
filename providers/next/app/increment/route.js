import { state, validId } from '../../../shared/state.js';
export async function POST(request) {
  const id = new URL(request.url).searchParams.get('id');
  if (request.headers.get('origin') !== (process.env.HOST_ORIGIN || 'http://localhost:4321')) {
    return new Response('Origin not allowed', { status: 403 });
  }
  if (!validId(id)) return new Response('Invalid island id', { status: 400 });
  const count = ++state(id).count;
  console.info(`counter.increment provider=rsc instance=${id.slice(0, 8)} count=${count}`);
  return new Response(null, { status: 204 });
}
