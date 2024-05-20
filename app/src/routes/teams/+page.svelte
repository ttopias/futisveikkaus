<script lang="ts">
  import type { PageData } from './$types';
  import SvelteTable from 'svelte-table';
  import { teamTableCols } from '$lib/utils';

  export let data: PageData;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 w-full m-4 gap-2 justify-center">
  {#if !data.teams || Object.keys(data.teams).length === 0}
    <p>Jotain meni pieleen..</p>
  {:else}
    {#each Object.keys(data?.teams).sort((a, b) => a.localeCompare(b)) as group}
      <div
        class="m-4 pt-4 card glass card-bordered card-compact border-inherit shadow-lg rounded-xl"
      >
        <div class="card-title justify-center text-accent-content">Lohko {group}</div>
        <div class="card-body">
          <SvelteTable
            columns={teamTableCols}
            rows={data?.teams[group].sort((a, b) => {
              if (b.win * 3 + b.draw !== a.win * 3 + a.draw) {
                return b.win * 3 + b.draw - (a.win * 3 + a.draw);
              } else if (b.gf !== a.gf) {
                return b.gf - a.gf;
              } else {
                return a.ga - b.ga;
              }
            })}
            classNameTable={'table table-xs text-left'}
            classNameThead={'text-accent-content text-sm'}
            classNameTbody={'text-accent-content text-sm'}
          />
        </div>
      </div>
    {/each}
  {/if}
</div>
