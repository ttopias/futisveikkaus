<script lang="ts">
  import '../app.postcss';
  import { navigating } from '$app/stores';
  import Navbar from '$lib/components/Navbar.svelte';
  import { onMount } from 'svelte';
  import { Jumper } from 'svelte-loading-spinners';
  import { MoonIcon, SunIcon } from 'svelte-feather-icons';
  import { themeChange } from 'theme-change';

  onMount(() => {
    themeChange(false);
  });
</script>

<svelte:head>
  <title>Futisveikkaus</title>
</svelte:head>

<div id="body" class="mx-auto min-h-screen flex flex-col overflow-y-auto">
  <Navbar />

  <!-- CONTENT -->
  <main class="flex-1 bg-base-200">
    <div class="flex items-center justify-center">
      {#if $navigating}
        <div class="align-middle">
          <Jumper size="120" unit="px" duration="1s" color="#FF3E00" />
        </div>
      {:else}
        <slot />
      {/if}
    </div>
  </main>

  <!-- FOOTER -->
  <footer class="p-4 bg-neutral text-neutral-content">
    <div class="flex justify-between items-center">
      <a href="https://github.com/ttopias" target="_blank">
        <p>© 2024</p>
      </a>

      <!-- Theme Switch -->
      <label class="btn btn-ghost btn-circle swap swap-rotate">
        <input data-toggle-theme="light,dark" data-act-class="ACTIVECLASS" type="checkbox" />
        <SunIcon class="swap-on fill-current" />
        <MoonIcon class="swap-off fill-current" />
      </label>
    </div>
  </footer>
</div>
