import { build } from 'esbuild';
import { compile } from 'svelte/compiler';
import { readFile, mkdir, copyFile } from 'node:fs/promises';

const target = process.argv[2];
const svelte = (generate) => ({
  name: 'svelte',
  setup(builder) {
    builder.onLoad({ filter: /\.svelte$/ }, async ({ path }) => ({
      contents: compile(await readFile(path, 'utf8'), { filename: path, generate }).js.code,
      loader: 'js',
    }));
  },
});
for (const name of target === 'all' ? ['react', 'svelte', 'hono', 'svelte-ssr', 'next'] : [target]) {
  await mkdir(`providers/${name}/public`, { recursive: true });
  if (['react', 'svelte', 'next'].includes(name)) {
    await build({
      entryPoints: [`providers/${name}/client.jsx`],
      outfile: `providers/${name}/public/${name === 'next' ? 'client' : 'remote'}.js`,
      bundle: true, format: 'esm', minify: true, jsx: 'automatic',
      define: { 'process.env.NODE_ENV': '"production"' },
      conditions: ['browser'], plugins: [svelte('client')],
    });
  }
  if (name === 'svelte-ssr') {
    await build({
      entryPoints: ['providers/svelte-ssr/render.js'], outfile: 'providers/svelte-ssr/dist/render.js',
      bundle: true, format: 'esm', platform: 'node', packages: 'external', plugins: [svelte('server')],
    });
  }
  if (['hono', 'svelte-ssr', 'next'].includes(name)) {
    await copyFile('providers/shared/html-island.js', `providers/${name}/public/html-island.js`);
    await copyFile(`providers/${name}/remote.js`, `providers/${name}/public/remote.js`);
  }
}
