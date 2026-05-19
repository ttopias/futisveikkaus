<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';

  export let href: string;
  export let active = false;
  export let mobile = false;
  let className: string | undefined = undefined;
  export { className as class };
</script>

<a
  {href}
  on:click
  class={cn(
    buttonVariants({ variant: 'ghost' }),
    mobile ? 'min-h-11 w-full justify-start gap-3 px-3 py-2.5' : 'inline-flex gap-2 px-3 py-2',
    active
      ? 'bg-primary/12 font-medium text-primary shadow-sm ring-1 ring-primary/15'
      : mobile
        ? 'text-foreground hover:bg-accent/80'
        : 'text-foreground/80 hover:bg-accent/60 hover:text-foreground',
    className,
  )}
  {...$$restProps}
>
  <slot />
</a>
