<script lang="ts">
  import { cn } from '$lib/utils';
  import { flagCdnUrl, markFlagLoaded, shouldShowTeamFlag } from '$lib/flags';

  export let countryCode: string | null | undefined;
  export let name: string = '';
  export let width = 24;
  export let height = 16;
  let className = '';
  export { className as class };

  $: src = flagCdnUrl(countryCode);
  $: show = shouldShowTeamFlag(countryCode) && src;
  $: codeKey = countryCode?.trim().toLowerCase() ?? '';

  function onLoad() {
    if (codeKey) markFlagLoaded(codeKey);
  }
</script>

{#if show}
  <img
    class={cn('inline-block shrink-0 object-contain', className)}
    {src}
    alt="{name} flag"
    {width}
    {height}
    loading="lazy"
    decoding="async"
    fetchpriority="low"
    on:load={onLoad}
  />
{/if}
