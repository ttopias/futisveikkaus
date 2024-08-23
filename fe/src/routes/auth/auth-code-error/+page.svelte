<script lang="ts">
  import { page } from '$app/stores';
</script>

<section class="container grid items-center gap-6">
  <div class="flex max-w-[980px] flex-col items-start gap-2">
    {#if $page.status === 404}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Sivua ei löytynyt.
      </h1>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Takaisin</a>
      </p>
    {:else}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Jotain meni pieleen.
      </h1>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        Selvitämme asiaa. Ole hyvä ja yritä myöhemmin uudelleen.
      </p>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Takaisin</a>
      </p>
    {/if}
  </div>
</section>
