<script lang="ts">
  import Time from 'svelte-time';
  export let row: Record<string, unknown>;
  export let field: string;
  export let format: string;
  export let col: Record<string, unknown> | undefined;
</script>

{#if col}
  <div>
    <Time timestamp={String(row[field] ?? '')} {format} />
  </div>
{/if}
