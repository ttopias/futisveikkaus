<script lang="ts">
  import { enhance } from '$app/forms';
  import { SaveIcon } from 'svelte-feather-icons';
  import type { ActionData, PageData } from './$types';
  import { LogOutIcon } from 'svelte-feather-icons';

  export let data: PageData;
  export let form: ActionData;
  let loading = false;
</script>

<div class="glass my-4 p-4 border-inherit shadow-lg rounded-xl">
  <form
    id="edit"
    class="w-full max-w-sm"
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
    <h1 class="text-2xl font-semibold text-center my-4 min-w-96">Käyttäjätiedot</h1>
    <div class="form-control">
      <div class="text-sm text-accent-content mt-2">Sähköposti</div>
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
          type="text"
          value={form?.email ?? data?.user?.user_metadata?.email ?? ''}
          placeholder="Sähköpostiosoite"
          class="input grow text-xl"
          disabled
        />
      </label>

      <div class="text-sm text-accent-content mt-2">Nimi</div>
      <label class="input input-bordered flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          class="w-4 h-4 opacity-70"
          ><path
            d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z"
          /></svg
        >
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={form?.first_name ?? data?.user?.user_metadata?.first_name ?? ''}
          placeholder="Etunimi"
          class="input grow text-xl"
        />
      </label>
    </div>

    <div class="form-control mt-8 mb-4">
      <button class="btn btn-primary justify-between" class:loading type="submit"
        >TALLENNA <SaveIcon class="ml-4" /></button
      >
    </div>
  </form>

  <form action="/auth?/signout" method="POST" class="w-full max-w-sm">
    <button type="submit" class="btn btn-error w-full max-w-sm justify-between">
      KIRJAUDU ULOS<LogOutIcon class="ml-4" />
    </button>
  </form>
</div>
