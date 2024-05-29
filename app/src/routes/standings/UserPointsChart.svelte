<script lang="ts">
  import { onMount } from 'svelte';
  import * as echarts from 'echarts';

  interface Point {
    x: Date;
    y: number;
  }

  interface ChartData {
    label: string;
    data: Point[];
  }

  export let chartData: ChartData[] = [];
  let chartInstance: echarts.ECharts | null = null;

  function initChart() {
    const chartElement = document.getElementById('chart');

    if (!chartElement) return;

    chartInstance = echarts.init(chartElement);

    const option = {
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
      legend: {
        data: chartData.map((user) => user.label),
        textStyle: {
          color: '#4A5568',
        },
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: '#A0AEC0',
          },
        },
        axisLabel: {
          color: '#4A5568',
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#A0AEC0',
          },
        },
        axisLabel: {
          color: '#4A5568',
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
        emphasis: {
          focus: 'series',
        },
        showSymbol: false,
      })),
    };

    chartInstance.setOption(option);
  }

  onMount(() => {
    initChart();
    return () => {
      if (chartInstance) {
        chartInstance.dispose();
      }
    };
  });
</script>

<div class="card glass max-w-4xl min-w-64 m-4 p-4 border-inherit shadow-lg rounded-xl">
  <div id="chart" class="w-full h-96"></div>
</div>
