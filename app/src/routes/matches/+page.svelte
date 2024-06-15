<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import SvelteTable from 'svelte-table';
  import { matchTableCols } from '$lib/utils';

  export let data: PageData;

  let groupFilter = '';
  let matches = data?.matches;

  // let uniqueGroups = new Set(data?.matches?.map((p) => p.group)) || [];

  $: matches = data?.matches?.filter((match) => {
    if (groupFilter) {
      return match.group === groupFilter;
    }
    return true;
  });
</script>

<div class="min-w-fit">
  {#if !data.matches || data.matches.length === 0}
    <p>Jotain meni pieleen...</p>
  {:else}
    <div class="m-4 py-4 card glass card-bordered card-compact shadow-xl">
      <div class="card-title justify-center text-accent-content">Otteluohjelma</div>
      <div class="card-body">
        <SvelteTable
          columns={matchTableCols}
          rows={matches || []}
          classNameTable={'table table-xs'}
          classNameThead={'text-accent-content text-sm'}
          classNameTbody={'text-accent-content text-sm'}
          on:clickRow={(e) => {
            console.log(e.detail);
            goto(`/matches/${e.detail.row.match_id}`);
          }}
        />
      </div>
    </div>
  {/if}
</div>
