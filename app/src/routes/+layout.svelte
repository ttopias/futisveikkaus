<script lang="ts">
  import '../app.postcss';
  import { navigating } from '$app/stores';
  import Navbar from '$lib/components/Navbar.svelte';
  import { Jumper } from 'svelte-loading-spinners';
  import { PUBLIC_APP_NAME } from '$env/static/public';
  // import { onMount } from 'svelte';
  // import { MoonIcon, SunIcon } from 'svelte-feather-icons';
  // import { themeChange } from 'theme-change';

  // onMount(() => {
  //   themeChange(false);
  // });
</script>

<svelte:head>
  <title>{PUBLIC_APP_NAME}</title>
</svelte:head>

<div id="body" class="mx-auto min-h-screen flex flex-col overflow-y-auto">
  <Navbar />

  <!-- CONTENT -->
  <main class="container flex-1 flex flex-col items-center text-primary-content">
    {#if $navigating}
      <Jumper size="120" unit="px" duration="1s" color="#FF3E00" />
    {:else}
      <slot />
    {/if}
  </main>

  <!-- FOOTER -->
  <footer class="p-4 bg-accent text-accent-content shadow-2xl">
    <div class="flex justify-between items-center">
      <a href="https://github.com/ttopias" target="_blank">
        <p>© 2024</p>
      </a>

      <!-- Theme Switch -->
      <!-- <label class="btn btn-ghost btn-circle swap swap-rotate">
        <input data-toggle-theme="light,dark" data-act-class="ACTIVECLASS" type="checkbox" />
        <SunIcon class="swap-on fill-current" />
        <MoonIcon class="swap-off fill-current" />
      </label> -->
    </div>
  </footer>
</div>
