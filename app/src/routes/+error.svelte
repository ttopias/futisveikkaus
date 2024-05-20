<script lang="ts">
  import { page } from '$app/stores';
</script>

<section class="m-12 grid items-center gap-6">
  <div class="flex max-w-[980px] flex-col items-start gap-2">
    {#if $page.status === 404}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Sivua ei löytynyt.
      </h1>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Mene takaisin</a>
      </p>
    {:else if $page.status === 401}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Et ole kirjautunut sisään.
      </h1>
      Kirjaudu sisään tai rekisteröidy nähdäksesi tämän sivun.
      <br />
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/auth" class="underline">Login or register</a>
      </p>
      <br />
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Mene takaisin</a>
      </p>
    {:else if $page.status === 403}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Virheellinen käyttöoikeus
      </h1>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        Sinulla ei ole oikeutta nähdä tätä sivua.
      </p>
      <br />
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Mene takaisin</a>
      </p>
    {:else}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Odottamaton virhe
      </h1>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        Jotain meni pieleen. Ota yhteys sivuston haltijaan.
      </p>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Mene takaisin</a>
      </p>
    {/if}
  </div>
</section>
