<script lang="ts">
  import SvelteTable from 'svelte-table';
  import type { PageData } from './$types';

  export let data: PageData;

  const columns = [
    { key: 'first_name', title: 'NIMI', value: (v: any) => v.first_name },
    { key: 'total_points', title: 'PISTEET', value: (v: any) => v.total_points, sortable: true },
  ];
</script>

<div class="m-4 p-4 items-center text-center pt-8 min-w-96">
  <div class="card glass max-w-xl min-w-64 m-4 p-4 border-inherit shadow-lg rounded-xl">
    <SvelteTable
      {columns}
      rows={data?.standings}
      classNameTable={'table text-left'}
      classNameThead={'text-accent-content text-lg'}
      classNameTbody={'text-accent-content text-md'}
    />
  </div>

  <div>
  </div>
</div>
