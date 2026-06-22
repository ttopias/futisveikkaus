<script lang="ts">
  import type { PageData } from './$types';
  import type { Prediction } from '$lib';
  import { browser } from '$app/environment';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { Button } from '$lib/components/ui/button';
  import { formatMatchTime } from '$lib/utils/format-match-time';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';

  export let data: PageData;

  $: guesses = data?.guesses ?? [];
  $: chartData = data?.chartData;
  $: showCharts = data?.showCharts ?? false;
  $: playerCount = data?.playerCount;

  function matchLabel(row: Prediction): string {
    const h = row.match.home?.name ?? row.match.home_slot ?? '';
    const a = row.match.away?.name ?? row.match.away_slot ?? '';
    return `${h} – ${a}`;
  }

  function predictionLabel(row: Prediction): string {
    return `${row.home_goals} – ${row.away_goals}`;
  }

  function resultLabel(row: Prediction): string {
    return `${row.match.home_goals} – ${row.match.away_goals}`;
  }
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
  <div class="flex items-center gap-3">
    <Button href="/standings" variant="ghost" size="sm" class="gap-2">
      <ArrowLeft class="size-4" aria-hidden="true" />
      Takaisin
    </Button>
    <h1 class="text-xl font-semibold tracking-tight">{data.profileName}</h1>
  </div>

  <Card.Root class="w-full max-w-4xl shadow-sm">
    <Card.Content class="pt-6">
      {#if showCharts && chartData}
        {#if browser}
          {#await import('../StandingsCharts.svelte') then { default: StandingsCharts }}
            <StandingsCharts {chartData} {playerCount} />
          {/await}
        {/if}
      {:else}
        <p class="text-sm text-muted-foreground">Ei pisteitä näytettäväksi</p>
      {/if}
    </Card.Content>
  </Card.Root>

  <Card.Root class="overflow-hidden shadow-sm">
    <ScrollArea.Root orientation="horizontal">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="whitespace-nowrap">Pvm</Table.Head>
            <Table.Head class="whitespace-nowrap">Ottelu</Table.Head>
            <Table.Head class="whitespace-nowrap">Arvaus</Table.Head>
            <Table.Head class="whitespace-nowrap">Tulos</Table.Head>
            <Table.Head class="whitespace-nowrap">Pisteet</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each guesses as row (row.guess_id)}
            <Table.Row>
              <Table.Cell class="min-w-0 whitespace-nowrap align-middle tabular-nums">
                {formatMatchTime(row.match.starts_at, 'DD.MM.YYYY')}
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle">
                <span class="break-words">{matchLabel(row)}</span>
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle tabular-nums">
                {predictionLabel(row)}
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle tabular-nums">
                {resultLabel(row)}
              </Table.Cell>
              <Table.Cell class="min-w-0 align-middle tabular-nums">
                {row.points}
              </Table.Cell>
            </Table.Row>
          {:else}
            <Table.Row>
              <Table.Cell colspan={5} class="text-center text-muted-foreground">
                Ei arvauksia näytettäväksi.
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </ScrollArea.Root>
  </Card.Root>
</div>
