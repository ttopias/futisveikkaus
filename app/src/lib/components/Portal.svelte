<script lang="ts">
  import { onMount } from 'svelte';
  let ref: HTMLDivElement;

  onMount(() => {
    document.body.appendChild(ref);
    return () => {
      document.body.removeChild(ref);
    };
  });
</script>

<template>
  <div bind:this={ref}>
    <slot />
  </div>
</template>
