<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { User } from '$lib';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { browser } from '$app/environment';
  import { Button } from '$lib/components/ui/button';
  import { sortRows, toggleSortKey, type SortDir } from '$lib/utils/table-sort';
  export let data: PageData;

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
    if (key === 'avg_points') return row.avg_points ?? 0;
    if (key === 'points_6') return row.points_6 ?? 0;
    if (key === 'points_4') return row.points_4 ?? 0;
    if (key === 'points_neg2') return row.points_neg2 ?? 0;
    if (key === 'points_neg4') return row.points_neg4 ?? 0;
    return '';
  }

  function openUser(row: User) {
    if (row.user_id) goto(`/standings/${row.user_id}`);
  }

  $: standings = data?.standings ?? [];
  $: sortedStandings = sortRows(standings, sortKey, sortDir, cellValue);
  $: chartData = data?.chartData;
  $: showCharts = data?.showCharts ?? false;
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
            <Table.Head class="whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-auto gap-1 px-0 font-medium hover:bg-transparent"
                on:click={() => handleSort('avg_points')}
              >
                KESKIARVO
                {#if sortKey === 'avg_points'}
                  <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </Button>
            </Table.Head>
            <Table.Head class="whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-auto gap-1 px-0 font-medium hover:bg-transparent"
                on:click={() => handleSort('points_6')}
              >
                +6
                {#if sortKey === 'points_6'}
                  <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </Button>
            </Table.Head>
            <Table.Head class="whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-auto gap-1 px-0 font-medium hover:bg-transparent"
                on:click={() => handleSort('points_4')}
              >
                +4
                {#if sortKey === 'points_4'}
                  <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </Button>
            </Table.Head>
            <Table.Head class="whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-auto gap-1 px-0 font-medium hover:bg-transparent"
                on:click={() => handleSort('points_neg2')}
              >
                -2
                {#if sortKey === 'points_neg2'}
                  <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </Button>
            </Table.Head>
            <Table.Head class="whitespace-nowrap">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-auto gap-1 px-0 font-medium hover:bg-transparent"
                on:click={() => handleSort('points_neg4')}
              >
                -4
                {#if sortKey === 'points_neg4'}
                  <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                {/if}
              </Button>
            </Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each sortedStandings as row (row.user_id ?? row.id ?? row.first_name)}
            <Table.Row
              class={row.user_id ? 'cursor-pointer' : undefined}
              on:click={() => openUser(row)}
            >
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words">{row.first_name}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words tabular-nums">{row.total_points ?? 0}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words tabular-nums">{(row.avg_points ?? 0).toFixed(2)}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words tabular-nums">{row.points_6 ?? 0}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words tabular-nums">{row.points_4 ?? 0}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words tabular-nums">{row.points_neg2 ?? 0}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words tabular-nums">{row.points_neg4 ?? 0}</span>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </ScrollArea.Root>
  </Card.Root>

  <Card.Root class="w-full max-w-4xl shadow-sm">
    <Card.Content class="pt-6">
      {#if showCharts && chartData}
        {#if browser}
          {#await import('./StandingsCharts.svelte') then { default: StandingsCharts }}
            <StandingsCharts {chartData} />
          {/await}
        {/if}
      {:else}
        <p class="text-sm text-muted-foreground">Ei pisteitä näytettäväksi</p>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
