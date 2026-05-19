<script lang="ts">
  import type { PageData } from './$types';
  import { rules } from '$lib/utils';
  import { onMount, onDestroy } from 'svelte';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';

  export let data: PageData;

  $: tournamentStart = data.tournamentStartsAt ? new Date(data.tournamentStartsAt) : null;
  $: showCountdown = tournamentStart != null && tournamentStart > new Date();
  $: countDownDate = tournamentStart?.getTime() ?? 0;

  let days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    timeLeft = 0;

  $: days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  $: hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  $: minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  $: seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const countdownUnits = [
    { label: 'päivää', get: () => days },
    { label: 'tuntia', get: () => hours },
    { label: 'minuuttia', get: () => minutes },
    { label: 'sekuntia', get: () => seconds },
  ];

  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    if (!showCountdown) return;

    const tick = () => {
      timeLeft = countDownDate - new Date().getTime();
      if (timeLeft < 0) {
        timeLeft = 0;
        clearInterval(interval);
      }
    };

    tick();
    interval = setInterval(tick, 1000);
  });

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
  {#if showCountdown}
    <section class="w-full text-center">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">Kisojen alkuun</h1>
      <div class="mx-auto mt-4 grid max-w-md grid-cols-2 gap-3 sm:grid-cols-4">
        {#each countdownUnits as unit}
          <div class="rounded-xl border border-border bg-card px-2 py-4 shadow-sm">
            <p class="font-mono text-3xl font-bold tabular-nums text-card-foreground sm:text-4xl">
              {unit.get()}
            </p>
            <p class="mt-1 text-xs text-muted-foreground sm:text-sm">{unit.label}</p>
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
