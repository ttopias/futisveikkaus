<script lang="ts">
  import type { StandingsChartData } from '$lib/standings-chart';
  import * as Tabs from '$lib/components/ui/tabs';
  import PointsTimelineChart from './PointsTimelineChart.svelte';
  import RankBumpChart from './RankBumpChart.svelte';

  export let chartData: StandingsChartData;

  let activeTab = 'points';
</script>

<Tabs.Root bind:value={activeTab} class="w-full">
  <Tabs.List class="mb-4 grid w-full max-w-xs grid-cols-2">
    <Tabs.Trigger value="points">Pisteet</Tabs.Trigger>
    <Tabs.Trigger value="rank">Sijoitus</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="points">
    {#if activeTab === 'points'}
      <PointsTimelineChart {chartData} />
    {/if}
  </Tabs.Content>
  <Tabs.Content value="rank">
    {#if activeTab === 'rank'}
      <RankBumpChart {chartData} />
    {/if}
  </Tabs.Content>
</Tabs.Root>
