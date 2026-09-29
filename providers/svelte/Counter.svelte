<script>
  import { onMount } from 'svelte';
  let count = $state(0);
  let time = $state(new Date().toISOString());
  onMount(() => {
    const timer = setInterval(() => time = new Date().toISOString(), 1000);
    return () => clearInterval(timer);
  });
</script>

<article>
  <h3>Svelte</h3><p>브라우저에서 독립적으로 실행되는 Svelte.</p>
  <output aria-label="카운트">{count}</output>
  <button type="button" onclick={() => count += 1}>+1</button>
  <footer>브라우저 시각 <time>{time}</time></footer>
</article>
