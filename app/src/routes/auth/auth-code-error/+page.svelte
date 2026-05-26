<script lang="ts">
  import { page } from '$app/stores';
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
</script>

<div class="flex w-full justify-center px-4 py-8">
  <Card.Root class="w-full max-w-lg shadow-md">
    <Card.Header>
      {#if $page.status === 404}
        <Card.Title>Sivua ei löytynyt</Card.Title>
        <p class="text-sm text-muted-foreground">
          <a href="/" class="text-primary hover:underline">Takaisin</a>
        </p>
      {:else}
        <Card.Title>Jotain meni pieleen</Card.Title>
        <p class="text-sm text-muted-foreground">Selvitämme asiaa. Yritä myöhemmin uudelleen.</p>
        <a href="/">
          <Button variant="link" class="mt-2 px-0" type="button">Takaisin</Button>
        </a>
      {/if}
    </Card.Header>
  </Card.Root>
</div>
