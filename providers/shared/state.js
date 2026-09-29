// ponytail: process-local, expiring demo state; use durable storage for persistence/replicas.
const states = globalThis.__isopodStates ??= new Map();
export const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
export function state(id, scope = 'personal') {
  const key = scope === 'global' ? '__global__' : id;
  const now = Date.now();
  for (const [key, value] of states) if (now - value.touched > 30 * 60_000) states.delete(key);
  if (!states.has(key)) {
    if (states.size >= 1000) throw new Error('Demo capacity reached');
    states.set(key, { count: 0, touched: now });
  }
  const value = states.get(key);
  value.touched = now;
  return value;
}
