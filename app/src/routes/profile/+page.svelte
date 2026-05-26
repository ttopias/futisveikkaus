<script lang="ts">
  import { enhance } from '$app/forms';
  import LogOut from 'lucide-svelte/icons/log-out';
  import Mail from 'lucide-svelte/icons/mail';
  import Save from 'lucide-svelte/icons/save';
  import User from 'lucide-svelte/icons/user';
  import type { ActionData, PageData } from './$types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';

  export let data: PageData;
  export let form: ActionData;
  let loading = false;
</script>

<div class="mx-auto w-full max-w-md py-4">
  <Card.Root class="shadow-md">
    <Card.Header>
      <Card.Title class="text-center text-2xl">Käyttäjätiedot</Card.Title>
    </Card.Header>
    <Card.Content class="space-y-6">
      <form
        id="edit"
        class="space-y-4"
        method="POST"
        action="?/update"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            update();
            loading = false;
          };
        }}
      >
        <div class="space-y-2">
          <Label for="email">Sähköposti</Label>
          <div class="relative">
            <Mail
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autocomplete="email"
              id="email"
              name="email"
              type="text"
              value={form?.email ?? data?.user?.user_metadata?.email ?? ''}
              placeholder="Sähköpostiosoite"
              class="pl-9"
              disabled
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="first_name">Nimi</Label>
          <div class="relative">
            <User
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              id="first_name"
              name="first_name"
              value={form?.first_name ?? data?.profile?.first_name ?? ''}
              placeholder="Etunimi"
              class="pl-9"
            />
          </div>
        </div>

        <Button class="w-full" {loading} type="submit">
          Tallenna
          <Save class="ml-2 h-4 w-4" />
        </Button>
      </form>

      <form action="/auth?/signout" method="POST">
        <Button variant="destructive" class="w-full" type="submit">
          Kirjaudu ulos
          <LogOut class="ml-2 h-4 w-4" />
        </Button>
      </form>
    </Card.Content>
  </Card.Root>
</div>
