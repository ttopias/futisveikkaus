<script lang="ts">
  import { page } from '$app/stores';
  import type { FavouriteTeam } from '$lib/bracket-favourite';
  import type { Match } from '$lib/index';
  import { MATCH_BOX_HEIGHT } from './bracket-layout';
  import { isPlaceholderFlag, matchParticipant } from '$lib/match-participants';
  import { slotLabelFi } from '$lib/slots';
  import { cn } from '$lib/utils';
  import * as Card from '$lib/components/ui/card';
  import TeamFlag from '$lib/components/TeamFlag.svelte';

  export let match: Match;
  export let cardTintClass = '';
  export let accentBorderClass = '';

  type Side = 'home' | 'away';

  const sides: Side[] = ['home', 'away'];

  $: canOpenMatch = Boolean($page.data.user);

  function ruleLabel(side: Side): string {
    const team = side === 'home' ? match.home : match.away;
    if (team?.team_id) return team.name;
    const slot = side === 'home' ? match.home_slot : match.away_slot;
    if (slot) return slotLabelFi(slot);
    return matchParticipant(match, side).name;
  }

  function favourite(side: Side): FavouriteTeam | null {
    return side === 'home' ? (match.home_favourite ?? null) : (match.away_favourite ?? null);
  }

  function isUnresolved(side: Side): boolean {
    const team = side === 'home' ? match.home : match.away;
    return !team?.team_id;
  }

  function candidateFlag(side: Side): { country_code: string; name: string } {
    const fav = favourite(side);
    if (isUnresolved(side) && fav) return fav;
    const participant = matchParticipant(match, side);
    return { country_code: participant.country_code, name: participant.name };
  }

  function candidateName(side: Side): string {
    const fav = favourite(side);
    if (isUnresolved(side) && fav) return fav.name;
    const participant = matchParticipant(match, side);
    if (isPlaceholderFlag(participant.country_code)) return '';
    return participant.name;
  }

  function isWinner(side: Side): boolean {
    if (!match.finished) return false;
    if (match.home_goals === match.away_goals) return false;
    return side === 'home' ? match.home_goals > match.away_goals : match.away_goals > match.home_goals;
  }

  function score(side: Side): string {
    if (!match.finished) return '';
    return side === 'home' ? String(match.home_goals) : String(match.away_goals);
  }

  const ruleRowClass =
    'px-2.5 py-0.5 text-[10px] leading-snug text-muted-foreground lg:px-3 lg:text-xs';
  const candidateRowClass =
    'flex items-center gap-1.5 px-2.5 py-1 text-xs leading-snug lg:gap-2 lg:px-3 lg:py-1.5 lg:text-sm';
  const flagClass = 'size-4 shrink-0 rounded-sm object-cover lg:size-[18px]';
  const scoreClass =
    'ml-auto shrink-0 text-right font-mono text-xs font-bold tabular-nums lg:text-sm';
  const winnerClass = 'bg-primary/25 font-semibold text-foreground ring-1 ring-inset ring-primary/30';
  const loserClass = 'text-muted-foreground';
</script>

<svelte:element
  this={canOpenMatch ? 'a' : 'div'}
  href={canOpenMatch ? `/matches/${match.match_id}` : undefined}
  class={cn('relative z-10 block min-w-[10.5rem] lg:min-w-[12.5rem]', canOpenMatch && 'group')}
  style:height="{MATCH_BOX_HEIGHT}px"
>
  <Card.Root
    class={cn(
      'flex h-full flex-col justify-center overflow-hidden shadow-md ring-1 ring-black/5 transition-colors dark:ring-white/5',
      cardTintClass,
      accentBorderClass,
      canOpenMatch && 'group-hover:border-primary/50 group-hover:shadow-lg',
    )}
  >
    {#each sides as side, i (side)}
      {@const won = isWinner(side)}
      {@const lost = match.finished && !won && match.home_goals !== match.away_goals}
      {@const flag = candidateFlag(side)}
      {@const name = candidateName(side)}

      <div class={cn(ruleRowClass, i === 0 && 'border-b border-border/30')}>
        {ruleLabel(side)}
      </div>
      <div
        class={cn(
          candidateRowClass,
          i === 0 && 'border-b border-border/50',
          won && winnerClass,
          lost && loserClass,
        )}
      >
        <TeamFlag countryCode={flag.country_code} name={flag.name} class={flagClass} />
        {#if name}
          <span class="break-words">{name}</span>
        {/if}
        <span class={cn(scoreClass, won && 'text-primary')}>{score(side)}</span>
      </div>

      {#if i === 0 && match.match_number}
        <div
          class="border-y border-border/40 bg-muted/30 px-2 py-0.5 text-center text-[10px] font-medium tabular-nums text-muted-foreground lg:text-xs"
        >
          #{match.match_number}
        </div>
      {/if}
    {/each}
  </Card.Root>
</svelte:element>
