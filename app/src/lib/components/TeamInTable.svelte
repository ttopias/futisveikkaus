<script lang="ts">
  import TeamFlag from '$lib/components/TeamFlag.svelte';

  export let row: Record<string, unknown>;
  export let flagLeft: boolean = true;
  export let field: string = '';
  export let col: Record<string, unknown> | undefined;

  let display = row;
  if (field) {
    display = row[field] as Record<string, unknown>;
  }

  $: countryCode = typeof display?.country_code === 'string' ? display.country_code : undefined;
  $: teamName = typeof display?.name === 'string' ? display.name : '';
</script>

{#if col}
  {#if flagLeft}
    <div class="flex items-center gap-4">
      <TeamFlag {countryCode} name={teamName} class="flag h-6 w-9 object-cover" />
      {display.name}
    </div>
  {:else}
    <div class="flex gap-4 items-center justify-end">
      {display.name}
      <TeamFlag {countryCode} name={teamName} class="flag h-6 w-9 object-cover" />
    </div>
  {/if}
{/if}
