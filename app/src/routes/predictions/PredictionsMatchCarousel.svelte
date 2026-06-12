<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  import Time from 'svelte-time';
  import { matchParticipant } from '$lib/match-participants';
  import type { Match } from '$lib';
  import TeamFlag from '$lib/components/TeamFlag.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Alert } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import * as Card from '$lib/components/ui/card';
  import * as Carousel from '$lib/components/ui/carousel';
  import { onDestroy } from 'svelte';
  import type { CarouselAPI } from '$lib/components/ui/carousel/context';
  import Save from 'lucide-svelte/icons/save';

  export let slides: Match[] = [];
  export let form: ActionData;
  export let loading = false;
  export let predictableMatches: Match[] = [];
  export let stageFirstKickoff: string | null = null;

  let carouselApi: CarouselAPI | undefined;
  let slideIndex = 0;
  let detachCarousel: (() => void) | undefined;

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
</script>

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
                  <Label
                    class="flex w-full flex-wrap items-center justify-center gap-1 text-xs"
                    for="home_goals-{match.match_id}"
                  >
                    <span>{matchParticipant(match, 'home').name}</span>
                    {#if matchParticipant(match, 'home').fifa_rank}
                      <Badge variant="secondary" class="px-1.5 py-0 text-[10px] tabular-nums">
                        #{matchParticipant(match, 'home').fifa_rank}
                      </Badge>
                    {/if}
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
                  <Label
                    class="flex w-full flex-wrap items-center justify-center gap-1 text-xs"
                    for="away_goals-{match.match_id}"
                  >
                    <span>{matchParticipant(match, 'away').name}</span>
                    {#if matchParticipant(match, 'away').fifa_rank}
                      <Badge variant="secondary" class="px-1.5 py-0 text-[10px] tabular-nums">
                        #{matchParticipant(match, 'away').fifa_rank}
                      </Badge>
                    {/if}
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
        <Carousel.Previous class="static h-9 w-9 translate-x-0 translate-y-0 disabled:opacity-40" />
        <span class="text-sm text-muted-foreground">
          {slideIndex + 1} / {slides.length}
        </span>
        <Carousel.Next class="static h-9 w-9 translate-x-0 translate-y-0 disabled:opacity-40" />
      </Card.Footer>
    {/if}
  </Carousel.Root>
</Card.Root>

{#if stageFirstKickoff && new Date() < new Date(stageFirstKickoff)}
  <p class="mt-4 text-center text-sm text-muted-foreground">
    Tämän vaiheen otteluiden arvausaika päättyy
    <Time timestamp={stageFirstKickoff} format="DD.MM.YYYY kello HH:mm" />.
  </p>
{/if}
