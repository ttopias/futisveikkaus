<script lang="ts">
  import { page } from '$app/stores';
  import NavLink from '$lib/components/NavLink.svelte';
  import LayoutDashboard from 'lucide-svelte/icons/layout-dashboard';
  import Users from 'lucide-svelte/icons/users';
  import Calendar from 'lucide-svelte/icons/calendar';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import Shield from 'lucide-svelte/icons/shield';
  import type { ComponentType } from 'svelte';

  type AdminNavItem = {
    href: string;
    label: string;
    icon: ComponentType;
    match: (path: string) => boolean;
  };

  const items: AdminNavItem[] = [
    {
      href: '/admin',
      label: 'Yleiskatsaus',
      icon: LayoutDashboard,
      match: (p) => p === '/admin',
    },
    {
      href: '/admin/users',
      label: 'Käyttäjät',
      icon: Users,
      match: (p) => p.startsWith('/admin/users'),
    },
    {
      href: '/admin/matches',
      label: 'Ottelut',
      icon: Calendar,
      match: (p) => p.startsWith('/admin/matches'),
    },
    {
      href: '/admin/guesses',
      label: 'Arvaukset',
      icon: ClipboardList,
      match: (p) => p.startsWith('/admin/guesses'),
    },
    {
      href: '/admin/teams',
      label: 'Joukkueet',
      icon: Shield,
      match: (p) => p.startsWith('/admin/teams'),
    },
  ];

  $: pathname = $page.url.pathname;
</script>

<nav
  class="mb-6 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between"
  aria-label="Ylläpito"
>
  <div class="flex items-center gap-2">
    <Shield class="size-5 text-primary" aria-hidden="true" />
    <h1 class="text-lg font-semibold tracking-tight">Ylläpito</h1>
  </div>
  <div class="-mx-1 flex gap-1 overflow-x-auto pb-1">
    {#each items as item}
      {@const active = item.match(pathname)}
      <NavLink href={item.href} {active} class="shrink-0 whitespace-nowrap px-3 py-2 text-sm">
        <svelte:component this={item.icon} class="mr-1.5 inline size-4" aria-hidden="true" />
        {item.label}
      </NavLink>
    {/each}
  </div>
</nav>
