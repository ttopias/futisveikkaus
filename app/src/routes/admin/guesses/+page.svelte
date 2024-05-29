<script lang="ts">
  import type { PageData } from './$types';
  import SvelteTable from 'svelte-table';

  export let data: PageData;
  let guesses: any[] = data.guesses;

  let userFilter = '';
  let uniqueUsers = new Set(guesses.map((guess) => guess.user.first_name));

  $: filteredGuesses = userFilter
    ? guesses.filter((guess) => guess.user.first_name === userFilter)
    : guesses;

  let columns = [
    {
      key: 'user',
      title: 'Käyttäjä',
      value: (r: any) => r.user.first_name,
      sortable: true,
    },
    {
      key: 'date',
      title: 'PVM',
      value: (r: any) => r.match.date,
      sortable: true,
    },
    {
      key: 'match',
      title: 'Ottelu',
      value: (r: any) => `${r.match.home.name} - ${r.match.away.name}`,
      sortable: true,
    },
    {
      key: 'prediction',
      title: 'Arvaus',
      value: (r: any) => `${r.home_goals} - ${r.away_goals}`,
      sortable: true,
    },
    {
      key: 'result',
      title: 'Lopputulos',
      value: (r: any) => `${r.match.home_goals} - ${r.match.away_goals}`,
      sortable: true,
    },
    {
      key: 'points',
      title: 'Pisteet',
      value: (r: any) => r.points,
      sortable: true,
    },
    {
      key: 'points_calculated',
      title: 'Calculated',
      value: (r: any) => (r.points_calculated ? 'X' : ''),
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
