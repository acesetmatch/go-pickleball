'use client';

import { Paddle } from '@/services/fetch';
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

interface PaddlePerformanceChartProps {
  paddle: Paddle;
}

export function PaddlePerformanceChart({ paddle }: PaddlePerformanceChartProps) {
  if (!paddle) return null;

  const { performance } = paddle;
  
  // Transform paddle performance data for the chart
  const performanceData = [
    { name: 'Power', value: performance.power, fullMark: 100 },
    { name: 'Pop', value: performance.pop, fullMark: 100 },
    { name: 'Spin', value: performance.spin / 50, fullMark: 100 }, // Normalized for display
    { name: 'Twist Weight', value: performance.twist_weight / 3, fullMark: 100 }, // Normalized
    { name: 'Swing Weight', value: performance.swing_weight / 3, fullMark: 100 }, // Normalized
    { name: 'Balance', value: performance.balance_point, fullMark: 40 }
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={performanceData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" />
        <PolarRadiusAxis domain={[0, 100]} />
        <Radar
          name={`${paddle.metadata.brand} ${paddle.metadata.model}`}
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