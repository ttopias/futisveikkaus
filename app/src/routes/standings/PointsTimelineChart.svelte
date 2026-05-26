<script lang="ts">
  import { Line } from 'svelte-chartjs';
  import type { ChartData, ChartOptions } from 'chart.js';
  import type { StandingsChartData } from '$lib/standings-chart';
  import { datasetStyleForSeriesIndex } from '$lib/standings-chart';
  import { registerStandingsCharts, STANDINGS_CHART_LEGEND } from './chart-setup';

  export let chartData: StandingsChartData;

  registerStandingsCharts();

  $: labels = chartData.timeline.map((m) => `#${m.matchNumber}`);
  $: datasets = chartData.series.map((s) => ({
    label: s.chartLabel,
    data: s.pointsByMatch,
    ...datasetStyleForSeriesIndex(s.colorIndex),
    pointRadius: chartData.timeline.length <= 12 ? 4 : 0,
    pointHoverRadius: 6,
    tension: 0.2,
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
        text: 'Pistekehitys',
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
        title: { display: true, text: 'Pisteet', color: 'hsl(160 12% 38%)' },
        ticks: { color: 'hsl(160 12% 38%)', precision: 0 },
        grid: { color: 'hsl(152 18% 86% / 0.5)' },
        beginAtZero: true,
      },
    },
  } satisfies ChartOptions<'line'>;
</script>

<div class="h-80 w-full md:h-96">
  <Line {data} {options} />
</div>
