<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import { EyeIcon, EyeOffIcon } from 'svelte-feather-icons';

  export let form: ActionData;
  let loading = false;
  let disabled = true;

  let password = '';
  let password2 = '';
  let showPassword = false;

  $: type = showPassword ? 'text' : 'password';

  $: {
    if (password == password2) {
      disabled = false;
    } else {
      disabled = true;
    }
  }
</script>

<div class="card-body mb-10 text-primary-content">
  <h1 class="text-center text-4xl mb-6">Rekisteröidy</h1>

  <form
    method="POST"
    action="/auth?/signup"
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
          class="w-4 h-4 opacity-70 fill-white"
          ><path
            d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z"
          /><path
            d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z"
          /></svg
        >
        <input
          id="email"
          name="email"
          class="grow text-slate-300"
          type="email"
          placeholder="email@esimerkki.com"
          value={form?.email ?? ''}
          required
        />
      </label>

      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          class="w-4 h-4 opacity-70 fill-white"
          ><path
            d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"
          /></svg
        >
        <input
          id="first_name"
          name="first_name"
          class="grow text-slate-300"
          type="text"
          placeholder="Etunimi"
          value={form?.first_name ?? ''}
          required
        />
      </label>

      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          class="w-4 h-4 opacity-70 fill-white"
          ><path
            fill-rule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clip-rule="evenodd"
          /></svg
        >
        <input
          id="password"
          name="password"
          class="grow text-slate-300"
          {...{ type }}
          bind:value={password}
          placeholder="Salasana"
          required
        />
      </label>

      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          class="w-4 h-4 opacity-70 fill-white"
          ><path
            fill-rule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clip-rule="evenodd"
          /></svg
        >
        <input
          id="password"
          name="password"
          class="grow text-slate-300"
          {...{ type }}
          bind:value={password2}
          placeholder="Vahvista salasana"
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
      <button class:btn-disabled={disabled} class="btn btn-primary" class:loading
        >Rekisteröidy</button
      >
    </div>

    <div class="text-md text-primary-content text-center">
      <a class="link no-underline" href="?signin">Löytyykö tunnus? Kirjaudu sisään</a>
    </div>
  </form>
</div>
