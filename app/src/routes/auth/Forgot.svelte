<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
  let loading = false;
</script>

<div class="card-body min-w-96">
  <h1 class="text-center text-4xl mb-6">Unohtuiko salasana?</h1>

  <form
    method="POST"
    action="/auth?/forgot"
    use:enhance={() => {
      loading = true;
      return async ({ result, update }) => {
        update();
        if (result.type == 'failure') {
          loading = false;
        }
        loading = false;
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
          autocomplete="email"
          id="email"
          name="email"
          class="grow text-slate-300"
          type="email"
          placeholder="email@esimerkki.com"
          value={form?.email ?? ''}
          required
        />
      </label>
    </div>

    <div class="form-control mt-4">
      <button class="btn btn-primary" class:loading>NOLLAA SALASANA</button>
    </div>
  </form>
</div>
