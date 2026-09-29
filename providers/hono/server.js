import { html } from 'hono/html';
import { serveFragments } from '../shared/fragment-server.js';

serveFragments('hono', ({ count, time, action }) => html`
  <article>
    <h3>Hono</h3><p>서버가 만든 HTML. 이벤트와 갱신도 공급자가 처리합니다.</p>
    <output aria-label="카운트">${count}</output>
    <form method="post" action="${action}"><button type="submit">+1</button></form>
    <footer>서버 시각 <time>${time}</time></footer>
  </article>
`);
