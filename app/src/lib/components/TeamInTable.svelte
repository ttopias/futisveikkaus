<script lang="ts">
  export let row: any;
  export let flagLeft: boolean = true;
  export let field: string = '';
  export let col: any;

  if (field) {
    row = row[field];
  }
</script>

{#if col}
  {#if flagLeft}
    <div class="flex items-center gap-4">
      <img class="flag h-6 w-9" src={`flags/${row.country_code}.svg`} alt="{row.name} flag" />
      {row.name}
    </div>
  {:else}
    <div class="flex gap-4 items-center justify-end">
      {row.name}
      <img class="flag h-6 w-9" src={`flags/${row.country_code}.svg`} alt="{row.name} flag" />
    </div>
  {/if}
{/if}
