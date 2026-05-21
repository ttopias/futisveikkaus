<script lang="ts">
  import { onMount } from 'svelte';
  import type { ECharts, EChartsOption } from 'echarts';

  interface Point {
    x: Date;
    y: number;
  }

  interface ChartData {
    label: string;
    data: Point[];
  }

  export let chartData: ChartData[] = [];
  let chartInstance: ECharts | null = null;

  function buildOption() {
    return {
      title: {
        text: 'Pelaajien pistekehitys',
        textStyle: {
          color: '#4A5568',
          fontSize: 16,
          fontWeight: 'bold',
        },
        left: 'left',
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: '#ffffff',
          },
        },
        axisLabel: {
          color: '#ffffff',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#ffffff',
          },
        },
        axisLabel: {
          color: '#ffffff',
        },
      },
      series: chartData.map((user) => ({
        name: user.label,
        type: 'line',
        smooth: true,
        data: user.data.map((point) => [point.x, point.y]),
        lineStyle: {
          width: 2,
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
        },
        labelLayout: {
          moveOverlap: 'shiftY',
        },
        endLabel: {
          show: true,
          formatter: '{a}',
          distance: -20,
        },
        emphasis: {
          focus: 'series',
        },
        showSymbol: false,
      })),
    } as EChartsOption;
  }

  onMount(() => {
    let disposed = false;

    (async () => {
      const chartElement = document.getElementById('chart');
      if (!chartElement || disposed) return;

      const { init } = await import('echarts');
      if (disposed) return;

      chartInstance = init(chartElement);
      chartInstance.setOption(buildOption() as EChartsOption);
    })();

    return () => {
      disposed = true;
      chartInstance?.dispose();
      chartInstance = null;
    };
  });
</script>

<div id="chart" class="h-96 w-full p-4" />
