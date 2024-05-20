<script lang="ts">
  import type { PageData } from './$types';
  import SvelteTable from 'svelte-table';
  import { matchTableCols } from '$lib/utils';

  export let data: PageData;
</script>

<div>
  {#if !data.matches || data.matches.length === 0}
    <p>Jotain meni pieleen...</p>
  {:else}
    <div class="m-4 py-4 card glass card-bordered card-compact shadow-xl">
      <div class="card-title justify-center text-accent-content">Otteluohjelma</div>
      <div class="card-body">
        <SvelteTable
          columns={matchTableCols}
          rows={data?.matches}
          classNameTable={'table table-xs'}
          classNameThead={'text-accent-content text-sm'}
          classNameTbody={'text-accent-content text-sm'}
        />
      </div>
    </div>
  {/if}
</div>
