<script>
  let { count, time, action } = $props();
</script>
<article>
  <h3>Svelte SSR</h3><p>Svelte는 서버에서만 실행됩니다. 브라우저에는 HTML만 도착합니다.</p>
  <output aria-label="카운트">{count}</output>
  <form method="post" {action}><button type="submit">+1</button></form>
  <footer>서버 시각 <time>{time}</time></footer>
</article>
