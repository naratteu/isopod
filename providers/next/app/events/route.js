export const dynamic = 'force-dynamic';
export function GET(request) {
  let timer;
  let close;
  const stream = new ReadableStream({
    start(controller) {
      const tick = () => controller.enqueue(new TextEncoder().encode('event: refresh\ndata: refresh\n\n'));
      tick();
      timer = setInterval(tick, 1000);
      close = () => { clearInterval(timer); controller.close(); };
      request.signal.addEventListener('abort', close, { once: true });
    },
    cancel() {
      clearInterval(timer);
      request.signal.removeEventListener('abort', close);
    },
  });
  return new Response(stream, { headers: {
    'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store',
  } });
}
