<script lang="ts">
  import { fade } from 'svelte/transition';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { ActionData, PageData } from './$types';
  import Time from 'svelte-time';
  import { isMatchPredictable } from '$lib/stages';
  import { matchParticipant } from '$lib/match-participants';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Select } from '$lib/components/ui/select';
  import { Alert } from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import * as Carousel from '$lib/components/ui/carousel';
  import { onDestroy } from 'svelte';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context';
  import type { Prediction } from '$lib';
  import Save from 'lucide-svelte/icons/save';
  import Pencil from 'lucide-svelte/icons/pencil';
  import ArrowLeft from 'lucide-svelte/icons/arrow-left';
  import Trash2 from 'lucide-svelte/icons/trash-2';

  export let data: PageData;
  export let form: ActionData;

  let predictableMatches = data?.predictableMatches || [];
  let groupFilter = '';
  let uniqueGroups = new Set(data?.predictions.map((p) => p.group));
  let matches: Prediction[] = [];
  let loading = false;
  let view = 'create';
  let carouselApi: CarouselAPI | undefined;
  let slideIndex = 0;
  let detachCarousel: (() => void) | undefined;

  $: slides = predictableMatches.filter((match) => isMatchPredictable(match));

  $: if (carouselApi && slideIndex >= slides.length) {
    carouselApi.scrollTo(Math.max(0, slides.length - 1), true);
  }

  $: {
    detachCarousel?.();
    detachCarousel = undefined;
    if (carouselApi) {
      const onSelect = () => {
        slideIndex = carouselApi?.selectedScrollSnap() ?? 0;
      };
      carouselApi.on('select', onSelect);
      carouselApi.on('reInit', onSelect);
      onSelect();
      detachCarousel = () => {
        carouselApi?.off('select', onSelect);
        carouselApi?.off('reInit', onSelect);
      };
    }
  }

  onDestroy(() => detachCarousel?.());

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
      <Card.Root class="relative shadow-md">
        <Carousel.Root bind:api={carouselApi} class="w-full">
          <Carousel.Content>
            {#each slides as match (match.match_id)}
              <Carousel.Item>
                <form
                  method="POST"
                  action="?/create"
                  use:enhance={() => {
                    loading = true;
                    return async ({ result, update }) => {
                      update();
                      loading = false;
                      if (result.status === 200) {
                        predictableMatches = predictableMatches.filter(
                          (m) => m.match_id !== match.match_id,
                        );
                      }
                    };
                  }}
                >
                  <Card.Header class="text-center">
                    <Card.Title class="text-lg">
                      {#if match?.groupStage}
                        Lohko {match?.group}
                      {:else}
                        {match?.group}
                      {/if}
                    </Card.Title>
                    <p class="text-sm text-muted-foreground">
                      <Time timestamp={match?.starts_at} format="DD.MM.YYYY HH:mm" />
                    </p>
                  </Card.Header>

                  <Card.Content class="space-y-4">
                    <input type="hidden" name="match_id" value={match.match_id} />

                    <div class="grid grid-cols-2 gap-4">
                      <div class="flex flex-col items-center gap-3 text-center">
                        <TeamFlag
                          countryCode={matchParticipant(match, 'home').country_code}
                          name={matchParticipant(match, 'home').name}
                          class="h-16 w-auto max-w-full rounded-md"
                        />
                        <Label class="w-full text-xs" for="home_goals-{match.match_id}">
                          {matchParticipant(match, 'home').name}
                        </Label>
                        <Input
                          id="home_goals-{match.match_id}"
                          name="home_goals"
                          placeholder="0"
                          pattern="[0-9]*"
                          type="number"
                          min="0"
                          class="text-center"
                          value={form?.home_goals ?? ''}
                        />
                      </div>

                      <div class="flex flex-col items-center gap-3 text-center">
                        <TeamFlag
                          countryCode={matchParticipant(match, 'away').country_code}
                          name={matchParticipant(match, 'away').name}
                          class="h-16 w-auto max-w-full rounded-md"
                        />
                        <Label class="w-full text-xs" for="away_goals-{match.match_id}">
                          {matchParticipant(match, 'away').name}
                        </Label>
                        <Input
                          id="away_goals-{match.match_id}"
                          name="away_goals"
                          placeholder="0"
                          pattern="[0-9]*"
                          type="number"
                          min="0"
                          class="text-center"
                          value={form?.away_goals ?? ''}
                        />
                      </div>
                    </div>

                    <Button class="w-full gap-2" {loading} type="submit">
                      <Save class="size-4" />
                      Tallenna
                    </Button>

                    {#if form?.message && !form?.success}
                      <Alert variant="destructive">{form.message}</Alert>
                    {/if}
                  </Card.Content>
                </form>
              </Carousel.Item>
            {/each}
          </Carousel.Content>

          {#if slides.length > 1}
            <Card.Footer class="justify-between pb-6 pt-2">
              <Carousel.Previous
                class="static h-9 w-9 translate-x-0 translate-y-0 disabled:opacity-40"
              />
              <span class="text-sm text-muted-foreground">
                {slideIndex + 1} / {slides.length}
              </span>
              <Carousel.Next
                class="static h-9 w-9 translate-x-0 translate-y-0 disabled:opacity-40"
              />
            </Card.Footer>
          {/if}
        </Carousel.Root>
      </Card.Root>

      {#if data.tournamentStartsAt && new Date() < new Date(data.tournamentStartsAt)}
        <p class="mt-4 text-center text-sm text-muted-foreground">
          Alkusarjan otteluiden arvausaika päättyy
          <Time timestamp={data.tournamentStartsAt} format="DD.MM.YYYY kello HH:mm" />.
        </p>
      {/if}
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
                    disabled={!isMatchPredictable(prediction.match)}
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
                  <Button
                    class="w-full gap-2"
                    {loading}
                    type="submit"
                    disabled={!isMatchPredictable(prediction.match)}
                  >
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
