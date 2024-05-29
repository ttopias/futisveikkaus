<script lang="ts">
  import SvelteTable from 'svelte-table';
  import type { PageData } from './$types';
  import UserPointsChart from './UserPointsChart.svelte';

  export let data: PageData;
  let chartData = data?.chartData;
  const columns = [
    { key: 'first_name', title: 'NIMI', value: (v: any) => v.first_name },
    { key: 'total_points', title: 'PISTEET', value: (v: any) => v.total_points, sortable: true },
  ];
</script>

<div class="mx-auto p-4">
  <div class="m-4 p-4 items-center text-center pt-8">
    <div class="card glass max-w-4xl min-w-64 m-4 p-4 border-inherit shadow-lg rounded-xl">
      <SvelteTable
        {columns}
        rows={data?.standings}
        classNameTable={'table text-left w-full'}
        classNameThead={'text-accent-content text-lg'}
        classNameTbody={'text-accent-content text-md'}
      />
    </div>

      <UserPointsChart {chartData} />
  </div>
</div>
