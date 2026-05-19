<script lang="ts">
  import type { PageData } from './$types';
  import type { Prediction } from '$lib';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { Button } from '$lib/components/ui/button';
  import { Select } from '$lib/components/ui/select';
  import { Label } from '$lib/components/ui/label';
  import { sortRows, toggleSortKey, type SortDir } from '$lib/utils/table-sort';

  export let data: PageData;
  let guesses: Prediction[] = data.guesses;
  let userFilter = '';
  let uniqueUsers = new Set(guesses.map((guess) => guess.profile?.first_name ?? ''));

  let sortKey: string | null = null;
  let sortDir: SortDir = 'asc';

  $: filteredGuesses = userFilter
    ? guesses.filter((guess) => guess.profile?.first_name === userFilter)
    : guesses;

  function handleSort(key: string) {
    const next = toggleSortKey(sortKey, sortDir, key);
    sortKey = next.sortKey;
    sortDir = next.sortDir;
  }

  function cellValue(row: Prediction, key: string): string | number {
    switch (key) {
      case 'user':
        return row.profile?.first_name ?? '';
      case 'starts_at':
        return row.match.starts_at;
      case 'match':
        return `${row.match.home?.name ?? ''} - ${row.match.away?.name ?? ''}`;
      case 'prediction':
        return `${row.home_goals} - ${row.away_goals}`;
      case 'result':
        return `${row.match.home_goals} - ${row.match.away_goals}`;
      case 'points':
        return row.points;
      case 'points_calculated':
        return row.points_calculated ? 'X' : '';
      default:
        return '';
    }
  }

  const columns: { key: string; title: string; sortable?: boolean }[] = [
    { key: 'user', title: 'Käyttäjä', sortable: true },
    { key: 'starts_at', title: 'PVM', sortable: true },
    { key: 'match', title: 'Ottelu', sortable: true },
    { key: 'prediction', title: 'Arvaus', sortable: true },
    { key: 'result', title: 'Lopputulos', sortable: true },
    { key: 'points', title: 'Pisteet', sortable: true },
    { key: 'points_calculated', title: 'Calculated', sortable: true },
  ];

  $: sortedGuesses = sortRows(filteredGuesses, sortKey, sortDir, cellValue);
</script>

<div class="mx-auto w-full min-w-0 lg:max-w-6xl">
  <div class="mb-4 flex flex-col gap-2 sm:max-w-xs">
    <Label for="user">Käyttäjä</Label>
    <Select id="user" bind:value={userFilter}>
      <option value="">Kaikki</option>
      {#each uniqueUsers as user}
        <option value={user}>{user}</option>
      {/each}
    </Select>
  </div>

  <Card.Root class="overflow-hidden shadow-sm">
    <ScrollArea.Root orientation="horizontal">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            {#each columns as col}
              <Table.Head class="whitespace-nowrap">
                {#if col.sortable}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="h-auto gap-1 px-0 font-medium hover:bg-transparent"
                    on:click={() => handleSort(col.key)}
                  >
                    {col.title}
                    {#if sortKey === col.key}
                      <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span
                      >
                    {/if}
                  </Button>
                {:else}
                  {col.title}
                {/if}
              </Table.Head>
            {/each}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each sortedGuesses as row (row.guess_id)}
            <Table.Row>
              {#each columns as col}
                <Table.Cell class="min-w-0 align-middle">
                  <span class="break-words">{cellValue(row, col.key)}</span>
                </Table.Cell>
              {/each}
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </ScrollArea.Root>
  </Card.Root>
</div>
