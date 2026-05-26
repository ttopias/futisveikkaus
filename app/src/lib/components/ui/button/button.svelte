<script lang="ts">
  import { cn } from '$lib/utils';
  import { buttonVariants, type Size, type Variant } from './button-variants.js';
  let className: string | undefined | null = undefined;
  export { className as class };
  export let variant: Variant = 'default';
  export let size: Size = 'default';
  export let loading = false;
  export let href: string | undefined = undefined;
  export let type: 'button' | 'submit' | 'reset' = 'button';

  $: disabled = $$restProps.disabled || loading;
  $: classes = cn(buttonVariants({ variant, size, className }));
</script>

{#if href}
  <a
    {href}
    class={classes}
    aria-disabled={disabled ? true : undefined}
    tabindex={disabled ? -1 : undefined}
    {...$$restProps}
    on:click={(event) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
    }}
  >
    {#if loading}
      <span
        class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
    {/if}
    <slot />
  </a>
{:else}
  <button {type} class={classes} {disabled} {...$$restProps} on:click>
    {#if loading}
      <span
        class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
    {/if}
    <slot />
  </button>
{/if}
