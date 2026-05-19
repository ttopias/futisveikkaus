<script lang="ts">
  import type { PageData } from './$types';
  import type { Prediction } from '$lib';
  import SvelteTable from 'svelte-table';
  export let data: PageData;
  let guesses: Prediction[] = data.guesses;

  let userFilter = '';
  let uniqueUsers = new Set(guesses.map((guess) => guess.profile?.first_name ?? ''));

  $: filteredGuesses = userFilter
    ? guesses.filter((guess) => guess.profile?.first_name === userFilter)
    : guesses;

  let columns = [
    {
      key: 'user',
      title: 'Käyttäjä',
      value: (r: Prediction) => r.profile?.first_name ?? '',
      sortable: true,
    },
    {
      key: 'starts_at',
      title: 'PVM',
      value: (r: Prediction) => r.match.starts_at,
      sortable: true,
    },
    {
      key: 'match',
      title: 'Ottelu',
      value: (r: Prediction) => `${r.match.home?.name ?? ''} - ${r.match.away?.name ?? ''}`,
      sortable: true,
    },
    {
      key: 'prediction',
      title: 'Arvaus',
      value: (r: Prediction) => `${r.home_goals} - ${r.away_goals}`,
      sortable: true,
    },
    {
      key: 'result',
      title: 'Lopputulos',
      value: (r: Prediction) => `${r.match.home_goals} - ${r.match.away_goals}`,
      sortable: true,
    },
    {
      key: 'points',
      title: 'Pisteet',
      value: (r: Prediction) => r.points,
      sortable: true,
    },
    {
      key: 'points_calculated',
      title: 'Calculated',
      value: (r: Prediction) => (r.points_calculated ? 'X' : ''),
      sortable: true,
    },
  ];
</script>

<select class="select block my-4 justify-end" name="user" id="user" bind:value={userFilter}>
  <option value="">Kaikki</option>
  {#each uniqueUsers as user}
    <option value={user}>{user}</option>
  {/each}
</select>

<div class="card glass justify-between items-center">
  <SvelteTable
    {columns}
    rows={filteredGuesses}
    classNameTable={'table text-left'}
    classNameThead={'text-accent-content text-lg'}
    classNameTbody={'text-accent-content text-md'}
  />
</div>
