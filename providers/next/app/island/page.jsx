import { state, validId } from '../../../shared/state.js';
export const dynamic = 'force-dynamic';

// This is an actual async App Router Server Component, not react-dom/server SSR.
export default async function Counter({ searchParams }) {
  const { id, scope } = await searchParams;
  if (!validId(id)) return <p>Invalid island id</p>;
  return <article>
    <h3>React Server Component</h3><p>Next의 async 서버 컴포넌트가 렌더링한 HTML입니다.</p>
    <output aria-label="카운트">{state(id, scope).count}</output>
    <form method="post" action={`/increment?id=${id}&scope=${scope || ''}`}><button type="submit">+1</button></form>
    <footer>서버 시각 <time>{new Date().toISOString()}</time></footer>
  </article>;
}
