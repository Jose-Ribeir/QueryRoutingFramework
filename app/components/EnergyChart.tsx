'use client';

import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell,
  LabelList,
  ReferenceLine
} from 'recharts';

interface EnergyDataPoint {
  version: string;
  energy: number;
  correctness: number;
  color: string;
}

interface EnergyChartProps {
  data: EnergyDataPoint[];
}

// Custom label component for data points
const CustomLabel = (props: any) => {
  // Recharts LabelList passes data differently - check multiple possible structures
  const version = props?.version || props?.payload?.version || props?.payload?.payload?.version;
  const x = props?.x;
  const y = props?.y;
  
  // Return null if version or coordinates are not available
  if (!version || x === undefined || y === undefined) {
    return null;
  }
  
  // Extract version name (e.g., "Baseline Straight" -> "Baseline", "V1" -> "V1")
  const versionName = typeof version === 'string' && version.includes('Baseline') 
    ? version.split(' ')[0] 
    : version;
  
  return (
    <text
      x={x}
      y={y - 12}
      fill="#E8E8E8"
      fontSize={12}
      fontWeight={500}
      textAnchor="middle"
      className="pointer-events-none"
    >
      {versionName}
    </text>
  );
};

export default function EnergyChart({ data }: EnergyChartProps) {
  // Enhanced tooltip with better formatting
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-ppt-dark2 border-2 border-ppt-accent4/50 rounded-lg p-4 shadow-xl backdrop-blur-sm">
          <p className="text-ppt-light1 font-bold text-base mb-2 border-b border-ppt-light1/20 pb-2">
            {data.version}
          </p>
          <div className="space-y-1.5">
            <p className="text-ppt-accent4 text-sm font-medium">
              <span className="opacity-80">Energy:</span>{' '}
              <span className="font-semibold">{data.energy.toFixed(2)} Wh/query</span>
            </p>
            <p className="text-ppt-accent6 text-sm font-medium">
              <span className="opacity-80">Correctness:</span>{' '}
              <span className="font-semibold">{data.correctness}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Group data by category for custom legend
  const baselineData = data.filter(d => d.version.includes('Baseline'));
  const versionData = data.filter(d => d.version.startsWith('V'));
  
  // Custom legend component
  const CustomLegend = () => {
    return (
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 mt-6 mb-2 px-4">
        {baselineData.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-ppt-light1/60 font-semibold uppercase tracking-wide text-center sm:text-left">
              Baseline Models
            </span>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {baselineData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-ppt-light1/30 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-ppt-light1/80 whitespace-nowrap">
                    {item.version.replace('Baseline ', '')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {versionData.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-ppt-light1/60 font-semibold uppercase tracking-wide text-center sm:text-left">
              Instruction Versions
            </span>
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {versionData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-ppt-light1/30 flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-ppt-light1/80 whitespace-nowrap">{item.version}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full py-4 px-2 sm:px-4">
      <ResponsiveContainer width="100%" height={600} minHeight={500}>
        <ScatterChart
          margin={{ top: 30, right: 30, bottom: 90, left: 50 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#465469" 
            opacity={0.4}
            strokeWidth={1}
          />
          <XAxis
            type="number"
            dataKey="energy"
            name="Energy"
            domain={[0.8, 'dataMax + 0.3']}
            stroke="#E8E8E8"
            strokeWidth={2}
            tick={{ fill: '#E8E8E8', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => value.toFixed(1)}
            label={{ 
              value: 'Energy Consumption (Wh/query)', 
              position: 'bottom', 
              offset: 15, 
              fill: '#E8E8E8', 
              style: { textAnchor: 'middle', fontSize: 14, fontWeight: 600 },
              dy: 10
            }}
            tickLine={{ stroke: '#E8E8E8', strokeWidth: 1 }}
          />
          <YAxis
            type="number"
            dataKey="correctness"
            name="Correctness"
            domain={[50, 'dataMax + 5']}
            stroke="#E8E8E8"
            strokeWidth={2}
            tick={{ fill: '#E8E8E8', fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `${value}%`}
            label={{ 
              value: 'Answer Correctness (%)', 
              angle: -90, 
              position: 'insideLeft', 
              fill: '#E8E8E8',
              style: { textAnchor: 'middle', fontSize: 14, fontWeight: 600 }
            }}
            tickLine={{ stroke: '#E8E8E8', strokeWidth: 1 }}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ 
              stroke: '#0F9ED5', 
              strokeWidth: 1.5, 
              strokeDasharray: '5 5',
              strokeOpacity: 0.6
            }} 
          />
          <Scatter 
            name="Instruction Versions" 
            data={data} 
            fill="#0F9ED5"
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <g>
                  {/* Outer glow circle */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={11}
                    fill={payload.color}
                    opacity={0.2}
                  />
                  {/* Main point with border */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={8}
                    fill={payload.color}
                    stroke="#E8E8E8"
                    strokeWidth={2}
                    opacity={0.95}
                  />
                  {/* Inner highlight */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#FFFFFF"
                    opacity={0.3}
                  />
                </g>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList dataKey="version" content={<CustomLabel />} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <CustomLegend />
    </div>
  );
}

