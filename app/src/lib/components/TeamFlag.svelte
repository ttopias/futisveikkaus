<script lang="ts">
  import { flagCdnUrl, shouldShowTeamFlag } from '$lib/flags';

  export let countryCode: string | null | undefined;
  export let name: string = '';
  export let width = 36;
  export let height = 24;
  let className = '';
  export { className as class };

  $: src = flagCdnUrl(countryCode);
  $: show = shouldShowTeamFlag(countryCode) && src;
</script>

{#if show}
  <img class={className} {src} alt="{name} flag" {width} {height} loading="lazy" decoding="async" />
{/if}
