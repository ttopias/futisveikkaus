<script lang="ts">
  import { page } from '$app/stores';
  import { logo } from '$lib/stores';
  import { fade } from 'svelte/transition';
  import type { ActionData } from './$types';
  import { FrownIcon } from 'svelte-feather-icons';
  import Forgot from './Forgot.svelte';
  import Invite from './Invite.svelte';
  import Reset from './Reset.svelte';
  import SignIn from './SignIn.svelte';
  import SignUp from './SignUp.svelte';

  export let form: ActionData;

  let view = 'signin';

  $: {
    if ($page.url.searchParams.has('signin')) {
      view = 'signin';
    }
    if ($page.url.searchParams.has('signup')) {
      view = 'signup';
    }
    if ($page.url.searchParams.has('invite')) {
      view = 'invite';
    }
    if ($page.url.searchParams.has('forgot')) {
      view = 'forgot';
    }
    if ($page.url.searchParams.has('reset')) {
      view = 'reset';
    }
  }
</script>

<div in:fade class="glass flex my-8 rounded-btn shadow-lg">
  <div class="flex my-auto w-1/2">
    <div>
      <div class="card w-full max-w-sm shadow-2xl">
        {#if $logo}
          <a href="/"><img class="mx-12 mt-10" alt="logo" src={$logo} /></a>
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
      </div>

      {#if form?.error}
        <div in:fade class="alert alert-error shadow-lg">
          <div>
            <FrownIcon />
            <span>{form?.error}</span>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
