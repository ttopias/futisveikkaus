<script lang="ts">
  import type { PageData } from './$types';
  import type { Match } from '$lib/index';
  import type { MatchStage } from '$lib/stages';
  import { STAGE_LABELS_FI } from '$lib/stages';
  import * as Card from '$lib/components/ui/card';
  import * as ScrollArea from '$lib/components/ui/scroll-area';
  import BracketColumn from './BracketColumn.svelte';
  import { columnGap } from './bracket-layout';

  export let data: PageData;

  type BracketRoundStage = Exclude<MatchStage, 'group' | 'third'>;
  const MAIN_STAGES: BracketRoundStage[] = ['r32', 'r16', 'qf', 'sf', 'final'];

  function groupByStage(allMatches: Match[]): Partial<Record<MatchStage, Match[]>> {
    const grouped: Partial<Record<MatchStage, Match[]>> = {};
    for (const match of allMatches) {
      const stage = match.stage;
      if (!stage) continue;
      if (!grouped[stage]) grouped[stage] = [];
      grouped[stage]!.push(match);
    }
    return grouped;
  }

  function visibleMainStages(grouped: Partial<Record<MatchStage, Match[]>>): BracketRoundStage[] {
    return MAIN_STAGES.filter((stage) => (grouped[stage]?.length ?? 0) > 0);
  }

  /** Parse the feeder match number from a "winner:N" slot, else null. */
  function feederMatchNumber(slot: string | null | undefined): number | null {
    if (!slot) return null;
    const match = /^winner:(\d+)$/.exec(slot);
    return match ? Number(match[1]) : null;
  }

  /**
   * Reorder the R32 column so each R16 match's two feeders sit adjacent and in
   * the same vertical order as their R16 parent. Falls back to the original
   * match_number order when feeder references aren't "winner:N".
   */
  function reorderR32(grouped: Partial<Record<MatchStage, Match[]>>): Partial<Record<MatchStage, Match[]>> {
    const r32 = grouped.r32;
    const r16 = grouped.r16;
    if (!r32?.length || !r16?.length) return grouped;

    const byNumber = new Map<number, Match>();
    for (const match of r32) {
      if (match.match_number != null) byNumber.set(match.match_number, match);
    }

    const ordered: Match[] = [];
    const used = new Set<Match>();
    for (const parent of r16) {
      for (const slot of [parent.home_slot, parent.away_slot]) {
        const num = feederMatchNumber(slot);
        const feeder = num != null ? byNumber.get(num) : undefined;
        if (feeder && !used.has(feeder)) {
          ordered.push(feeder);
          used.add(feeder);
        }
      }
    }

    if (ordered.length !== r32.length) return grouped;
    for (const match of r32) {
      if (!used.has(match)) return grouped;
    }

    return { ...grouped, r32: ordered };
  }

  $: matches = data?.matches ?? [];
  $: matchesByStage = reorderR32(groupByStage(matches));
  $: thirdPlaceMatches = matchesByStage.third ?? [];
  $: activeStages = visibleMainStages(matchesByStage);
</script>

<div class="mx-auto w-full max-w-6xl">
  <Card.Root class="shadow-md">
    <Card.Header>
      <Card.Title>Pudotuspelikaavio</Card.Title>
      {#if data.showR32Note}
        <p class="text-sm text-muted-foreground">
          R32 kierroksen osalta näytetään kandidaatit tämän hetkisen tilanteen perusteella
        </p>
      {/if}
    </Card.Header>
    <Card.Content class="min-w-0 pt-0">
      {#if matches.length === 0}
        <p class="py-12 text-center text-muted-foreground">Ei pudotuspelejä näytettäväksi.</p>
      {:else}
        <ScrollArea.Root orientation="horizontal" class="w-full">
          <div class="flex min-w-max items-stretch gap-0 pb-4">
            {#each activeStages as stage, i}
              {@const stageMatches = matchesByStage[stage] ?? []}
              {@const isFinal = stage === 'final'}
              {@const isLast = i === activeStages.length - 1}
              <BracketColumn
                title={isFinal ? 'Mitaliottelut' : STAGE_LABELS_FI[stage]}
                {stage}
                matches={stageMatches}
                gap={columnGap(i)}
                {isLast}
                showConnectors={!isLast}
                primaryTitle={isFinal ? 'Finaali' : undefined}
                secondaryTitle={isFinal && thirdPlaceMatches.length > 0
                  ? STAGE_LABELS_FI.third
                  : undefined}
                secondaryMatches={isFinal ? thirdPlaceMatches : []}
              />
            {/each}
          </div>
        </ScrollArea.Root>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
