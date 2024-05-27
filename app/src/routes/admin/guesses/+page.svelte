<script lang="ts">
  import type { User } from '@supabase/supabase-js';
  import type { PageData } from './$types';
  import SvelteTable from 'svelte-table';

  export let data: PageData;
  let guesses: any[] = data.guesses;
  let users: User[] = data.users;

  let userFilter = '';

  $: filteredGuesses = userFilter
    ? guesses.filter((guess) => guess.user_id === userFilter)
    : guesses;

  console.log('filteredGuesses :>> ', filteredGuesses);

  let columns = [
    {
      key: 'user',
      title: 'Käyttäjä',
      value: (r: any) => r.user,
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

<div class="">
  <select class="select block w-full" name="user" id="user" bind:value={userFilter}>
    <option value="">Kaikki</option>
    {#each users as user}
      <option value={user.id}>{user.user_metadata.first_name}</option>
    {/each}
  </select>

  <SvelteTable
    {columns}
    rows={filteredGuesses}
    classNameTable={'table text-left'}
    classNameThead={'text-accent-content text-lg'}
    classNameTbody={'text-accent-content text-md'}
  />

  <pre>{JSON.stringify(filteredGuesses, null, 2)}</pre>
</div>
