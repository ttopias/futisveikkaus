<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import type { Match } from '$lib/index';
  import { matchParticipant } from '$lib/match-participants';
  import { visibleStageLabelFi } from '$lib/stages';
  import { cn } from '$lib/utils';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import { formatMatchTime } from '$lib/utils/format-match-time';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  export let data: PageData;

  $: matches = data?.matches ?? [];
  $: stageLabel = data.visibleMatchStage ? visibleStageLabelFi(data.visibleMatchStage) : '';
  $: canOpenMatch = Boolean(data.user);

  function openMatch(match: Match) {
    if (canOpenMatch) {
      goto(`/matches/${match.match_id}`);
    }
  }

  function scoreDisplay(match: Match): string {
    if (!match.finished) return '–';
    return `${match.home_goals}-${match.away_goals}`;
  }

  $: matchCardBtnClass = cn(
    'h-auto w-full flex-col items-stretch rounded-xl border border-border bg-card p-4 text-left shadow-sm',
    canOpenMatch
      ? 'min-h-[44px] active:bg-muted hover:bg-muted/50'
      : 'cursor-default hover:bg-card',
  );

  const matchCardFlagClass = 'size-5 shrink-0 rounded-sm object-cover';
  const scoreClass = 'whitespace-nowrap tabular-nums font-mono font-bold';
  const stageBadgeClass = 'whitespace-nowrap';
  const tableFlagClass = 'h-5 w-7 shrink-0 rounded-sm';
  const tableTeamNameClass = 'min-w-0 break-words text-sm leading-tight text-foreground';
</script>

<div class="mx-auto w-full max-w-4xl">
  {#if matches.length === 0}
    <p class="py-12 text-center text-muted-foreground">Ei otteluita näytettäväksi.</p>
  {:else}
    <Card.Root class="shadow-md">
      <Card.Header class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <Card.Title>Otteluohjelma</Card.Title>
        {#if stageLabel}
          <Badge variant="secondary">{stageLabel}</Badge>
        {/if}
      </Card.Header>
      <Card.Content class="space-y-3 pt-0">
        {#if !canOpenMatch}
          <p class="text-sm text-muted-foreground">
            Kirjaudu sisään nähdäksesi ottelukohtaiset arvaukset.
          </p>
        {/if}

        <ul class="flex flex-col gap-3 md:hidden">
          {#each matches as match (match.match_id)}
            {@const home = matchParticipant(match, 'home')}
            {@const away = matchParticipant(match, 'away')}
            <li>
              <Button
                type="button"
                variant="ghost"
                class={matchCardBtnClass}
                disabled={!canOpenMatch}
                on:click={() => openMatch(match)}
              >
                <div class="mb-2 flex w-full items-center justify-between gap-2">
                  <Badge variant="outline" class={stageBadgeClass}>
                    {#if match.groupStage}
                      Lohko {match.group}
                    {:else}
                      {match.group}
                    {/if}
                  </Badge>
                  <div class="flex min-w-0 items-center gap-2">
                    <span class="text-xs text-muted-foreground">
                      {formatMatchTime(match.starts_at, 'DD.MM.YYYY')}
                      ·
                      {formatMatchTime(match.starts_at, 'HH:mm')}
                    </span>
                    {#if canOpenMatch}
                      <ChevronRight
                        class="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    {/if}
                  </div>
                </div>
                <p
                  class="w-full min-w-0 break-words text-center text-xs leading-snug text-foreground"
                >
                  {#if home}
                    <span class="inline-flex items-center gap-1 align-middle">
                      <TeamFlag
                        countryCode={home.country_code}
                        name={home.name}
                        class={matchCardFlagClass}
                      />
                      {home.name}
                    </span>
                  {/if}
                  <span class="text-muted-foreground" aria-hidden="true"> - </span>
                  {#if away}
                    <span class="inline-flex items-center gap-1 align-middle">
                      {away.name}
                      <TeamFlag
                        countryCode={away.country_code}
                        name={away.name}
                        class={matchCardFlagClass}
                      />
                    </span>
                  {/if}
                </p>
                <div class="mt-1 flex w-full justify-center">
                  <span class={cn(scoreClass, 'text-lg')}>
                    {scoreDisplay(match)}
                  </span>
                </div>
              </Button>
            </li>
          {/each}
        </ul>

        <ScrollArea.Root class="hidden md:block" orientation="horizontal">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>#</Table.Head>
                <Table.Head>Pvm</Table.Head>
                <Table.Head>Klo</Table.Head>
                <Table.Head>Koti</Table.Head>
                <Table.Head class="text-center">Tulos</Table.Head>
                <Table.Head class="text-right">Vieras</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each matches as match (match.match_id)}
                {@const home = matchParticipant(match, 'home')}
                {@const away = matchParticipant(match, 'away')}
                <Table.Row
                  class={cn(canOpenMatch && 'cursor-pointer')}
                  on:click={() => openMatch(match)}
                >
                  <Table.Cell class="whitespace-nowrap">
                    <Badge variant="outline" class={stageBadgeClass}>
                      {#if match.groupStage}
                        Lohko {match.group}
                      {:else}
                        {match.group}
                      {/if}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell class="whitespace-nowrap text-sm">
                    {formatMatchTime(match.starts_at, 'DD-MM-YYYY')}
                  </Table.Cell>
                  <Table.Cell class="whitespace-nowrap text-sm tabular-nums">
                    {formatMatchTime(match.starts_at, 'HH:mm')}
                  </Table.Cell>
                  <Table.Cell>
                    {#if home}
                      <div class="flex min-w-0 items-center gap-2">
                        <TeamFlag
                          countryCode={home.country_code}
                          name={home.name}
                          class={tableFlagClass}
                        />
                        <span class={tableTeamNameClass} title={home.name}>{home.name}</span>
                      </div>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class={cn('text-center font-semibold', scoreClass)}>
                    {scoreDisplay(match)}
                  </Table.Cell>
                  <Table.Cell class="text-right">
                    {#if away}
                      <div class="flex min-w-0 items-center justify-end gap-2">
                        <span class={cn(tableTeamNameClass, 'text-right')} title={away.name}
                          >{away.name}</span
                        >
                        <TeamFlag
                          countryCode={away.country_code}
                          name={away.name}
                          class={tableFlagClass}
                        />
                      </div>
                    {/if}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </ScrollArea.Root>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
