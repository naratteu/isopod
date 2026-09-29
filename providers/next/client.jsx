'use client';
import { createRoot } from 'react-dom/client';
import { Counter } from '../react/client.jsx';
export default function NextCounter() {
  return <Counter title="Next.js" description="Next 서버가 배포하는 독립 React 클라이언트 번들." />;
}
export function mount(element) {
  const root = createRoot(element);
  root.render(<NextCounter />);
  return () => root.unmount();
}
