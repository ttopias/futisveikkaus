<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { EyeIcon, EyeOffIcon } from 'svelte-feather-icons';

  export let form: ActionData;
  let loading = false;
  let showPassword = false;
  $: type = showPassword ? 'text' : 'password';
</script>

<div class="card-body">
  <h1 class="text-center text-4xl mb-6">Sign In</h1>
  <form
    method="POST"
    action="/auth?/signin"
    use:enhance={() => {
      loading = true;
      return async ({ result, update }) => {
        update();
        if (result.type == 'failure') {
          loading = false;
        }
      };
    }}
  >
    <div class="form-control">
      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          class="w-4 h-4 opacity-70"
          ><path
            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"
          /><path
            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"
          /></svg
        >
        <input
          autocomplete="email"
          id="email"
          name="email"
          value={form?.email ?? ''}
          class="grow"
          type="email"
          placeholder="email@example.com"
          required
        />
      </label>

      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          class="w-4 h-4 opacity-70"
          ><path
            fill-rule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clip-rule="evenodd"
          /></svg
        >
        <input
          autocomplete="current-password"
          id="password"
          name="password"
          class="grow"
          {...{ type }}
          placeholder="Password"
          required
        />
        <kbd class="kbd kbd-sm">
          <button
            on:click={() => (showPassword = !showPassword)}
            aria-label="Toggle password visibility"
            tabindex="0"
          >
            {#if showPassword}
              <EyeOffIcon />
            {:else}
              <EyeIcon />
            {/if}
          </button>
        </kbd>
      </label>
    </div>

    <div class="form-control mt-4 mb-4">
      <button class="btn btn-primary" class:loading>Sign In</button>
    </div>

    <div class="text-sm text-primary text-center">
      <a class="link no-underline" href="?signup">Don't have an account? Sign-Up</a>
    </div>

    <div class="text-sm text-primary text-center">
      <a class="link no-underline" href="?forgot">Forgot password?</a>
    </div>
  </form>
</div>
