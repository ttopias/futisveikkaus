<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import type { Match } from '$lib/index';
  import { matchParticipant } from '$lib/match-participants';
  import { cn } from '$lib/utils';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { formatMatchTime } from '$lib/utils/format-match-time';
  import { Switch } from '$lib/components/ui/switch';
  import ChevronRight from 'lucide-svelte/icons/chevron-right';

  export let data: PageData;

  let showUnplayed = true;

  $: matches = data?.matches ?? [];
  $: visibleMatches = showUnplayed
    ? matches.filter((m) => !m.finished)
    : matches.filter((m) => m.finished);
  $: canOpenMatch = Boolean($page.data.user);

  function matchHref(matchId: number): string {
    return canOpenMatch ? `/matches/${matchId}` : '/auth';
  }

  function openMatch(match: Match) {
    goto(matchHref(match.match_id));
  }

  function scoreDisplay(match: Match): string {
    if (!match.finished) return '–';
    return `${match.home_goals}-${match.away_goals}`;
  }

  $: matchCardBtnClass =
    'h-auto w-full flex-col items-stretch rounded-xl border border-border bg-card p-4 text-left shadow-sm min-h-[44px] active:bg-muted hover:bg-muted/50';

  const matchCardFlagClass = 'size-5 shrink-0 rounded-sm object-cover';
  const scoreClass = 'whitespace-nowrap tabular-nums font-mono font-bold';
  const stageBadgeClass = 'whitespace-nowrap';
  const tableClass =
    'table-fixed w-full text-xs md:text-xs lg:text-sm [&_th]:h-auto [&_th]:px-1.5 [&_th]:py-2 lg:[&_th]:h-12 lg:[&_th]:px-4 lg:[&_th]:py-3 [&_td]:px-1.5 [&_td]:py-2 lg:[&_td]:px-4 lg:[&_td]:py-4';
  const tableFlagClass = 'h-4 w-5 shrink-0 rounded-sm lg:h-5 lg:w-7';
  const tableTeamNameClass = 'min-w-0 truncate text-xs leading-tight text-foreground lg:text-sm';
  const groupColClass = 'w-[15%] lg:w-[11%]';
  const dateColClass = 'hidden w-[11%] whitespace-nowrap lg:table-cell';
  const timeColClass = 'hidden w-[8%] whitespace-nowrap tabular-nums lg:table-cell';
  const datetimeColClass = 'w-[17%] whitespace-nowrap tabular-nums lg:hidden';
  const teamColClass = 'w-[29%] lg:w-[27%]';
  const scoreColClass = 'w-[10%]';
</script>

<div class="mx-auto w-full max-w-4xl">
  {#if matches.length === 0}
    <p class="py-12 text-center text-muted-foreground">Ei otteluita näytettäväksi.</p>
  {:else}
    <Card.Root class="shadow-md">
      <Card.Header class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <Card.Title>Otteluohjelma</Card.Title>
      </Card.Header>
      <Card.Content class="min-w-0 space-y-3 pt-0">
        <div class="flex justify-end">
          <Switch bind:checked={showUnplayed}>
            <span class="text-sm">Näytä pelaamattomat</span>
          </Switch>
        </div>

        {#if visibleMatches.length === 0}
          <p class="py-8 text-center text-muted-foreground">Ei otteluita näytettäväksi.</p>
        {:else}
        {#if !canOpenMatch}
          <p class="text-sm text-muted-foreground">
            Kirjaudu sisään nähdäksesi ottelukohtaiset arvaukset.
          </p>
        {/if}

        <ul class="flex flex-col gap-3 md:hidden">
          {#each visibleMatches as match (match.match_id)}
            {@const home = matchParticipant(match, 'home')}
            {@const away = matchParticipant(match, 'away')}
            <li>
              <Button href={matchHref(match.match_id)} variant="ghost" class={matchCardBtnClass}>
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

        <div class="hidden min-w-0 overflow-x-hidden md:block">
          <Table.Root class={tableClass}>
            <Table.Header>
              <Table.Row>
                <Table.Head class={groupColClass}>#</Table.Head>
                <Table.Head class={datetimeColClass}>Aika</Table.Head>
                <Table.Head class={dateColClass}>Pvm</Table.Head>
                <Table.Head class={timeColClass}>Klo</Table.Head>
                <Table.Head class={teamColClass}>Koti</Table.Head>
                <Table.Head class={cn('text-center', scoreColClass)}>Tulos</Table.Head>
                <Table.Head class={cn('text-right', teamColClass)}>Vieras</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each visibleMatches as match (match.match_id)}
                {@const home = matchParticipant(match, 'home')}
                {@const away = matchParticipant(match, 'away')}
                <Table.Row class="cursor-pointer" on:click={() => openMatch(match)}>
                  <Table.Cell class={cn('whitespace-nowrap', groupColClass)}>
                    <Badge variant="outline" class={cn(stageBadgeClass, 'text-[10px] lg:text-xs')}>
                      {#if match.groupStage}
                        Lohko {match.group}
                      {:else}
                        {match.group}
                      {/if}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell class={datetimeColClass}>
                    {formatMatchTime(match.starts_at, 'DD.MM.')}
                    {' '}
                    {formatMatchTime(match.starts_at, 'HH:mm')}
                  </Table.Cell>
                  <Table.Cell class={dateColClass}>
                    {formatMatchTime(match.starts_at, 'DD-MM-YYYY')}
                  </Table.Cell>
                  <Table.Cell class={timeColClass}>
                    {formatMatchTime(match.starts_at, 'HH:mm')}
                  </Table.Cell>
                  <Table.Cell class={teamColClass}>
                    {#if home}
                      <div class="flex min-w-0 items-center gap-1 lg:gap-2">
                        <TeamFlag
                          countryCode={home.country_code}
                          name={home.name}
                          class={tableFlagClass}
                        />
                        <span class={tableTeamNameClass} title={home.name}>{home.name}</span>
                      </div>
                    {/if}
                  </Table.Cell>
                  <Table.Cell class={cn('text-center font-semibold', scoreClass, scoreColClass)}>
                    {scoreDisplay(match)}
                  </Table.Cell>
                  <Table.Cell class={cn('text-right', teamColClass)}>
                    {#if away}
                      <div class="flex min-w-0 items-center justify-end gap-1 lg:gap-2">
                        <span class={cn(tableTeamNameClass, 'flex-1 text-right')} title={away.name}
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
        </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
