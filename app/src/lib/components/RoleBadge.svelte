<script lang="ts">
  export let row;
  const role = row.app_metadata?.role ?? 'user';
</script>

<div class="badge" class:badge-secondary={role === 'user'} class:badge-warning={role === 'admin'}>
  {role}
</div>
