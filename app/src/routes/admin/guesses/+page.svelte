<script lang="ts">
  import { goto } from '$app/navigation';
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  type GuessFormMessage = { success?: string; error?: string };
  import type { Prediction } from '$lib';
  import AdminNav from '$lib/components/admin/AdminNav.svelte';
  import { Alert } from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select } from '$lib/components/ui/select';
  import { sortRows, toggleSortKey, type SortDir } from '$lib/utils/table-sort';
  import Pencil from 'lucide-svelte/icons/pencil';

  export let data: PageData;
  export let form: GuessFormMessage | undefined;

  let guesses: Prediction[] = data.guesses;
  $: guesses = data.guesses;

  let userFilter = '';
  let matchFilter = '';
  let loading = false;
  let editing: Prediction | null = null;
  let editOpen = false;
  let overrideKickoff = false;

  $: uniqueUsers = [
    ...new Set(guesses.map((g) => g.profile?.first_name ?? '').filter(Boolean)),
  ].sort();
  $: uniqueMatches = [
    ...new Set(
      guesses.map((g) => {
        const h = g.match.home?.name ?? g.match.home_slot ?? '';
        const a = g.match.away?.name ?? g.match.away_slot ?? '';
        return `${h} – ${a}`;
      }),
    ),
  ].sort();

  $: filteredGuesses = guesses.filter((guess) => {
    if (userFilter && guess.profile?.first_name !== userFilter) return false;
    if (matchFilter) {
      const h = guess.match.home?.name ?? guess.match.home_slot ?? '';
      const a = guess.match.away?.name ?? guess.match.away_slot ?? '';
      if (`${h} – ${a}` !== matchFilter) return false;
    }
    return true;
  });

  let sortKey: string | null = null;
  let sortDir: SortDir = 'asc';

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
        return `${row.match.home?.name ?? row.match.home_slot ?? ''} – ${row.match.away?.name ?? row.match.away_slot ?? ''}`;
      case 'prediction':
        return `${row.home_goals} – ${row.away_goals}`;
      case 'result':
        return row.match.finished ? `${row.match.home_goals} – ${row.match.away_goals}` : '—';
      case 'points':
        return row.points;
      case 'points_calculated':
        return row.points_calculated ? '✓' : '—';
      default:
        return '';
    }
  }

  const columns: { key: string; title: string; sortable?: boolean }[] = [
    { key: 'user', title: 'Käyttäjä', sortable: true },
    { key: 'starts_at', title: 'Alkaa', sortable: true },
    { key: 'match', title: 'Ottelu', sortable: true },
    { key: 'prediction', title: 'Arvaus', sortable: true },
    { key: 'result', title: 'Tulos', sortable: true },
    { key: 'points', title: 'Pisteet', sortable: true },
    { key: 'points_calculated', title: 'Laskettu', sortable: true },
  ];

  $: sortedGuesses = sortRows(filteredGuesses, sortKey, sortDir, cellValue);

  async function onStageChange(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    const url = new URL(window.location.href);
    if (value === 'all') url.searchParams.delete('stage');
    else url.searchParams.set('stage', value);
    await goto(url.pathname + url.search, { invalidateAll: true, keepFocus: true });
  }
</script>

<AdminNav />

{#if form?.success}
  <Alert class="mb-4">{form.success}</Alert>
{/if}
{#if form?.error}
  <Alert variant="destructive" class="mb-4">{form.error}</Alert>
{/if}

<div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
  <div class="space-y-2">
    <Label for="stage">Vaihe</Label>
    <Select id="stage" value={data.stageFilter} on:change={onStageChange}>
      {#each data.stageOptions as opt}
        <option value={opt.value}>{opt.label}</option>
      {/each}
    </Select>
  </div>
  <div class="space-y-2">
    <Label for="user">Käyttäjä</Label>
    <Select id="user" bind:value={userFilter}>
      <option value="">Kaikki</option>
      {#each uniqueUsers as user}
        <option value={user}>{user}</option>
      {/each}
    </Select>
  </div>
  <div class="space-y-2">
    <Label for="match">Ottelu</Label>
    <Select id="match" bind:value={matchFilter}>
      <option value="">Kaikki</option>
      {#each uniqueMatches as match}
        <option value={match}>{match}</option>
      {/each}
    </Select>
  </div>
</div>

<p class="mb-3 text-sm text-muted-foreground">
  Näytetään {sortedGuesses.length} / {guesses.length} arvausta
</p>

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
                    <span class="text-xs" aria-hidden="true">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  {/if}
                </Button>
              {:else}
                {col.title}
              {/if}
            </Table.Head>
          {/each}
          <Table.Head class="w-20" />
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
            <Table.Cell>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={row.match.finished}
                on:click={() => {
                  editing = row;
                  overrideKickoff = false;
                  editOpen = true;
                }}
              >
                <Pencil class="size-4" />
              </Button>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </ScrollArea.Root>
</Card.Root>

<Dialog.Root
  bind:open={editOpen}
  onOpenChange={(open) => {
    if (!open) editing = null;
  }}
>
  <Dialog.Content class="max-w-sm gap-4">
    {#if editing}
      <Dialog.Header>
        <Dialog.Title>Muokkaa arvausta</Dialog.Title>
        <Dialog.Description>
          {editing.profile?.first_name} · {cellValue(editing, 'match')}
        </Dialog.Description>
      </Dialog.Header>
      <form
        method="POST"
        action="?/update"
        class="space-y-3"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
            editOpen = false;
            editing = null;
          };
        }}
      >
        <input type="hidden" name="guess_id" value={editing.guess_id} />
        <input type="hidden" name="match_id" value={editing.match.match_id} />
        {#if overrideKickoff}
          <input type="hidden" name="override" value="1" />
        {/if}
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label for="home_goals">Koti</Label>
            <Input
              id="home_goals"
              name="home_goals"
              type="number"
              min="0"
              max="99"
              value={editing.home_goals}
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="away_goals">Vieras</Label>
            <Input
              id="away_goals"
              name="away_goals"
              type="number"
              min="0"
              max="99"
              value={editing.away_goals}
              required
            />
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-input"
            bind:checked={overrideKickoff}
          />
          Ohita aloitusaika (korjaus aloituksen jälkeen)
        </label>
        <Button type="submit" class="w-full" {loading}>Tallenna</Button>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
