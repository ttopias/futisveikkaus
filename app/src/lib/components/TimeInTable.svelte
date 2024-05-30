<script lang="ts">
  import Time from 'svelte-time';
  export let row: any;
  export let field: string;
  export let format: string;
  export let col: any;
</script>

{#if col}
  <div>
    <Time timestamp={row[field]} {format} />
  </div>
{/if}
