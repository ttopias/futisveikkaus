<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';

  export let form: ActionData;
  let loading = false;
</script>

<Card.Header class="space-y-1 pb-4">
  <Card.Title class="text-center text-2xl">Unohtuiko salasana?</Card.Title>
</Card.Header>

<form
  method="POST"
  action="/auth?/forgot"
  class="space-y-4"
  use:enhance={() => {
    loading = true;
    return async ({ result, update }) => {
      update();
      if (result.type == 'failure') loading = false;
      loading = false;
    };
  }}
>
  <div class="space-y-2">
    <Label for="email">Sähköposti</Label>
    <Input
      autocomplete="email"
      id="email"
      name="email"
      type="email"
      placeholder="email@esimerkki.com"
      value={form?.email ?? ''}
      required
    />
  </div>

  <Button class="w-full" {loading} type="submit">Nollaa salasana</Button>
</form>
