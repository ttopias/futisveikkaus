<script lang="ts">
  import type { PageData } from './$types';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';

  export let data: PageData;

  $: teams = data.teams ?? [];
</script>

<svelte:head>
  <title>FIFA-ranking</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
  <h1 class="text-center text-xl font-semibold tracking-tight">FIFA-ranking</h1>

  {#if teams.length === 0}
    <p class="py-12 text-center text-muted-foreground">Ranking-tietoja ei ole vielä saatavilla.</p>
  {:else}
    <div class="flex flex-col gap-2 md:hidden">
      {#each teams as team (team.team_id)}
        <Card.Root class="shadow-sm">
          <Card.Content class="flex items-center gap-3 p-3">
            <span class="w-8 shrink-0 text-center text-lg font-semibold tabular-nums text-primary">
              {team.fifa_rank}
            </span>
            <TeamFlag
              countryCode={team.country_code}
              name={team.name}
              width={28}
              height={20}
              class="h-5 w-7 shrink-0 rounded-sm"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{team.name}</p>
              <p class="text-xs text-muted-foreground">Lohko {team.group}</p>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>

    <Card.Root class="hidden overflow-hidden shadow-sm md:block">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-14 text-center">Sija</Table.Head>
            <Table.Head>Joukkue</Table.Head>
            <Table.Head class="w-20 text-center">Lohko</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each teams as team (team.team_id)}
            <Table.Row>
              <Table.Cell class="text-center font-semibold tabular-nums">{team.fifa_rank}</Table.Cell>
              <Table.Cell class="min-w-0">
                <div class="flex items-center gap-2">
                  <TeamFlag
                    countryCode={team.country_code}
                    name={team.name}
                    width={28}
                    height={20}
                    class="h-5 w-7 shrink-0 rounded-sm"
                  />
                  <span class="truncate">{team.name}</span>
                </div>
              </Table.Cell>
              <Table.Cell class="text-center text-muted-foreground">{team.group}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Root>
  {/if}
</div>
