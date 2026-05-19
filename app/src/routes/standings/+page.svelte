<script lang="ts">
  import SvelteTable from 'svelte-table';
  import type { PageData } from './$types';
  import type { User } from '$lib';
  import UserPointsChart from './UserPointsChart.svelte';

  export let data: PageData;
  let chartData = data?.chartData;
  const columns = [
    { key: 'first_name', title: 'NIMI', value: (v: User) => v.first_name },
    {
      key: 'total_points',
      title: 'PISTEET',
      value: (v: User) => v.total_points ?? 0,
      sortable: true,
    },
  ];
</script>

<div class="w-full flex flex-col items-center justify-center">
  <div class="glass max-w-4xl w-full border-inherit shadow-lg rounded-xl m-4 py-4">
    <SvelteTable
      {columns}
      rows={data?.standings}
      classNameTable={'table text-left w-full'}
      classNameThead={'text-accent-content text-lg'}
      classNameTbody={'text-accent-content text-md'}
    />
  </div>

  {#if data?.chartData && data?.chartData.length > 0}
    <div class="glass max-w-4xl w-full border-inherit shadow-lg rounded-xl m-4 py-4">
      <UserPointsChart {chartData} />
    </div>
  {/if}
</div>
