import { spawn } from 'node:child_process';
const name = process.env.PROVIDER;
if (name === 'next') {
  const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', 'providers/next', '-p', '3000', '-H', '0.0.0.0'], { stdio: 'inherit' });
  for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('exit', code => process.exit(code ?? 1));
} else if (['hono', 'svelte-ssr'].includes(name)) {
  await import(`../providers/${name}/server.js`);
} else if (['react', 'svelte'].includes(name)) {
  await import('../providers/shared/static-server.mjs');
} else throw new Error(`Unknown provider: ${name}`);
