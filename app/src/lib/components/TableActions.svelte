<script lang="ts">
  import { EditIcon, TrashIcon } from 'svelte-feather-icons';

  export let row: any;
</script>

<div class="flex justify-center text-left space-x-2">
  <form action="/admin/users?/update" method="POST" class="block px-4 py-2 text-sm">
    <button
      on:click|preventDefault={() => console.log('edit', row)}
      class="btn btn-sm btn-circle btn-ghost btn-primary"
    >
      <EditIcon class="" />
    </button>
  </form>
  <form action="/admin/users?/delete" method="POST" class="block px-4 py-2 text-sm">
    <button
      on:click|preventDefault={() => console.log('delete', row)}
      class="btn btn-sm btn-circle btn-ghost btn-error"
    >
      <TrashIcon class="stroke-error" />
    </button>
  </form>
</div>
