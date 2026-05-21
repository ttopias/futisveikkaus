<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { logo } from '$lib/stores';
  import { PUBLIC_APP_NAME } from '$env/static/public';
  import { getUserRole, isAdmin } from '$lib/utils';
  import NavLink from '$lib/components/NavLink.svelte';
  import Home from 'lucide-svelte/icons/home';
  import Calendar from 'lucide-svelte/icons/calendar';
  import Users from 'lucide-svelte/icons/users';
  import Target from 'lucide-svelte/icons/target';
  import Trophy from 'lucide-svelte/icons/trophy';
  import BarChart3 from 'lucide-svelte/icons/bar-chart-3';
  import Shield from 'lucide-svelte/icons/shield';
  import LogIn from 'lucide-svelte/icons/log-in';
  import LogOut from 'lucide-svelte/icons/log-out';
  import User from 'lucide-svelte/icons/user';
  import Menu from 'lucide-svelte/icons/menu';
  import ClipboardList from 'lucide-svelte/icons/clipboard-list';
  import type { ComponentType } from 'svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import * as Sheet from '$lib/components/ui/sheet';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { cn } from '$lib/utils';

  const role: string = getUserRole($page.data.user);
  let mobileOpen = false;

  type NavItem = {
    href: string;
    label: string;
    icon: ComponentType;
    match?: (path: string) => boolean;
  };

  const mainLinks: NavItem[] = [
    { href: '/', label: 'Etusivu', icon: Home, match: (p) => p === '/' },
    {
      href: '/matches',
      label: 'Otteluohjelma',
      icon: Calendar,
      match: (p) => p === '/matches' || p.startsWith('/matches/'),
    },
    {
      href: '/teams',
      label: 'Joukkueet',
      icon: Users,
      match: (p) => p === '/teams' || p.startsWith('/teams/'),
    },
    {
      href: '/fifa-ranking',
      label: 'FIFA-ranking',
      icon: BarChart3,
      match: (p) => p === '/fifa-ranking',
    },
  ];

  const userLinks: NavItem[] = [
    {
      href: '/predictions?create',
      label: 'Veikkaukset',
      icon: Target,
      match: (p) => p === '/predictions' || p.startsWith('/predictions/'),
    },
    {
      href: '/standings',
      label: 'Pistetilanne',
      icon: Trophy,
      match: (p) => p === '/standings',
    },
  ];

  const adminLinks: NavItem[] = [
    {
      href: '/admin/matches',
      label: 'Otteluohjelma',
      icon: Calendar,
      match: (p) => p === '/admin/matches',
    },
    { href: '/admin/teams', label: 'Joukkueet', icon: Users, match: (p) => p === '/admin/teams' },
    {
      href: '/admin/guesses',
      label: 'Arvaukset',
      icon: ClipboardList,
      match: (p) => p === '/admin/guesses',
    },
  ];

  const profileLink: NavItem = {
    href: '/profile',
    label: 'Profiili',
    icon: User,
    match: (p) => p === '/profile',
  };

  const isActive = (item: NavItem, path: string) => item.match?.(path) ?? path === item.href;

  const closeMobile = () => {
    mobileOpen = false;
  };

  afterNavigate(() => {
    mobileOpen = false;
  });

  $: pathname = $page.url.pathname;
  $: signedIn = Boolean($page.data.user);
  $: showAdmin = isAdmin(role);
</script>

<header
  class="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
