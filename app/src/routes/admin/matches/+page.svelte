<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Match, Team } from '$lib/index';
  import { matchParticipant } from '$lib/match-participants';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Button, buttonVariants } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select } from '$lib/components/ui/select';
  import * as Card from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { cn } from '$lib/utils';
  import type { ActionData, PageData } from './$types';
  import Plus from 'lucide-svelte/icons/plus';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import MoreHorizontal from 'lucide-svelte/icons/more-horizontal';

  export let data: PageData;
  export let form: ActionData;
  let matches: Match[] = data?.matches ?? [];
  let teams: Team[] = data?.teams ?? [];
  let loading = false;
  let editingMatch: Match | null = null;
  let editOpen = false;

  function toDatetimeLocal(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
</script>

<div class="mx-auto w-full min-w-0 lg:max-w-6xl">
  <Dialog.Root>
    <Dialog.Trigger class={cn(buttonVariants(), 'mb-4')}>
      <Plus class="size-4" />
      Add match
    </Dialog.Trigger>
    <Dialog.Content class="max-w-sm gap-4 sm:max-w-md">
      <Dialog.Header class="text-center sm:text-center">
        <Dialog.Title>Add match</Dialog.Title>
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
        <div class="space-y-2">
          <Label for="starts_at">Kickoff</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            value={toDatetimeLocal(form?.starts_at) ?? ''}
            required
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="home_id">Home</Label>
            <Select id="home_id" name="home_id" value={form?.home_id ?? ''}>
              <option value="" disabled selected>Home</option>
              {#each teams as team}
                <option value={team.team_id}>{team.name}</option>
              {/each}
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="away_id">Away</Label>
            <Select id="away_id" name="away_id" value={form?.away_id ?? ''}>
              <option value="" disabled selected>Away</option>
              {#each teams as team}
                <option value={team.team_id}>{team.name}</option>
              {/each}
            </Select>
          </div>
        </div>

        <Button class="w-full" {loading} type="submit">Add match</Button>
      </form>
    </Dialog.Content>
  </Dialog.Root>

  <Dialog.Root
    bind:open={editOpen}
    onOpenChange={(open) => {
      if (!open) editingMatch = null;
    }}
  >
    <Dialog.Content class="max-w-sm gap-4 sm:max-w-md">
      {#if editingMatch}
        <Dialog.Header>
          <Dialog.Title>Edit match</Dialog.Title>
        </Dialog.Header>
        <form
          method="POST"
          action="?/update"
          class="space-y-3"
          use:enhance={() => {
            loading = true;
            return async ({ update }) => {
              update();
              loading = false;
              editingMatch = null;
              editOpen = false;
            };
          }}
        >
          <input type="hidden" name="match_id" value={editingMatch.match_id} />
          <div class="space-y-2">
            <Label>Kickoff</Label>
            <Input
              name="starts_at"
              type="datetime-local"
              value={toDatetimeLocal(form?.starts_at ?? editingMatch?.starts_at)}
            />
          </div>
          <div class="space-y-2">
            <Label>Home goals</Label>
            <Input
              name="home_goals"
              type="number"
              value={form?.home_goals ?? editingMatch?.home_goals}
            />
          </div>
          <div class="space-y-2">
            <Label>Away goals</Label>
            <Input
              name="away_goals"
              type="number"
              value={form?.away_goals ?? editingMatch?.away_goals}
            />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input
              name="finished"
              type="checkbox"
              value="true"
              checked={form?.finished ?? editingMatch?.finished ?? false}
              class="h-4 w-4 rounded border-input"
            />
            Finished
          </label>
          <Button class="w-full" {loading} type="submit">Update match</Button>
        </form>
      {/if}
    </Dialog.Content>
  </Dialog.Root>

  {#if !matches || matches.length === 0}
    <p class="text-center text-muted-foreground">No matches found</p>
  {:else}
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each matches as match}
        <Card.Root class="shadow-sm">
          <Card.Header class="flex flex-row items-start justify-between gap-2 pb-2">
            <div class="min-w-0 flex-1 text-center">
              <Card.Title class="text-base">
                {#if match?.groupStage}
                  Lohko {match.group}
                {:else}
                  {match.group}
                {/if}
              </Card.Title>
              <p class="text-sm text-muted-foreground">
                {new Date(match.starts_at).toLocaleString('fi-FI')}
              </p>
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost" size="icon" type="button" aria-label="Match actions">
                  <MoreHorizontal class="size-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item
                  on:click={() => {
                    editingMatch = match;
                    editOpen = true;
                  }}
                >
                  <Pencil class="mr-2 size-4" />
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item class="text-destructive focus:text-destructive">
                  <form
                    method="POST"
                    action="?/delete"
                    class="w-full"
                    use:enhance={() => {
                      loading = true;
                      return async ({ update }) => {
                        update();
                        loading = false;
                      };
                    }}
                  >
                    <input type="hidden" name="match_id" value={match.match_id} />
                    <button type="submit" class="flex w-full items-center gap-2">
                      <Trash2 class="size-4" />
                      Delete
                    </button>
                  </form>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Card.Header>
          <Card.Content class="space-y-3">
            <div class="flex items-center justify-between gap-2 text-sm">
              <div class="flex items-center gap-2">
                <TeamFlag
                  countryCode={matchParticipant(match, 'home').country_code}
                  name={matchParticipant(match, 'home').name}
                  width={28}
                  height={28}
                  class="h-7 w-7 rounded-full object-cover"
                />
                <span>{matchParticipant(match, 'home').name}</span>
              </div>
              <span class="font-bold tabular-nums">
                {#if match?.finished}
                  {match.home_goals} – {match.away_goals}
                {:else}
                  – : –
                {/if}
              </span>
              <div class="flex items-center gap-2">
                <span>{matchParticipant(match, 'away').name}</span>
                <TeamFlag
                  countryCode={matchParticipant(match, 'away').country_code}
                  name={matchParticipant(match, 'away').name}
                  width={28}
                  height={28}
                  class="h-7 w-7 rounded-full object-cover"
                />
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
