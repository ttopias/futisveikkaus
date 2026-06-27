<script lang="ts">
  import { fade } from 'svelte/transition';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { ActionData, PageData } from './$types';
  import Time from 'svelte-time';
  import { matchParticipant } from '$lib/match-participants';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Select } from '$lib/components/ui/select';
  import { Alert } from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import type { Prediction } from '$lib';
  import Pencil from 'lucide-svelte/icons/pencil';
  import Save from 'lucide-svelte/icons/save';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import Trash2 from 'lucide-svelte/icons/trash-2';

  export let data: PageData;
  export let form: ActionData;

  let predictableMatches: Match[] = [];
  let groupFilter = '';
  let uniqueGroups = new Set(data?.predictions.map((p) => p.group));
  let matches: Prediction[] = [];
  let loading = false;
  let view = 'create';

  $: stagePredictable = data?.stagePredictable ?? false;
  $: if (data?.predictableMatches) {
    predictableMatches = data.predictableMatches;
  }
  $: slides = stagePredictable ? predictableMatches : [];

  $: {
    if ($page.url.searchParams.has('create')) view = 'create';
    if ($page.url.searchParams.has('edit')) {
      view = 'edit';
      matches = data?.predictions.filter((prediction) => {
        if (groupFilter) return prediction.group === groupFilter;
        return true;
      });
    }
  }
</script>

<div in:fade class="mx-auto w-full max-w-lg">
  {#if view == 'create'}
    <div class="mb-4 flex justify-end">
      <Button href="?edit" variant="outline" class="gap-2">
        <Pencil class="size-4" />
        Muokkaa arvauksia
      </Button>
    </div>

    {#if !slides || slides.length === 0}
      <p class="text-center text-muted-foreground">Ei enää veikattavia otteluita.</p>
    {:else}
      {#await import('./PredictionsMatchCarousel.svelte') then { default: PredictionsMatchCarousel }}
        <PredictionsMatchCarousel
          {slides}
          {form}
          {stagePredictable}
          bind:loading
          bind:predictableMatches
          stageFirstKickoff={data.stageFirstKickoff}
        />
      {/await}
    {/if}
  {:else if view == 'edit'}
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button href="?create" variant="outline" class="w-full gap-2 sm:w-auto">
        <ArrowLeft class="size-4" />
        Takaisin
      </Button>
      <Select class="w-full sm:w-48" bind:value={groupFilter}>
        <option value="">Kaikki</option>
        {#each Array.from(uniqueGroups) as group}
          <option value={group}>{group}</option>
        {/each}
      </Select>
    </div>

    {#if !matches || matches.length === 0}
      <p class="text-center text-muted-foreground">Et ole vielä luonut veikkauksia</p>
    {:else}
      <div class="space-y-4">
        {#if groupFilter}
          <h2 class="text-center text-lg font-semibold">Lohko {groupFilter} ottelut</h2>
        {/if}

        {#each matches as prediction}
          <Card.Root class="shadow-sm">
            <Card.Header class="text-center">
              <Card.Title class="text-lg">
                {#if prediction?.groupStage}
                  Lohko {prediction?.group}
                {:else}
                  {prediction?.group}
                {/if}
              </Card.Title>
              <p class="text-sm text-muted-foreground">
                <Time timestamp={prediction.match?.starts_at} format="DD.MM.YYYY HH:mm" />
              </p>
            </Card.Header>
            <Card.Content class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col items-center gap-3 text-center">
                  <TeamFlag
                    countryCode={matchParticipant(prediction.match, 'home').country_code}
                    name={matchParticipant(prediction.match, 'home').name}
                    class="h-16 w-auto max-w-full rounded-md"
                  />
                  <span class="w-full text-xs font-medium"
                    >{matchParticipant(prediction.match, 'home').name}</span
                  >
                  <Input
                    form="update-{prediction.guess_id}"
                    name="home_goals"
                    type="number"
                    min="0"
                    class="text-center"
                    value={prediction?.home_goals ?? 0}
                  />
                </div>
                <div class="flex flex-col items-center gap-3 text-center">
                  <TeamFlag
                    countryCode={matchParticipant(prediction.match, 'away').country_code}
                    name={matchParticipant(prediction.match, 'away').name}
                    class="h-16 w-auto max-w-full rounded-md"
                  />
                  <span class="w-full text-xs font-medium"
                    >{matchParticipant(prediction.match, 'away').name}</span
                  >
                  <Input
                    form="update-{prediction.guess_id}"
                    name="away_goals"
                    type="number"
                    min="0"
                    class="text-center"
                    value={prediction?.away_goals ?? 0}
                  />
                </div>
              </div>

              <div class="flex gap-2">
                <form
                  class="w-1/3"
                  method="POST"
                  action="?/delete"
                  use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                      update();
                      loading = false;
                      matches = matches.filter((p) => p.guess_id !== prediction.guess_id);
                    };
                  }}
                >
                  <input type="hidden" name="guess_id" value={prediction.guess_id} />
                  <Button
                    variant="destructive"
                    class="w-full gap-2"
                    type="submit"
                    disabled={!stagePredictable}
                  >
                    <Trash2 class="size-4" />
                    Poista
                  </Button>
                </form>
                <form
                  id="update-{prediction.guess_id}"
                  class="w-2/3"
                  method="POST"
                  action="?/update"
                  use:enhance={() => {
                    loading = true;
                    return async ({ update }) => {
                      update();
                      loading = false;
                    };
                  }}
                >
                  <input type="hidden" name="guess_id" value={prediction.guess_id} />
                  <Button class="w-full gap-2" {loading} type="submit" disabled={!stagePredictable}>
                    <Save class="size-4" />
                    Tallenna
                  </Button>
                </form>
              </div>

              {#if form?.message && !form?.success}
                <Alert variant="destructive">{form.message}</Alert>
              {/if}
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    {/if}
  {/if}
</div>
