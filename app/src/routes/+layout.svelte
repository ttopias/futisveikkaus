<script lang="ts">
  import '../app.postcss';
  import { navigating } from '$app/stores';
  import Navbar from '$lib/components/Navbar.svelte';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { PUBLIC_APP_NAME } from '$env/static/public';

  const copyrightYear = new Date().getFullYear();
</script>

<svelte:head>
  <title>{PUBLIC_APP_NAME}</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-background text-foreground">
  <Navbar />

  <main
    class="mx-auto flex w-full min-w-0 max-w-lg flex-1 flex-col gap-6 px-4 py-4 sm:max-w-2xl lg:max-w-4xl"
  >
    {#if $navigating}
      <div
        class="flex w-full max-w-3xl flex-col gap-3 self-center"
        aria-busy="true"
        aria-label="Ladataan"
      >
        <Skeleton class="h-10 w-2/3" />
        <Skeleton class="h-32 w-full" />
        <Skeleton class="h-32 w-full" />
      </div>
    {:else}
      <slot />
    {/if}
  </main>

  <footer class="mt-auto border-t border-border bg-primary px-4 py-3 text-primary-foreground">
    <div
      class="mx-auto flex w-full max-w-lg items-center justify-between sm:max-w-2xl lg:max-w-4xl"
    >
      <a
        href="https://github.com/ttopias"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:underline"
      >
        © {copyrightYear}
      </a>
      <a href="/privacy" class="hover:underline">Tietosuoja</a>
    </div>
  </footer>
</div>
