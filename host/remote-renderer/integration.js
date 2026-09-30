import { fileURLToPath } from 'node:url';

export default () => ({
  name: 'isopod',
  hooks: {
    'astro:config:setup': ({ addRenderer }) => addRenderer({
      name: 'isopod',
      serverEntrypoint: fileURLToPath(new URL('./server.js', import.meta.url)),
      clientEntrypoint: fileURLToPath(new URL('./client.js', import.meta.url)),
    }),
  },
});
