<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';

  let loading = false;
  let disabled = true;
  let password = '';
  let password2 = '';
  $: disabled = password !== password2;
</script>

<Card.Header class="space-y-1 pb-4">
  <Card.Title class="text-center text-2xl">Nollaa salasana</Card.Title>
</Card.Header>

<form
  method="POST"
  action="/auth?/reset"
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
    <Label for="password">Salasana</Label>
    <Input
      id="password"
      name="password"
      type="password"
      bind:value={password}
      placeholder="Salasana"
      required
    />
  </div>

  <div class="space-y-2">
    <Label for="password2">Vahvista salasana</Label>
    <Input
      id="password2"
      name="password_confirm"
      type="password"
      bind:value={password2}
      placeholder="Vahvista salasana"
      required
    />
  </div>

  <Button class="w-full" {loading} {disabled} type="submit">Nollaa salasana</Button>
</form>
