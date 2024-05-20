<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let profileForm: HTMLFormElement;
  let loading = false;
  let name: string = data?.user?.user_metadata?.name ?? '';

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async () => {
      loading = false;
    };
  };

  const handleSignOut: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      loading = false;
      update();
    };
  };
</script>

<div class="form-widget">
  <form
    class="form-control"
    method="post"
    action="?/update"
    use:enhance={handleSubmit}
    bind:this={profileForm}
  >
    <label class="input input-bordered flex items-center gap-2">
      <input
        class="grow"
        id="email"
        placeholder="Sähköpostiosoite"
        type="text"
        value={data?.user?.email}
        disabled
      />
    </label>

    <label class="input input-bordered flex items-center gap-2">
      <input id="name" name="name" placeholder="Nimi" type="text" value={form?.name ?? name} />
    </label>

    <div>
      <input
        type="submit"
        class="btn block primary"
        value={loading ? 'Loading...' : 'Update'}
        disabled={loading}
      />
    </div>
  </form>

  <form method="post" action="?/signout" use:enhance={handleSignOut}>
    <div>
      <button class="btn block" disabled={loading}>Sign Out</button>
    </div>
  </form>
</div>
