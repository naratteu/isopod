import { mount as mountSvelte, unmount } from 'svelte';
import Counter from './Counter.svelte';

export function mount(element) {
  const component = mountSvelte(Counter, { target: element });
  return () => unmount(component);
}
