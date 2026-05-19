<script lang="ts">
  import { enhance } from '$app/forms';
  import Frown from 'lucide-svelte/icons/frown';
  import type { ActionData } from './$types';
  import { Alert } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';

  export let form: ActionData;
  let loading = false;
</script>

<Card.Header class="space-y-1 pb-4">
  <Card.Title class="text-center text-2xl">Kutsu käyttäjä</Card.Title>
</Card.Header>

{#if form?.error}
  <Alert variant="destructive" class="mb-4 flex items-center gap-2">
    <Frown class="h-4 w-4 shrink-0" />
    <span>{form.error}</span>
  </Alert>
{/if}

<form
  method="POST"
  action="/auth?/invite"
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
      id="email"
      name="email"
      type="email"
      placeholder="email@esimerkki.com"
      value={form?.email ?? ''}
      required
    />
  </div>

  <Button class="w-full" {loading} type="submit">Lähetä</Button>
</form>
