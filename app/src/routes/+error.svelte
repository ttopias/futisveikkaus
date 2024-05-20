<script lang="ts">
  import { page } from '$app/stores';
</script>

<section class="m-12 grid items-center gap-6">
  <div class="flex max-w-[980px] flex-col items-start gap-2">
    {#if $page.status === 404}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Page Not Found.
      </h1>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Go back</a>
      </p>
    {:else if $page.status === 401}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Unauthorized. 
      </h1>
      Please login to access this page.
      <br />
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/auth" class="underline">Login or register</a>
      </p>
      <br />
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Go back</a>
      </p>
    {:else if $page.status === 403}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Forbidden.
      </h1>
      You don't have permission to access this page.
      <br />
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Go back</a>
      </p>
    {:else}
      <h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
        Unexpected Error
      </h1>
      <p class="max-w-[700px] text-lg text-muted-foreground">We're investigating the issue.</p>
      <p class="max-w-[700px] text-lg text-muted-foreground">
        <a href="/" class="underline">Go back</a>
      </p>
    {/if}
  </div>
</section>
