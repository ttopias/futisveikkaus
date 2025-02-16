import { writable } from 'svelte/store';

export const isOpen = writable(false);
export const id = writable();
export const logo = writable('/football.png');
