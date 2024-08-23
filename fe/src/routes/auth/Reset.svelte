<script lang="ts">
  import { enhance } from '$app/forms';

  let loading = false;
  let disabled = true;

  let password = '';
  let password2 = '';

  $: {
    if (password == password2) {
      disabled = false;
    } else {
      disabled = true;
    }
  }
</script>

<div class="card-body">
  <h1 class="text-center text-4xl mb-6">Nollaa salasana</h1>

  <form
    method="POST"
    action="/auth?/reset"
    use:enhance={() => {
      loading = true;
      return async ({ result, update }) => {
        update();
        // console.log(result);
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
            fill-rule="evenodd"
            d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
            clip-rule="evenodd"
          /></svg
        >
        <input
          id="password"
          name="password"
          class="grow text-slate-300"
          type="password"
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
          type="password"
          bind:value={password2}
          placeholder="Vahvista salasana"
          required
        />
      </label>

      <div class="form-control mt-6">
        <button class="btn btn-primary" class:loading> NOLLAA SALASANA </button>
      </div>
    </div>
  </form>
</div>
