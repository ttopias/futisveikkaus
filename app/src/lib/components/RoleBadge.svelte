<script lang="ts">
  export let row;
  const role = row.user_metadata.role;
</script>

<div class="badge" class:badge-secondary={role === 'user'} class:badge-warning={role === 'admin'}>
  {role}
</div>
