'use client';

import { CombinedPaddle } from '@/services/fetch';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CombinedPaddlePerformanceChartProps {
  paddle: CombinedPaddle;
}

// Parse percentile string (e.g., "75%") to number
function parsePercentile(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export function CombinedPaddlePerformanceChart({ paddle }: CombinedPaddlePerformanceChartProps) {
  if (!paddle) return null;

  // Parse all 6 metrics from percentile strings
  const spinValue = parsePercentile(paddle.spinPercentile);
  const twistWeightValue = parsePercentile(paddle.twistWeightPercentile);
  const balancePointValue = parsePercentile(paddle.balancePoint);
  const swingWeightValue = parsePercentile(paddle.swingWeightPercentile);
  const popValue = parsePercentile(paddle.popPercentile);
  const powerValue = parsePercentile(paddle.powerPercentile);

  // Count how many metrics we have
  const availableMetrics = [spinValue, twistWeightValue, balancePointValue, swingWeightValue, popValue, powerValue]
    .filter(v => v !== null).length;

  // Show message if insufficient data
  if (availableMetrics < 3) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Insufficient performance data available for this paddle (only {availableMetrics} of 6 metrics available)
      </div>
    );
  }

  // Create fixed 6-axis radar chart data
  // Order: Spin (top), Twist Weight, Balance Point, Swing Weight, Pop, Power
  const performanceData = [
    {
      name: 'Spin',
      value: spinValue ?? 50, // Use 50 as default if missing
      fullMark: 100
    },
    {
      name: 'Twist Weight',
      value: twistWeightValue ?? 50,
      fullMark: 100
    },
    {
      name: 'Balance Point',
      value: balancePointValue ?? 50,
      fullMark: 100
    },
    {
      name: 'Swing Weight',
      value: swingWeightValue ?? 50,
      fullMark: 100
    },
    {
      name: 'Pop',
      value: popValue ?? 50,
      fullMark: 100
    },
    {
      name: 'Power',
      value: powerValue ?? 50,
      fullMark: 100
    }
  ];

  return (
    <ResponsiveContainer width="100%" height={500}>
      <RadarChart data={performanceData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis domain={[0, 100]} />
        <Radar
          name={`${paddle.company} ${paddle.paddleName}`}
          dataKey="value"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.6}
        />
        <Tooltip />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
