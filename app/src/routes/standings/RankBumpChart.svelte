<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import type { ChartData, ChartOptions } from 'chart.js';
  import type { StandingsChartData } from '$lib/standings-chart';
  import { datasetStyleForSeriesIndex } from '$lib/standings-chart';
  import { registerStandingsCharts, STANDINGS_CHART_LEGEND } from './chart-setup';

  export let chartData: StandingsChartData;

  registerStandingsCharts();

  $: playerCount = chartData.series.length;
  $: labels = chartData.timeline.map((m) => `#${m.matchNumber}`);
  $: datasets = chartData.series.map((s) => ({
    label: s.chartLabel,
    data: s.rankByMatch,
    ...datasetStyleForSeriesIndex(s.colorIndex),
    pointRadius: chartData.timeline.length <= 12 ? 4 : 0,
    pointHoverRadius: 6,
    tension: 0,
  }));

  $: data = { labels, datasets } satisfies ChartData<'line'>;

  $: options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: STANDINGS_CHART_LEGEND,
      title: {
        display: true,
        text: 'Sijoituskehitys',
        color: 'hsl(160 55% 12%)',
        font: { size: 15, weight: 'bold' },
      },
      tooltip: {
        callbacks: {
          title(items) {
            const idx = items[0]?.dataIndex;
            if (idx == null || !chartData.timeline[idx]) return '';
            const m = chartData.timeline[idx];
            return `Ottelu #${m.matchNumber}`;
          },
          label(ctx) {
            return `${ctx.dataset.label}: sija ${ctx.parsed.y}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Ottelu', color: 'hsl(160 12% 38%)' },
        ticks: { color: 'hsl(160 12% 38%)' },
        grid: { color: 'hsl(152 18% 86% / 0.5)' },
      },
      y: {
        reverse: true,
        min: 1,
        max: Math.max(playerCount, 2),
        offset: true,
        title: { display: true, text: 'Sija', color: 'hsl(160 12% 38%)' },
        ticks: {
          color: 'hsl(160 12% 38%)',
          stepSize: 1,
          precision: 0,
          autoSkip: false,
        },
        grid: { color: 'hsl(152 18% 86% / 0.5)' },
      },
    },
  } satisfies ChartOptions<'line'>;
</script>

<div class="h-80 w-full md:h-96">
  <Line {data} {options} />
</div>
