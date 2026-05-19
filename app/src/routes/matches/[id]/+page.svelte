<script lang="ts">
  import { goto } from '$app/navigation';
  import Time from 'svelte-time';
  import { matchParticipant } from '$lib/match-participants';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import type { Match, Prediction } from '$lib/index';
  import type { PageData } from './$types';

  export let data: PageData;
  let guesses: Prediction[] = data?.guesses ?? [];
  let match: Match | null = data?.match;
  $: canViewGuesses = data?.canViewGuesses ?? false;
</script>

<div
  class="card glass h-full relative carousel carousel-center m-4 p-4 border-inherit shadow-lg rounded-xl"
>
  <button class="absolute top-4 left-4" on:click={() => goto('/matches')}>
    <svg
      class="h-8 w-8 text-gray-500 hover:text-gray-700"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
      ></path>
    </svg>
  </button>

  {#if !match}
    <h1>Ottelua ei löytynyt.</h1>
  {:else if !canViewGuesses}
    <h1>Arvaukset näkyvät ottelun alkaessa.</h1>
  {:else}
    <div class="p-4 text-center">
      <div class="text-lg font-semibold mb-2">
        {#if match?.groupStage}
          Lohko {match.group}
        {:else}
          {match.group}
        {/if}
      </div>

      <div class="text-lg font-semibold mb-2">
        <Time timestamp={match.starts_at} format="DD.MM.YYYY" />
        {' '}klo{' '}
        <Time timestamp={match.starts_at} format="HH:mm" />
      </div>

      <div class="flex gap-12 justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <TeamFlag
            countryCode={matchParticipant(match, 'home').country_code}
            name={matchParticipant(match, 'home').name}
            width={32}
            height={32}
            class="h-8 w-8 rounded-full object-cover"
          />
          <span>{matchParticipant(match, 'home').name}</span>
        </div>

        <div class="flex items-center gap-2">
          <span>{matchParticipant(match, 'away').name}</span>
          <TeamFlag
            countryCode={matchParticipant(match, 'away').country_code}
            name={matchParticipant(match, 'away').name}
            width={32}
            height={32}
            class="h-8 w-8 rounded-full object-cover"
          />
        </div>
      </div>

      <div class="flex justify-center gap-4 text-bold text-lg">
        {#if match?.finished}
          <div>{match.home_goals}</div>
          <div>-</div>
          <div>{match.away_goals}</div>
        {:else}
          {' '}
        {/if}
      </div>
    </div>

    {#if guesses.length === 0}
      <p class="px-4 text-center">Kukaan ei ole vielä arvannut tätä ottelua.</p>
    {:else}
      <table>
        <thead>
          <tr class="text-bold text-left">
            <th>Nimi</th>
            <th class="text-center">Arvaus</th>
            {#if match?.finished}
              <th class="text-center">Pisteet</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each guesses as guess}
            <tr class={`${guess.profile?.first_name === data.myProfile?.first_name ? 'glass' : ''}`}>
              <td>{guess.profile?.first_name}</td>
              <td class="text-center">{guess.home_goals} - {guess.away_goals}</td>
              {#if match?.finished}
                <td class="text-center">{guess.points}</td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>
