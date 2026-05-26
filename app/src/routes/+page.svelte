<script lang="ts">
  import type { PageData } from './$types';
  import { rules } from '$lib/utils';
  import { onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';

  export let data: PageData;

  $: tournamentStart = data.tournamentStartsAt ? new Date(data.tournamentStartsAt) : null;
  $: countDownDate = tournamentStart?.getTime() ?? 0;

  let now = Date.now();

  $: timeLeft = countDownDate > 0 ? Math.max(0, countDownDate - now) : 0;
  $: days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  $: hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  $: minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  $: seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  $: countdownUnits = [
    { label: 'päivää', value: days },
    { label: 'tuntia', value: hours },
    { label: 'minuuttia', value: minutes },
    { label: 'sekuntia', value: seconds },
  ];

  $: showCountdown = timeLeft > 0;

  onMount(() => {
    if (!showCountdown) return;

    const interval = setInterval(() => {
      now = Date.now();
      if (countDownDate - now <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
  {#if showCountdown}
    <section class="w-full text-center">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Kisojen alkuun</h1>
      <div class="mx-auto mt-4 flex w-full max-w-md flex-nowrap justify-center gap-1 sm:gap-3">
        {#each countdownUnits as unit (unit.label)}
          <div
            class="min-w-0 shrink-0 flex-1 rounded-xl border border-border bg-card px-1 py-3 shadow-sm sm:px-2 sm:py-4"
          >
            <p
              class="font-mono text-2xl font-bold tabular-nums leading-none text-card-foreground sm:text-4xl"
            >
              {unit.value}
            </p>
            <p class="mt-1 text-[10px] leading-tight text-muted-foreground sm:text-sm">
              {unit.label}
            </p>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <Card.Root class="w-full shadow-md">
    <Card.Header>
      <Card.Title>Pisteytyssäännöt</Card.Title>
    </Card.Header>
    <Card.Content class="pt-0">
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Sääntö</Table.Head>
            <Table.Head class="w-20 text-right">Pisteitä</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each rules as rule}
            <Table.Row>
              <Table.Cell class="text-sm">{rule.rule}</Table.Cell>
              <Table.Cell class="text-right font-semibold tabular-nums">{rule.points}</Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
</div>
