// ponytail: process-local, expiring demo state; use durable storage for persistence/replicas.
const states = globalThis.__isopodStates ??= new Map();
export const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
export function state(id) {
  const now = Date.now();
  for (const [key, value] of states) if (now - value.touched > 30 * 60_000) states.delete(key);
  if (!states.has(id)) {
    if (states.size >= 1000) throw new Error('Demo capacity reached');
    states.set(id, { count: 0, touched: now });
  }
  const value = states.get(id);
  value.touched = now;
  return value;
}
