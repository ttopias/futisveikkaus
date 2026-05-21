import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  CategoryScale,
  Filler,
} from 'chart.js';

let registered = false;

const LEGEND_TEXT_COLOR = 'hsl(160 12% 38%)';

/** Legend with per-dataset line colors; text stays muted. */
export const STANDINGS_CHART_LEGEND = {
  position: 'bottom' as const,
  labels: {
    usePointStyle: true,
    pointStyle: 'line' as const,
    boxWidth: 28,
    padding: 12,
    generateLabels(chart: ChartJS) {
      const items = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
      return items.map((item) => {
        const dataset = chart.data.datasets[item.datasetIndex ?? 0];
        const raw = dataset.borderColor ?? dataset.backgroundColor;
        const lineColor = typeof raw === 'string' ? raw : LEGEND_TEXT_COLOR;
        return {
          ...item,
          fillStyle: lineColor,
          strokeStyle: lineColor,
          fontColor: LEGEND_TEXT_COLOR,
        };
      });
    },
  },
};

export function registerStandingsCharts() {
  if (registered) return;
  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Filler,
  );
  registered = true;
}