>
  <div class="container flex h-14 items-center justify-between gap-4 sm:h-[3.25rem]">
    <a href="/" class="flex min-w-0 shrink items-center gap-2" on:click={closeMobile}>
      <img src={$logo} class="h-7 w-7 shrink-0" alt="{PUBLIC_APP_NAME} logo" />
      <span class="truncate text-base font-semibold tracking-tight sm:text-lg"
        >{PUBLIC_APP_NAME}</span
      >
    </a>

    <nav
      class="hidden flex-1 items-center justify-center gap-0.5 md:flex md:px-2"
      aria-label="Päävalikko"
    >
      {#each mainLinks as item}
        <NavLink href={item.href} active={isActive(item, pathname)}>
          <item.icon class="size-4 shrink-0 opacity-80" aria-hidden="true" />
          {item.label}
        </NavLink>
      {/each}
      {#if signedIn}
        {#each userLinks as item}
          <NavLink href={item.href} active={isActive(item, pathname)}>
            <item.icon class="size-4 shrink-0 opacity-80" aria-hidden="true" />
            {item.label}
          </NavLink>
        {/each}
      {/if}
      {#if showAdmin}
        <Separator orientation="vertical" class="mx-1.5 h-6" />
        {#each adminLinks as item}
          <NavLink
            href={item.href}
            active={isActive(item, pathname)}
            class={!isActive(item, pathname) ? 'text-muted-foreground' : undefined}
          >
            <item.icon class="size-4 shrink-0 opacity-70" aria-hidden="true" />
            {item.label}
          </NavLink>
        {/each}
      {/if}
    </nav>

    <div class="flex items-center gap-2">
      <div class="hidden items-center gap-2 md:flex">
        {#if signedIn}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" size="icon" type="button" aria-label="Käyttäjävalikko">
                <User class="size-5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" class="w-48">
              <DropdownMenu.Item>
                <a href={profileLink.href} class="flex w-full items-center gap-2">
                  <User class="size-4 opacity-80" aria-hidden="true" />
                  {profileLink.label}
                </a>
              </DropdownMenu.Item>
              <DropdownMenu.Separator />
              <DropdownMenu.Item>
                <form action="/auth?/signout" method="POST" class="w-full">
                  <button
                    type="submit"
                    class="flex w-full items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut class="size-4" aria-hidden="true" />
                    Kirjaudu ulos
                  </button>
                </form>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {:else}
          <Button href="/auth" size="sm" class="gap-2">
            <LogIn class="size-4" />
            Kirjaudu sisään
          </Button>
        {/if}
      </div>

      <Sheet.Root bind:open={mobileOpen}>
        <Sheet.Trigger
          class={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'md:hidden')}
          aria-label="Avaa valikko"
        >
          <Menu class="size-5" />
        </Sheet.Trigger>
        <Sheet.Content
          side="left"
          class="flex w-[min(100vw-2rem,20rem)] flex-col gap-0 border-r border-border/60 bg-background p-0"
        >
          <Sheet.Header
            class="flex-row items-center justify-between space-y-0 border-b border-border/60 bg-muted/30 px-4 py-3.5"
          >
            <Sheet.Title class="text-base font-semibold tracking-tight"
              >{PUBLIC_APP_NAME}</Sheet.Title
            >
          </Sheet.Header>

          <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label="Mobiilivalikko">
            {#each mainLinks as item}
              <NavLink
                href={item.href}
                active={isActive(item, pathname)}
                mobile
                on:click={closeMobile}
              >
                <item.icon class="size-5 shrink-0 opacity-80" aria-hidden="true" />
                {item.label}
              </NavLink>
            {/each}

            {#if signedIn}
              <Separator class="my-2.5" />
              {#each userLinks as item}
                <NavLink
                  href={item.href}
                  active={isActive(item, pathname)}
                  mobile
                  on:click={closeMobile}
                >
                  <item.icon class="size-5 shrink-0 opacity-80" aria-hidden="true" />
                  {item.label}
                </NavLink>
              {/each}
              <NavLink
                href={profileLink.href}
                active={isActive(profileLink, pathname)}
                mobile
                on:click={closeMobile}
              >
                <profileLink.icon class="size-5 shrink-0 opacity-80" aria-hidden="true" />
                {profileLink.label}
              </NavLink>
            {/if}

            {#if showAdmin}
              <Separator class="my-2.5" />
              <p
                class="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary/80"
              >
                <Shield class="size-3.5 shrink-0" aria-hidden="true" />
                Admin
              </p>
              {#each adminLinks as item}
                <NavLink
                  href={item.href}
                  active={isActive(item, pathname)}
                  mobile
                  on:click={closeMobile}
                >
                  <item.icon class="size-5 shrink-0 opacity-80" aria-hidden="true" />
                  {item.label}
                </NavLink>
              {/each}
            {/if}

            <Separator class="my-2" />
            {#if signedIn}
              <form action="/auth?/signout" method="POST">
                <Button
                  type="submit"
                  variant="ghost"
                  class="min-h-11 w-full justify-start gap-3 px-3 py-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  on:click={closeMobile}
                >
                  <LogOut class="size-5 shrink-0" aria-hidden="true" />
                  Kirjaudu ulos
                </Button>
              </form>
            {:else}
              <Button href="/auth" class="w-full gap-2" on:click={closeMobile}>
                <LogIn class="size-4" />
                Kirjaudu sisään
              </Button>
            {/if}
          </nav>
        </Sheet.Content>
      </Sheet.Root>
    </div>
  </div>
</header>
