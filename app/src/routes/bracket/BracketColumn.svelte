<script lang="ts">
  import type { Match } from '$lib/index';
  import type { MatchStage } from '$lib/stages';
  import { cn } from '$lib/utils';
  import BracketMatch from './BracketMatch.svelte';
  import { CONNECTOR_WIDTH, MATCH_BOX_HEIGHT } from './bracket-layout';

  export let title: string;
  export let matches: Match[];
  export let stage: MatchStage;
  /** Optional sub-label rendered above the primary match (e.g. "Finaali"). */
  export let primaryTitle: string | undefined = undefined;
  export let secondaryTitle: string | undefined = undefined;
  export let secondaryMatches: Match[] = [];
  /** Vertical gap between match boxes (px); scales per round in parent layout. */
  export let gap = 16;
  export let showConnectors = true;
  export let isLast = false;

  /**
   * Each pair of feeder matches merges into one outgoing line:
   *   feeder centre → HALF stub → vertical spine → HALF stub → next column.
   * The spine sits at the gutter midpoint and the outgoing stub leaves at the
   * pair midpoint, which equals the vertical centre of the fed match next round.
   */
  const HALF_CONNECTOR = CONNECTOR_WIDTH / 2;

  const STAGE_HEADER: Partial<Record<MatchStage, string>> = {
    r32: 'border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100',
    r16: 'border-violet-500/40 bg-violet-500/10 text-violet-950 dark:text-violet-100',
    qf: 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    sf: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
    final: 'border-primary/50 bg-primary/10 text-foreground',
    third: 'border-orange-500/40 bg-orange-500/10 text-orange-950 dark:text-orange-100',
  };

  const STAGE_CARD_TINT: Partial<Record<MatchStage, string>> = {
    r32: 'bg-sky-500/[0.04]',
    r16: 'bg-violet-500/[0.04]',
    qf: 'bg-amber-500/[0.04]',
    sf: 'bg-emerald-500/[0.04]',
    final: 'bg-primary/[0.06]',
    third: 'bg-orange-500/[0.04]',
  };

  const STAGE_ACCENT_BORDER: Partial<Record<MatchStage, string>> = {
    r32: 'border-sky-500/25',
    r16: 'border-violet-500/25',
    qf: 'border-amber-500/25',
    sf: 'border-emerald-500/25',
    final: 'border-primary/35',
    third: 'border-orange-500/25',
  };

  const STAGE_CONNECTOR: Partial<Record<MatchStage, string>> = {
    r32: 'border-sky-500/35',
    r16: 'border-violet-500/35',
    qf: 'border-amber-500/35',
    sf: 'border-emerald-500/35',
    final: 'border-primary/40',
    third: 'border-orange-500/35',
  };

  $: headerClass = STAGE_HEADER[stage] ?? 'border-border/60 bg-muted/40 text-foreground';
  $: cardTintClass = STAGE_CARD_TINT[stage] ?? '';
  $: accentBorderClass = STAGE_ACCENT_BORDER[stage] ?? 'border-border/80';
  $: connectorClass = STAGE_CONNECTOR[stage] ?? 'border-muted-foreground/45';
  /** Centre-to-centre distance between the two matches of a pair (px). */
  $: pairSpanPx = MATCH_BOX_HEIGHT + gap;
  /** Vertical offset of the pair midpoint from the upper match centre. */
  $: pairMidpointTop = `calc(50% + ${pairSpanPx / 2}px)`;
</script>

<div
  class={cn(
    'flex shrink-0 flex-col px-3',
    isLast ? 'w-48 lg:w-56' : 'w-[13.5rem] lg:w-64',
  )}
>
  <div class={cn('mb-3 rounded-md border px-2 py-1.5 text-center lg:mb-4', headerClass)}>
    <h2 class="text-xs font-bold uppercase tracking-wider lg:text-sm">
      {title}
    </h2>
  </div>

  <div class="flex flex-1 flex-col justify-center" style:gap="{gap}px">
    {#each matches as match, i (match.match_id)}
      {@const hasPartner = i % 2 === 0 && i + 1 < matches.length}
      <div class="relative">
        {#if primaryTitle && i === 0}
          <!-- Final match sub-label: pinned above without shifting its centre. -->
          <div class="absolute inset-x-0 bottom-[calc(100%+0.75rem)]">
            <div class={cn('rounded-md border px-2 py-1 text-center', headerClass)}>
              <h3 class="text-[10px] font-semibold uppercase tracking-wide lg:text-xs">
                {primaryTitle}
              </h3>
            </div>
          </div>
        {/if}
        <BracketMatch {match} {cardTintClass} {accentBorderClass} />
        {#if showConnectors}
          <!-- Feeder stub: card centre out to the spine. -->
          <div
            class={cn(
              'pointer-events-none absolute top-1/2 z-0 -translate-y-1/2 border-t',
              connectorClass,
            )}
            style:left="100%"
            style:width="{HALF_CONNECTOR}px"
            aria-hidden="true"
          ></div>
          {#if hasPartner}
            <!-- Vertical spine: this card centre down to the partner centre. -->
            <div
              class={cn('pointer-events-none absolute z-0 border-l', connectorClass)}
              style:left="calc(100% + {HALF_CONNECTOR}px)"
              style:top="50%"
              style:height="{pairSpanPx}px"
              aria-hidden="true"
            ></div>
            <!-- Outgoing stub: pair midpoint out to the next column's card. -->
            <div
              class={cn(
                'pointer-events-none absolute z-0 -translate-y-1/2 border-t',
                connectorClass,
              )}
              style:left="calc(100% + {HALF_CONNECTOR}px)"
              style:top={pairMidpointTop}
              style:width="{HALF_CONNECTOR}px"
              aria-hidden="true"
            ></div>
          {/if}
        {/if}

        {#if secondaryMatches.length > 0 && secondaryTitle && i === matches.length - 1}
          <!-- Bronze match: pinned just below the final without shifting its centre. -->
          <div class="absolute inset-x-0 top-[calc(100%+1.5rem)] flex flex-col gap-2">
            <div
              class={cn(
                'rounded-md border px-2 py-1 text-center',
                STAGE_HEADER.third ?? 'border-border/60 bg-muted/30',
              )}
            >
              <h3 class="text-[10px] font-semibold uppercase tracking-wide lg:text-xs">
                {secondaryTitle}
              </h3>
            </div>
            {#each secondaryMatches as bronze (bronze.match_id)}
              <BracketMatch
                match={bronze}
                cardTintClass={STAGE_CARD_TINT.third ?? ''}
                accentBorderClass={STAGE_ACCENT_BORDER.third ?? 'border-border/80'}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
