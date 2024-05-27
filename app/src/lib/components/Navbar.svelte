<script lang="ts">
  import { page } from '$app/stores';
  import { logo } from '$lib/stores';
  import { PUBLIC_APP_NAME } from '$env/static/public';
  import { isAdmin } from '$lib/utils';
  import { LogOutIcon, UserIcon } from 'svelte-feather-icons';

  const role: string = $page.data.user?.user_metadata?.role || '';
  let isMenuOpen = false;
</script>

<nav class="bg-accent text-accent-content w-full p-2 shadow-2xl">
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-12">
      <div class="w-full flex">
        <!-- Logo and app -->
        <a class="flex items-center" href="/">
          <button
            on:click={() => {
              isMenuOpen = false;
            }}
            class="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <img src={$logo} class="h-6" alt="{PUBLIC_APP_NAME} logo" />
            <span class="self-center text-xl font-semibold whitespace-nowrap"
              >{PUBLIC_APP_NAME}</span
            >
          </button>
        </a>

        <!-- Navigation links for larger screens -->
        <div class="hidden sm:flex flex-grow items-center justify-center space-x-4">
          <a
            href="/"
            class="link no-underline px-3 py-2 rounded-md text-sm font-medium"
            aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Etusivu</a
          >
          <a
            href="/matches"
            class="link no-underline px-3 py-2 rounded-md text-sm font-medium"
            aria-current={$page.url.pathname === '/matches' ? 'page' : undefined}>Otteluohjelma</a
          >
          <a
            href="/teams"
            class="link no-underline px-3 py-2 rounded-md text-sm font-medium"
            aria-current={$page.url.pathname === '/teams' ? 'page' : undefined}>Joukkueet</a
          >
          {#if $page.data.user}
            <a
              href="/predictions?create"
              class="link no-underline px-3 py-2 rounded-md text-sm font-medium"
              aria-current={$page.url.pathname === '/predictions' ? 'page' : undefined}
              >Veikkaukset</a
            >
            <a
              href="/standings"
              class="link no-underline px-3 py-2 rounded-md text-sm font-medium"
              aria-current={$page.url.pathname === '/standings' ? 'page' : undefined}
              >Pistetilanne</a
            >
          {/if}
        </div>
        {#if isAdmin(role)}
          <div class="hidden sm:flex flex-grow items-center justify-center space-x-4">
            <a
              href="/admin/matches"
              class="link no-underline px-3 py-2 rounded-md text-sm font-medium text-accent-content"
              aria-current={$page.url.pathname === '/admin/matches' ? 'page' : undefined}
              >Otteluohjelma</a
            >
            <a
              href="/admin/teams"
              class="link no-underline px-3 py-2 rounded-md text-sm font-medium text-accent-content"
              aria-current={$page.url.pathname === '/admin/teams' ? 'page' : undefined}>Joukkueet</a
            >
            <a
              href="/admin/guesses"
              class="link no-underline px-3 py-2 rounded-md text-sm font-medium text-accent-content"
              aria-current={$page.url.pathname === '/admin/guesses' ? 'page' : undefined}
              >Arvaukset</a
            >
          </div>
        {/if}
        <!-- Buttons -->
        <div class="hidden sm:flex items-center space-x-4">
          {#if $page.data.user}
            <a
              href="/profile"
              class="link no-underline px-3 py-2 rounded-md text-sm font-medium"
              aria-current={$page.url.pathname === '/profile' ? 'page' : undefined}><UserIcon /></a
            >
          {:else}
            <a href="/auth" class="btn btn-primary h-4 rounded-lg">KIRJAUDU SISÄÄN</a>
          {/if}
        </div>
      </div>

      <!-- Mobile menu button -->
      <div class="flex items-center rounded-btn">
        <div class="sm:hidden">
          <button
            on:click={() => (isMenuOpen = !isMenuOpen)}
            class="inline-flex items-center justify-center p-2 rounded-md"
          >
            <span class="sr-only">Open main menu</span>
            <!-- Icon for menu button -->
            {#if !isMenuOpen}
              <svg
                class="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            {:else}
              <svg
                class="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile menu -->
  <div
    class="bg-accent text-accent-content sm:hidden mt-2 rounded-btn"
    id="mobile-menu"
    class:hidden={!isMenuOpen}
  >
    <div class="px-2 pt-2 pb-3 space-y-1 mx-2">
      <a
        on:click={() => (isMenuOpen = !isMenuOpen)}
        href="/"
        class="w-full block h-6 px-3 py-2 rounded-md text-base font-medium"
        aria-current={$page.url.pathname === '/' ? 'page' : undefined}>Etusivu</a
      >
      <div class="divider divider-neutral opacity-25 py-4" />
      <a
        on:click={() => (isMenuOpen = !isMenuOpen)}
        href="/matches"
        class="w-full block h-6 px-3 py-2 rounded-md text-base font-medium"
        aria-current={$page.url.pathname === '/matches' ? 'page' : undefined}>Otteluohjelma</a
      >
      <div class="divider divider-neutral opacity-25 py-4" />
      <a
        on:click={() => (isMenuOpen = !isMenuOpen)}
        href="/teams"
        class="w-full block h-6 px-3 py-2 rounded-md text-base font-medium"
        aria-current={$page.url.pathname === '/teams' ? 'page' : undefined}>Joukkueet</a
      >

      <!-- User-specific -->
      {#if $page.data.user}
        <div class="divider divider-neutral opacity-25 py-4" />
        <a
          on:click={() => (isMenuOpen = !isMenuOpen)}
          href="/predictions?create"
          class="w-full block h-6 px-3 py-2 rounded-md text-base font-medium"
          aria-current={$page.url.pathname === '/predictions' ? 'page' : undefined}>Veikkaukset</a
        >
        <div class="divider divider-neutral opacity-25 py-4" />
        <a
          on:click={() => (isMenuOpen = !isMenuOpen)}
          href="/standings"
          class="w-full block h-6 px-3 py-2 rounded-md text-base font-medium"
          aria-current={$page.url.pathname === '/standings' ? 'page' : undefined}>Pistetilanne</a
        >
        <div class="divider divider-neutral opacity-25 py-4" />
        <a
          on:click={() => (isMenuOpen = !isMenuOpen)}
          href="/profile"
          class="w-full block h-6 px-3 py-2 rounded-md text-base font-medium"
          aria-current={$page.url.pathname === '/profile' ? 'page' : undefined}>Profiili</a
        >
        <div class="divider divider-neutral opacity-25 py-4" />
        <a
          on:click={() => (isMenuOpen = !isMenuOpen)}
          href="/standings"
          class="w-full flex h-6 px-3 rounded-md text-base font-medium"
          ><LogOutIcon class="mr-2" />KIRJAUDU ULOS
        </a>
      {/if}

      <!-- Admin-specific -->
      {#if isAdmin(role)}
        <div class="divider divider-neutral opacity-25 py-4" />
        <a
          on:click={() => (isMenuOpen = !isMenuOpen)}
          href="/admin/matches"
          class="w-full text-accent-content block h-6 px-3 py-2 rounded-md text-base font-medium"
          aria-current={$page.url.pathname === '/admin/matches' ? 'page' : undefined}
          >Otteluohjelma</a
        >
        <a
          on:click={() => (isMenuOpen = !isMenuOpen)}
          href="/admin/teams"
          class="w-full text-accent-content block h-6 px-3 py-2 rounded-md text-base font-medium"
          aria-current={$page.url.pathname === '/admin/teams' ? 'page' : undefined}>Joukkueet</a
        >
        <a
          on:click={() => (isMenuOpen = !isMenuOpen)}
          href="/admin/guesses"
          class="w-full text-accent-content block h-6 px-3 py-2 rounded-md text-base font-medium"
          aria-current={$page.url.pathname === '/admin/guesses' ? 'page' : undefined}>Arvaukset</a
        >
      {/if}

      {#if !$page.data.user}
        <div class="flex items-center space-x-4">
          <a href="/auth" on:click={() => (isMenuOpen = !isMenuOpen)}>
            <button type="button" class="btn btn-primary my-6">KIRJAUDU SISÄÄN</button></a
          >
        </div>
      {/if}
    </div>
  </div>
</nav>
