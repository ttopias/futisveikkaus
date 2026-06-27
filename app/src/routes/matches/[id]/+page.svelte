<script lang="ts">
  import { goto } from '$app/navigation';
  import Time from 'svelte-time';
  import { matchParticipant } from '$lib/match-participants';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import type { Match, Prediction } from '$lib/index';
  import type { PageData } from './$types';

  export let data: PageData;
  let guesses: Prediction[] = data?.guesses ?? [];
  let match: Match | null = data?.match;
  $: canViewGuesses = data?.canViewGuesses ?? false;
  $: matchNotYetVisible = data?.matchNotYetVisible ?? false;
</script>

<div class="mx-auto w-full min-w-0 max-w-2xl">
  <Button variant="ghost" size="sm" class="mb-4" type="button" on:click={() => goto('/matches')}>
    ← Takaisin otteluihin
  </Button>

  {#if !match}
    <Card.Root>
      <Card.Content class="py-8 text-center">
        <p>Ottelua ei löytynyt.</p>
      </Card.Content>
    </Card.Root>
  {:else if matchNotYetVisible}
    <Card.Root class="shadow-md">
      <Card.Header class="text-center">
        <Card.Title class="text-lg">
          {#if match?.groupStage}
            Lohko {match.group}
          {:else}
            {match.group}
          {/if}
        </Card.Title>
        <p class="text-sm text-muted-foreground">
          <Time timestamp={match.starts_at} format="DD.MM.YYYY" />
          klo
          <Time timestamp={match.starts_at} format="HH:mm" />
        </p>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div class="flex items-center gap-2">
            <TeamFlag
              countryCode={matchParticipant(match, 'home').country_code}
              name={matchParticipant(match, 'home').name}
              width={32}
              height={32}
              class="h-8 w-8 rounded-full object-cover"
            />
            <span class="font-medium">{matchParticipant(match, 'home').name}</span>
          </div>
          <div class="text-xl font-bold tabular-nums">vs</div>
          <div class="flex items-center gap-2">
            <span class="font-medium">{matchParticipant(match, 'away').name}</span>
            <TeamFlag
              countryCode={matchParticipant(match, 'away').country_code}
              name={matchParticipant(match, 'away').name}
              width={32}
              height={32}
              class="h-8 w-8 rounded-full object-cover"
            />
          </div>
        </div>
        <p class="text-center text-muted-foreground">Ei vielä nähtävissä.</p>
      </Card.Content>
    </Card.Root>
  {:else if !canViewGuesses}
    <Card.Root>
      <Card.Content class="py-8 text-center">
        <p>Arvaukset näkyvät ottelun alkaessa.</p>
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root class="shadow-md">
      <Card.Header class="text-center">
        <Card.Title class="text-lg">
          {#if match?.groupStage}
            Lohko {match.group}
          {:else}
            {match.group}
          {/if}
        </Card.Title>
        <p class="text-sm text-muted-foreground">
          <Time timestamp={match.starts_at} format="DD.MM.YYYY" />
          klo
          <Time timestamp={match.starts_at} format="HH:mm" />
        </p>
      </Card.Header>

      <Card.Content class="space-y-4">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div class="flex items-center gap-2">
            <TeamFlag
              countryCode={matchParticipant(match, 'home').country_code}
              name={matchParticipant(match, 'home').name}
              width={32}
              height={32}
              class="h-8 w-8 rounded-full object-cover"
            />
            <span class="font-medium">{matchParticipant(match, 'home').name}</span>
          </div>

          <div class="text-xl font-bold tabular-nums">
            {#if match?.finished}
              {match.home_goals} – {match.away_goals}
            {:else}
              vs
            {/if}
          </div>

          <div class="flex items-center gap-2">
            <span class="font-medium">{matchParticipant(match, 'away').name}</span>
            <TeamFlag
              countryCode={matchParticipant(match, 'away').country_code}
              name={matchParticipant(match, 'away').name}
              width={32}
              height={32}
              class="h-8 w-8 rounded-full object-cover"
            />
          </div>
        </div>

        {#if guesses.length === 0}
          <p class="text-center text-muted-foreground">
            Kukaan ei ole vielä arvannut tätä ottelua.
          </p>
        {:else}
          <ScrollArea.Root orientation="horizontal">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Nimi</Table.Head>
                  <Table.Head class="text-center">Arvaus</Table.Head>
                  {#if match?.finished}
                    <Table.Head class="text-center">Pisteet</Table.Head>
                  {/if}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each guesses as guess}
                  <Table.Row
                    class={guess.profile?.first_name === data.myProfile?.first_name
                      ? 'bg-primary/10'
                      : ''}
                  >
                    <Table.Cell class="font-medium">{guess.profile?.first_name}</Table.Cell>
                    <Table.Cell class="text-center tabular-nums"
                      >{guess.home_goals} – {guess.away_goals}</Table.Cell
                    >
                    {#if match?.finished}
                      <Table.Cell class="text-center font-semibold">{guess.points}</Table.Cell>
                    {/if}
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>
          </ScrollArea.Root>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
