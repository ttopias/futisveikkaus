<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLSelectAttributes } from 'svelte/elements';

  type $$Props = HTMLSelectAttributes;

  let className: $$Props['class'] = undefined;
  export let value: $$Props['value'] = undefined;
  export { className as class };
</script>

<select
  class={cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )}
  bind:value
  {...$$restProps}
  on:change
  on:focus
  on:blur
>
  <slot />
</select>
