import { render } from 'svelte/server';
import Counter from './Counter.svelte';
export const renderCounter = async props => (await render(Counter, { props })).body;
