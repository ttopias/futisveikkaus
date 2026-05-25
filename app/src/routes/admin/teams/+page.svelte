<script lang="ts">
  import { enhance } from '$app/forms';
  import AdminNav from '$lib/components/admin/AdminNav.svelte';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Alert } from '$lib/components/ui/alert';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { cn } from '$lib/utils';
  import type { ActionData, PageData } from './$types';
  import Plus from 'lucide-svelte/icons/plus';
  import Settings from 'lucide-svelte/icons/settings';

  export let data: PageData;
  export let form: ActionData;
  let loading = false;

  function formField(key: string): string {
    const f = form as Record<string, string | undefined> | null | undefined;
    return f?.[key] ?? '';
  }
</script>

<AdminNav />

<Dialog.Root>
  <Dialog.Trigger class={cn(buttonVariants(), 'mb-4')}>
    <Plus class="size-4" />
    Add team
  </Dialog.Trigger>
  <Dialog.Content class="max-w-sm gap-4 sm:max-w-md">
    <Dialog.Header class="text-center sm:text-center">
      <Dialog.Title>Add team</Dialog.Title>
    </Dialog.Header>
    <form
      method="POST"
      action="?/create"
      class="space-y-4"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          update();
          loading = false;
        };
      }}
    >
      {#if form?.error}
        <Alert variant="destructive">{form.error}</Alert>
      {/if}

      <div class="space-y-2">
        <Label for="country_code">ISO 3166 code</Label>
        <Input
          id="country_code"
          name="country_code"
          placeholder="de"
          value={formField('country_code')}
        />
      </div>
      <div class="space-y-2">
        <Label for="name">Name</Label>
        <Input id="name" name="name" placeholder="Germany" value={formField('name')} />
      </div>
      <div class="space-y-2">
        <Label for="group">Group</Label>
        <Input id="group" name="group" placeholder="A" value={formField('group')} />
      </div>

      <Button class="w-full" {loading} type="submit">Add team</Button>
    </form>
  </Dialog.Content>
</Dialog.Root>

{#if !data?.teams || Object.keys(data?.teams).length === 0}
  <p class="text-muted-foreground">No teams found</p>
{:else}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each Object.keys(data?.teams) as group}
      <Card.Root class="shadow-sm">
        <Card.Header>
          <Card.Title class="text-center text-base">Lohko {group}</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-2">
          {#each data?.teams[group] as team}
            <Dialog.Root>
              <Dialog.Trigger
                class="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <TeamFlag
                  countryCode={team.country_code}
                  name={team.name}
                  class="h-5 w-8 object-cover"
                />
                <span class="min-w-0 flex-1 truncate">{team.name}</span>
                <Settings class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Dialog.Trigger>
              <Dialog.Content class="max-w-sm gap-4 sm:max-w-md">
                <form
                  method="POST"
                  action="?/update"
                  class="space-y-3"
                  use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                      update();
                      loading = false;
                    };
                  }}
                >
                  {#if form?.error}
                    <Alert variant="destructive">{form.error}</Alert>
                  {/if}
                  <input type="hidden" name="team_id" value={team?.team_id} />

                  <div class="space-y-2">
                    <Label>Country code</Label>
                    <Input
                      name="country_code"
                      value={formField('country_code') || team.country_code}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label>Name</Label>
                    <Input name="name" value={formField('name') || team?.name} />
                  </div>
                  <div class="space-y-2">
                    <Label>Group</Label>
                    <Input name="group" value={formField('group') || team?.group} />
                  </div>
                  <div class="space-y-2">
                    <Label for="fifa_rank_{team.team_id}">FIFA-sijoitus</Label>
                    <Input
                      id="fifa_rank_{team.team_id}"
                      name="fifa_rank"
                      type="number"
                      min="1"
                      placeholder="Tyhjä = ei sijoitusta"
                      value={team.fifa_rank ?? ''}
                    />
                  </div>

                  <p class="text-xs text-muted-foreground">
                    {team.win}W {team.draw}D {team.loss}L · {team.gf}–{team.gaa}
                    <span class="block">(lasketaan otteluista)</span>
                  </p>

                  <Button class="w-full" {loading} type="submit">Update team</Button>
                </form>
              </Dialog.Content>
            </Dialog.Root>
          {/each}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
