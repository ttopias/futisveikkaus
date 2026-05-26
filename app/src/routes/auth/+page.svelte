<script lang="ts">
  import { page } from '$app/stores';
  import { logo } from '$lib/stores';
  import { fade } from 'svelte/transition';
  import type { ActionData } from './$types';
  import Frown from 'lucide-svelte/icons/frown';
  import * as Card from '$lib/components/ui/card';
  import { Alert } from '$lib/components/ui/alert';
  import Forgot from './Forgot.svelte';
  import Invite from './Invite.svelte';
  import Reset from './Reset.svelte';
  import SignIn from './SignIn.svelte';
  import SignUp from './SignUp.svelte';

  export let form: ActionData;

  let view = 'signin';

  $: {
    if ($page.url.searchParams.has('signin')) view = 'signin';
    if ($page.url.searchParams.has('signup')) view = 'signup';
    if ($page.url.searchParams.has('invite')) view = 'invite';
    if ($page.url.searchParams.has('forgot')) view = 'forgot';
    if ($page.url.searchParams.has('reset')) view = 'reset';
  }
</script>

<div in:fade class="mx-auto flex w-full max-w-md flex-col items-center py-4">
  <Card.Root class="w-full shadow-md">
    <Card.Content class="pt-6">
      {#if $logo}
        <a href="/" class="mb-6 block">
          <img class="mx-auto h-16 w-auto" alt="logo" src={$logo} />
        </a>
      {/if}

      {#if view == 'signin'}
        <SignIn {form} />
      {:else if view == 'signup'}
        <SignUp {form} />
      {:else if view == 'invite'}
        <Invite {form} />
      {:else if view == 'forgot'}
        <Forgot {form} />
      {:else if view == 'reset'}
        <Reset />
      {/if}

      {#if form?.error}
        <Alert variant="destructive" class="mt-4 flex items-center gap-2">
          <Frown class="h-4 w-4 shrink-0" />
          <span>{form.error}</span>
        </Alert>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
