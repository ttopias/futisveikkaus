<script lang="ts">
  import type { PageData } from './$types';
  import type { User } from '$lib';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { Button } from '$lib/components/ui/button';
  import { sortRows, toggleSortKey, type SortDir } from '$lib/utils/table-sort';
  export let data: PageData;
  let chartData = data?.chartData;

  let sortKey: string | null = null;
  let sortDir: SortDir = 'asc';

  function handleSort(key: string) {
    const next = toggleSortKey(sortKey, sortDir, key);
    sortKey = next.sortKey;
    sortDir = next.sortDir;
  }

  function cellValue(row: User, key: string): string | number {
    if (key === 'first_name') return row.first_name;
    if (key === 'total_points') return row.total_points ?? 0;
    return '';
  }

  $: standings = data?.standings ?? [];
  $: sortedStandings = sortRows(standings, sortKey, sortDir, cellValue);
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
  <Card.Root class="max-w-4xl overflow-hidden shadow-sm">
    <ScrollArea.Root orientation="horizontal">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="whitespace-nowrap">NIMI</Table.Head>
            <Table.Head class="whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-auto gap-1 px-0 font-medium hover:bg-transparent"
                on:click={() => handleSort('total_points')}
              >
                PISTEET
                {#if sortKey === 'total_points'}
                  <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </Button>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each sortedStandings as row (row.user_id ?? row.id ?? row.first_name)}
            <Table.Row>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words">{row.first_name}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words tabular-nums">{row.total_points ?? 0}</span>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </ScrollArea.Root>
  </Card.Root>

  {#if data?.chartData && data?.chartData.length > 0}
    <Card.Root class="w-full max-w-4xl shadow-sm">
      <Card.Content class="pt-6">
        {#await import('./UserPointsChart.svelte') then { default: UserPointsChart }}
          <UserPointsChart {chartData} />
        {/await}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
