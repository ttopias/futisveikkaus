<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Match, Prediction } from '$lib/index';
  import type { User } from '@supabase/supabase-js';
  import type { PageData } from './$types';

  export let data: PageData;
  let guesses: Prediction[] = data?.guesses ?? [];
  let match: Match | null = data?.match;
  let user: User = data?.user;
</script>

<div
  class="card glass h-full relative carousel carousel-center m-4 p-4 border-inherit shadow-lg rounded-xl"
>
  <div class="card-content"></div>
  {#if !match || !guesses || guesses.length === 0 || new Date(match.predictable_until) > new Date()}
    <h1>Yritäppä myöhemmin uudelleen...</h1>
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
        {new Date(match.date).toLocaleDateString()} klo {match.time}
      </div>

      <div class="flex gap-12 justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <img
            class="h-8 w-8 rounded-full"
            src={`../flags/${match.home.country_code}.svg`}
            alt="{match.home.name} flag"
          />
          <span>{match.home.name}</span>
        </div>

        <div class="flex items-center gap-2">
          <span>{match.away.name}</span>
          <img
            class="h-8 w-8 rounded-full"
            src={`../flags/${match.away.country_code}.svg`}
            alt="{match.away.name} flag"
          />
        </div>
      </div>

      <div class="flex justify-center gap-4 text-bold text-lg">
        {#if match?.finished}
          <div class="">{match.home_goals}</div>
          <div class="">-</div>
          <div class="">{match.away_goals}</div>
        {:else}
          {' '}
        {/if}
      </div>
    </div>

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
          <tr class={`${guess.user?.first_name === user.user_metadata.first_name ? 'glass' : ''}`}>
            <td>{guess.user?.first_name}</td>
            <td class="text-center">{guess.home_goals} - {guess.away_goals}</td>
            {#if match?.finished}
              <td class="text-center">{guess.points}</td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

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
</div>
