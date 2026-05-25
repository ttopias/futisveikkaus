<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';
  import AdminNav from '$lib/components/admin/AdminNav.svelte';
  import { Alert } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select } from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import * as Dialog from '$lib/components/ui/dialog';
  import Pencil from 'lucide-svelte/icons/pencil';

  export let data: PageData;
  export let form: ActionData;

  let loading = false;
  let editUser: PageData['users'][number] | null = null;
  let editOpen = false;
</script>

<AdminNav />

{#if form?.success}
  <Alert class="mb-4">{form.success}</Alert>
{/if}
{#if form?.error}
  <Alert variant="destructive" class="mb-4">{form.error}</Alert>
{/if}

<Card.Root class="overflow-hidden shadow-sm">
  <ScrollArea.Root orientation="horizontal">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Nimi</Table.Head>
          <Table.Head>Sähköposti</Table.Head>
          <Table.Head>Rooli</Table.Head>
          <Table.Head class="text-right">Pisteet</Table.Head>
          <Table.Head class="w-24" />
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each data.users as row (row.id)}
          <Table.Row>
            <Table.Cell class="font-medium">{row.first_name}</Table.Cell>
            <Table.Cell class="text-muted-foreground">{row.email ?? '—'}</Table.Cell>
            <Table.Cell>
              {#if row.role === 'admin'}
                <Badge>Ylläpitäjä</Badge>
              {:else}
                <span class="text-sm text-muted-foreground">Käyttäjä</span>
              {/if}
            </Table.Cell>
            <Table.Cell class="text-right tabular-nums">{row.total_points}</Table.Cell>
            <Table.Cell>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                on:click={() => {
                  editUser = row;
                  editOpen = true;
                }}
              >
                <Pencil class="mr-1 size-4" />
                Muokkaa
              </Button>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </ScrollArea.Root>
</Card.Root>

<Dialog.Root
  bind:open={editOpen}
  onOpenChange={(open) => {
    if (!open) editUser = null;
  }}
>
  <Dialog.Content class="max-w-sm gap-4 sm:max-w-md">
    {#if editUser}
      <Dialog.Header>
        <Dialog.Title>Muokkaa käyttäjää</Dialog.Title>
        <Dialog.Description>{editUser.email ?? editUser.id}</Dialog.Description>
      </Dialog.Header>

      <form
        method="POST"
        action="?/updateName"
        class="space-y-3"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
      >
        <input type="hidden" name="user_id" value={editUser.id} />
        <div class="space-y-2">
          <Label for="first_name">Näyttönimi</Label>
          <Input
            id="first_name"
            name="first_name"
            value={form?.first_name ?? editUser.first_name}
            required
            maxlength={64}
          />
        </div>
        <Button type="submit" class="w-full" {loading}>Tallenna nimi</Button>
      </form>

      <form
        method="POST"
        action="?/updateRole"
        class="space-y-3 border-t border-border pt-4"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
          };
        }}
      >
        <input type="hidden" name="user_id" value={editUser.id} />
        <div class="space-y-2">
          <Label for="role">Rooli</Label>
          <Select id="role" name="role" value={form?.role ?? editUser.role}>
            <option value="user">Käyttäjä</option>
            <option value="admin">Ylläpitäjä</option>
          </Select>
        </div>
        {#if editUser.id === data.currentUserId}
          <p class="text-xs text-muted-foreground">Et voi poistaa omaa ylläpitäjärooliasi.</p>
        {/if}
        <Button
          type="submit"
          variant="secondary"
          class="w-full"
          {loading}
          disabled={editUser.id === data.currentUserId && editUser.role === 'admin'}
        >
          Tallenna rooli
        </Button>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>
