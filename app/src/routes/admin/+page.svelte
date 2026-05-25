<script lang="ts">
  import type { PageData } from './$types';
  import AdminNav from '$lib/components/admin/AdminNav.svelte';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import Users from 'lucide-svelte/icons/users';
  import Calendar from 'lucide-svelte/icons/calendar';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import Trophy from 'lucide-svelte/icons/trophy';

  export let data: PageData;

  const sections = [
    {
      href: '/admin/users',
      title: 'Käyttäjät',
      description: 'Nimet, roolit ja pisteet',
      icon: Users,
    },
    {
      href: '/admin/matches',
      title: 'Ottelut',
      description: 'Tulokset ja peliajat',
      icon: Calendar,
    },
    {
      href: '/admin/guesses',
      title: 'Arvaukset',
      description: 'Muokkaa ja korjaa veikkausdataa',
      icon: ClipboardList,
    },
    {
      href: '/admin/teams',
      title: 'Joukkueet',
      description: 'Joukkue- ja FIFA-tiedot',
      icon: Trophy,
    },
  ];
</script>

<AdminNav />

<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
  <Card.Root class="shadow-sm">
    <Card.Header class="pb-2">
      <Card.Description>Käyttäjiä</Card.Description>
      <Card.Title class="text-2xl tabular-nums">{data.stats.userCount}</Card.Title>
    </Card.Header>
  </Card.Root>
  <Card.Root class="shadow-sm">
    <Card.Header class="pb-2">
      <Card.Description>Otteluita</Card.Description>
      <Card.Title class="text-2xl tabular-nums">{data.stats.matchCount}</Card.Title>
    </Card.Header>
  </Card.Root>
  <Card.Root class="shadow-sm">
    <Card.Header class="pb-2">
      <Card.Description>Pelattu</Card.Description>
      <Card.Title class="text-2xl tabular-nums">{data.stats.finishedCount}</Card.Title>
    </Card.Header>
  </Card.Root>
  <Card.Root class="shadow-sm">
    <Card.Header class="pb-2">
      <Card.Description>Tulossa</Card.Description>
      <Card.Title class="text-2xl tabular-nums">{data.stats.upcomingCount}</Card.Title>
    </Card.Header>
  </Card.Root>
</div>

<p class="text-sm text-muted-foreground">
  Arvauksia yhteensä: <span class="font-medium text-foreground">{data.stats.guessCount}</span>
</p>

<section class="mt-6">
  <h2 class="mb-3 text-base font-semibold">Hallinta</h2>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
    {#each sections as section}
      <Card.Root class="shadow-sm">
        <Card.Header>
          <div class="flex items-start gap-3">
            <svelte:component
              this={section.icon}
              class="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div>
              <Card.Title class="text-base">{section.title}</Card.Title>
              <Card.Description>{section.description}</Card.Description>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          <Button href={section.href} variant="outline" size="sm" class="w-full sm:w-auto">
            Avaa
          </Button>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</section>

{#if data.recentGuesses.length > 0}
  <section class="mt-8">
    <h2 class="mb-3 text-base font-semibold">Viimeisimmät arvaukset</h2>
    <Card.Root class="shadow-sm">
      <Card.Content class="divide-y divide-border p-0">
        {#each data.recentGuesses as guess}
          <div class="flex items-center justify-between gap-2 px-4 py-3 text-sm">
            <span>{guess.first_name ?? '—'}</span>
            <span class="tabular-nums text-muted-foreground">{guess.points} p</span>
          </div>
        {/each}
      </Card.Content>
    </Card.Root>
  </section>
{/if}
