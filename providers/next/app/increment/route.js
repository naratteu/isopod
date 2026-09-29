import { state, validId } from '../../../shared/state.js';
export async function POST(request) {
  const id = new URL(request.url).searchParams.get('id');
  const scope = new URL(request.url).searchParams.get('scope');
  if (!validId(id)) return new Response('Invalid island id', { status: 400 });
  const count = ++state(id, scope).count;
  console.info(`counter.increment provider=rsc instance=${id.slice(0, 8)} count=${count}`);
  return new Response(null, { status: 204 });
}
