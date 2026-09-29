import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

export function Counter({ title = 'React', description = '브라우저에서 독립적으로 실행되는 React.' }) {
  const [count, setCount] = useState(0);
  const [time, setTime] = useState(new Date().toISOString());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <article>
    <h3>{title}</h3><p>{description}</p>
    <output aria-label="카운트">{count}</output>
    <button type="button" onClick={() => setCount(count => count + 1)}>+1</button>
    <footer>브라우저 시각 <time>{time}</time></footer>
  </article>;
}

export function mount(element) {
  const root = createRoot(element);
  root.render(<Counter />);
  return () => root.unmount();
}
