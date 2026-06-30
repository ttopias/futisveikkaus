<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Match, Team } from '$lib/index';
  import { matchParticipant } from '$lib/match-participants';
  import { MATCH_STAGES, visibleStageLabelFi } from '$lib/stages';
  import type { MatchStage } from '$lib/stages';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import AdminNav from '$lib/components/admin/AdminNav.svelte';
  import { Alert } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
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
  $: matches = data?.matches ?? [];
  let teams: Team[] = data?.teams ?? [];

  let loading = false;
  let editingMatch: Match | null = null;
  let editOpen = false;
  let stageFilter = '';
  let statusFilter = '';

  $: filteredMatches = matches.filter((match) => {
    if (stageFilter && match.stage !== stageFilter) return false;
    if (statusFilter === 'finished' && !match.finished) return false;
    if (statusFilter === 'upcoming' && match.finished) return false;
    return true;
  });

  function toDatetimeLocal(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const stageOptions: { value: MatchStage; label: string }[] = MATCH_STAGES.map((stage) => ({
    value: stage,
    label: visibleStageLabelFi(stage),
  }));

  let editStartsAt = '';
  let editHomeGoals = 0;
  let editAwayGoals = 0;
  let editFinished = false;
  let editAdvancerId = '';

  $: needsAdvancerPick =
    Boolean(editingMatch) &&
    !editingMatch?.groupStage &&
    editFinished &&
    editHomeGoals === editAwayGoals;

  function openEditMatch(match: Match) {
    editingMatch = match;
    editStartsAt = toDatetimeLocal(match.starts_at);
    editHomeGoals = match.home_goals;
    editAwayGoals = match.away_goals;
    editFinished = match.finished;
    editAdvancerId = '';
    editOpen = true;
  }
</script>

<AdminNav />

{#if form?.success}
  <Alert class="mb-4">{form.success}</Alert>
{/if}
{#if form?.error}
  <Alert variant="destructive" class="mb-4">{form.error}</Alert>
{/if}

<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
  <div class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
    <div class="space-y-2">
      <Label for="stage-filter">Vaihe</Label>
      <Select id="stage-filter" bind:value={stageFilter}>
        <option value="">Kaikki</option>
        {#each stageOptions as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </Select>
    </div>
    <div class="space-y-2">
      <Label for="status-filter">Tila</Label>
      <Select id="status-filter" bind:value={statusFilter}>
        <option value="">Kaikki</option>
        <option value="upcoming">Tulossa / käynnissä</option>
        <option value="finished">Päättynyt</option>
      </Select>
    </div>
  </div>

  <Dialog.Root>
    <Dialog.Trigger class={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}>
      <Plus class="size-4" />
      Lisää ottelu
    </Dialog.Trigger>
    <Dialog.Content class="max-w-sm gap-4 sm:max-w-md">
      <Dialog.Header class="text-center sm:text-center">
        <Dialog.Title>Lisää ottelu</Dialog.Title>
        <Dialog.Description>Vain alkusarjan ottelut (home/away -joukkueet)</Dialog.Description>
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
          <Label for="match_number">Ottelunumero</Label>
          <Input id="match_number" name="match_number" type="number" min="1" required />
        </div>
        <div class="space-y-2">
          <Label for="starts_at">Alkaa</Label>
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
            <Label for="home_id">Koti</Label>
            <Select id="home_id" name="home_id" value={form?.home_id ?? ''}>
              <option value="" disabled selected>Valitse</option>
              {#each teams as team}
                <option value={team.team_id}>{team.name}</option>
              {/each}
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="away_id">Vieras</Label>
            <Select id="away_id" name="away_id" value={form?.away_id ?? ''}>
              <option value="" disabled selected>Valitse</option>
              {#each teams as team}
                <option value={team.team_id}>{team.name}</option>
              {/each}
            </Select>
          </div>
        </div>
        <Button class="w-full" {loading} type="submit">Lisää</Button>
      </form>
    </Dialog.Content>
  </Dialog.Root>
</div>

<p class="mb-3 text-sm text-muted-foreground">
  Näytetään {filteredMatches.length} / {matches.length} ottelua
</p>

<Dialog.Root
  bind:open={editOpen}
  onOpenChange={(open) => {
    if (!open) {
      editingMatch = null;
      editAdvancerId = '';
    }
  }}
>
  <Dialog.Content class="max-w-sm gap-4 sm:max-w-md">
    {#if editingMatch}
      <Dialog.Header>
        <Dialog.Title>Muokkaa ottelua #{editingMatch.match_number}</Dialog.Title>
        <Dialog.Description>
          {matchParticipant(editingMatch, 'home').name} – {matchParticipant(editingMatch, 'away')
            .name}
        </Dialog.Description>
      </Dialog.Header>
      <form
        method="POST"
        action="?/update"
        class="space-y-3"
        use:enhance={() => {
          loading = true;
          return async ({ result, update }) => {
            await update();
            loading = false;
            if (result.type === 'success') {
              editingMatch = null;
              editOpen = false;
              editAdvancerId = '';
            }
          };
        }}
      >
        <input type="hidden" name="match_id" value={editingMatch.match_id} />
        {#if editAdvancerId}
          <input type="hidden" name="advancer_team_id" value={editAdvancerId} />
        {/if}
        <div class="space-y-2">
          <Label for="edit-starts-at">Aloitusaika</Label>
          <Input
            id="edit-starts-at"
            name="starts_at"
            type="datetime-local"
            bind:value={editStartsAt}
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label for="edit-home-goals">Koti maalit</Label>
            <Input
              id="edit-home-goals"
              name="home_goals"
              type="number"
              min="0"
              bind:value={editHomeGoals}
            />
          </div>
          <div class="space-y-2">
            <Label for="edit-away-goals">Vieras maalit</Label>
            <Input
              id="edit-away-goals"
              name="away_goals"
              type="number"
              min="0"
              bind:value={editAwayGoals}
            />
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input
            name="finished"
            type="checkbox"
            value="true"
            bind:checked={editFinished}
            class="h-4 w-4 rounded border-input"
          />
          Ottelu päättynyt (laskee pisteet)
        </label>
        {#if needsAdvancerPick}
          <div class="grid grid-cols-1 gap-2">
            {#if editingMatch.home?.team_id}
              <Button
                type="button"
                variant={editAdvancerId === String(editingMatch.home.team_id) ? 'default' : 'outline'}
                class="h-auto justify-start gap-3 py-3"
                on:click={() => (editAdvancerId = String(editingMatch.home!.team_id))}
              >
                <TeamFlag
                  countryCode={editingMatch.home.country_code}
                  name={editingMatch.home.name}
                  width={28}
                  height={28}
                  class="h-7 w-7 rounded-full object-cover"
                />
                {editingMatch.home.name}
              </Button>
            {/if}
            {#if editingMatch.away?.team_id}
              <Button
                type="button"
                variant={editAdvancerId === String(editingMatch.away.team_id) ? 'default' : 'outline'}
                class="h-auto justify-start gap-3 py-3"
                on:click={() => (editAdvancerId = String(editingMatch.away!.team_id))}
              >
                <TeamFlag
                  countryCode={editingMatch.away.country_code}
                  name={editingMatch.away.name}
                  width={28}
                  height={28}
                  class="h-7 w-7 rounded-full object-cover"
                />
                {editingMatch.away.name}
              </Button>
            {/if}
          </div>
        {/if}
        <Button
          class="w-full"
          {loading}
          type="submit"
          disabled={needsAdvancerPick && !editAdvancerId}
        >
          Tallenna
        </Button>
      </form>
    {/if}
  </Dialog.Content>
</Dialog.Root>

{#if filteredMatches.length === 0}
  <p class="text-center text-muted-foreground">Ei otteluita valituilla suodattimilla</p>
{:else}
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each filteredMatches as match}
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
              #{match.match_number} · {new Date(match.starts_at).toLocaleString('fi-FI')}
            </p>
            {#if match.finished}
              <Badge variant="secondary" class="mt-1">Päättynyt</Badge>
            {/if}
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Button variant="ghost" size="icon" type="button" aria-label="Ottelutoiminnot">
                <MoreHorizontal class="size-4" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item on:click={() => openEditMatch(match)}>
                <Pencil class="mr-2 size-4" />
                Muokkaa
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
                    Poista
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
