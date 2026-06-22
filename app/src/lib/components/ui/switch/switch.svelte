<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  type $$Props = HTMLInputAttributes & {
    checked?: boolean;
  };

  let className: $$Props['class'] = undefined;
  export { className as class };
  export let checked: $$Props['checked'] = undefined;
</script>

<label class={cn('inline-flex cursor-pointer select-none items-center gap-2.5', className)}>
  <input type="checkbox" class="peer sr-only" bind:checked {...$$restProps} />
  <span
    aria-hidden="true"
    class="relative h-6 w-11 shrink-0 rounded-full bg-muted shadow-inner ring-1 ring-inset ring-border transition-colors duration-300 ease-in-out peer-hover:bg-muted/80 peer-checked:bg-primary peer-checked:ring-primary peer-checked:peer-hover:bg-primary/90 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:absolute after:left-0.5 after:top-1/2 after:h-5 after:w-5 after:-translate-y-1/2 after:rounded-full after:bg-background after:shadow-md after:ring-1 after:ring-black/5 after:transition-transform after:duration-300 after:ease-in-out after:content-[''] peer-active:after:w-6 peer-checked:after:translate-x-5 peer-checked:peer-active:after:translate-x-4"
  />
  <slot />
</label>
