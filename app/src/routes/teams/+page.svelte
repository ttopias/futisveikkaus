<script lang="ts">
  import type { PageData } from './$types';
  import type { Team } from '$lib/index';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import TeamFlag from '$lib/components/TeamFlag.svelte';

  export let data: PageData;

  function sortGroupTeams(teams: Team[]): Team[] {
    return [...teams].sort((a, b) => {
      const ptsA = a.win * 3 + a.draw;
      const ptsB = b.win * 3 + b.draw;
      if (ptsB !== ptsA) return ptsB - ptsA;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.gaa - b.gaa;
    });
  }

  $: groups = data.teams ? Object.keys(data.teams).sort((a, b) => a.localeCompare(b)) : [];

  const tableClass = 'table-fixed w-full text-[10px] sm:text-xs md:text-sm';
  const headClass = 'h-auto px-0.5 py-1 md:h-12 md:px-3 md:py-3';
  const cellClass = 'px-0.5 py-1 md:px-3 md:py-3';
  const statColClass = 'w-[8%] text-center tabular-nums whitespace-nowrap';
  const teamHeadClass = 'break-words leading-tight';
  const teamCellClass = 'break-words leading-tight align-middle';
  const tableFlagClass = 'h-4 w-5 shrink-0 rounded-sm sm:h-5 sm:w-7';
  const tableTeamNameClass =
    'min-w-0 break-words text-[10px] leading-tight text-foreground sm:text-xs md:text-sm';
</script>

<div class="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
  {#if groups.length === 0}
    <p class="col-span-full py-12 text-center text-muted-foreground">
      Ei joukkueita näytettäväksi.
    </p>
  {:else}
    {#each groups as group}
      {@const groupTeams = sortGroupTeams(data.teams[group])}
      <Card.Root class="overflow-hidden shadow-md">
        <Card.Header>
          <Card.Title class="text-center text-base">Lohko {group}</Card.Title>
        </Card.Header>
        <Card.Content class="pt-0">
          <Table.Root class={tableClass}>
            <Table.Header>
              <Table.Row>
                <Table.Head class="{headClass} {teamHeadClass}">Maa</Table.Head>
                <Table.Head class="{headClass} {statColClass}">P</Table.Head>
                <Table.Head class="{headClass} {statColClass}">V</Table.Head>
                <Table.Head class="{headClass} {statColClass}">T</Table.Head>
                <Table.Head class="{headClass} {statColClass}">H</Table.Head>
                <Table.Head class="{headClass} {statColClass}">TM</Table.Head>
                <Table.Head class="{headClass} {statColClass}">PM</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each groupTeams as team (team.team_id)}
                <Table.Row>
                  <Table.Cell class="{cellClass} {teamCellClass}">
                    <div class="flex min-w-0 items-center gap-0.5 sm:gap-2">
                      <TeamFlag
                        countryCode={team.country_code}
                        name={team.name}
                        width={20}
                        height={14}
                        class={tableFlagClass}
                      />
                      <span class={tableTeamNameClass} title={team.name}>{team.name}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell class="{cellClass} {statColClass} font-semibold">
                    {team.win * 3 + team.draw}
                  </Table.Cell>
                  <Table.Cell class="{cellClass} {statColClass}">{team.win}</Table.Cell>
                  <Table.Cell class="{cellClass} {statColClass}">{team.draw}</Table.Cell>
                  <Table.Cell class="{cellClass} {statColClass}">{team.loss}</Table.Cell>
                  <Table.Cell class="{cellClass} {statColClass}">{team.gf}</Table.Cell>
                  <Table.Cell class="{cellClass} {statColClass}">{team.gaa}</Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </Card.Content>
      </Card.Root>
    {/each}
  {/if}
</div>
