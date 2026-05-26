<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import Eye from 'lucide-svelte/icons/eye';
  import EyeOff from 'lucide-svelte/icons/eye-off';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';

  export let form: ActionData;
  let loading = false;
  let showPassword = false;
  $: type = showPassword ? 'text' : 'password';
</script>

<Card.Header class="space-y-1 pb-4">
  <Card.Title class="text-center text-2xl">Kirjaudu sisään</Card.Title>
</Card.Header>

<form
  method="POST"
  action="/auth?/signin"
  class="space-y-4"
  use:enhance={() => {
    loading = true;
    return async ({ result, update }) => {
      update();
      if (result.type == 'failure') loading = false;
    };
  }}
>
  <div class="space-y-2">
    <Label for="email">Sähköposti</Label>
    <Input
      autocomplete="email"
      id="email"
      name="email"
      value={form?.email ?? ''}
      type="email"
      placeholder="email@esimerkki.com"
      required
    />
  </div>

  <div class="space-y-2">
    <Label for="password">Salasana</Label>
    <div class="relative">
      <Input
        autocomplete="current-password"
        id="password"
        name="password"
        {...{ type }}
        placeholder="Salasana"
        class="pr-10"
        required
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
        on:click={() => (showPassword = !showPassword)}
        aria-label="Toggle password visibility"
      >
        {#if showPassword}
          <EyeOff class="h-4 w-4" />
        {:else}
          <Eye class="h-4 w-4" />
        {/if}
      </Button>
    </div>
  </div>

  <Button class="w-full" {loading} type="submit">Kirjaudu</Button>

  <p class="text-center text-sm text-muted-foreground">
    <a class="text-primary hover:underline" href="?signup">Ei vielä tunnusta? Rekisteröidy</a>
  </p>
  <p class="text-center text-sm text-muted-foreground">
    <a class="text-primary hover:underline" href="?forgot">Unohtuiko salasana?</a>
  </p>
</form>
