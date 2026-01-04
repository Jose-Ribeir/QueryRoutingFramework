'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface EnergyDistributionData {
  version: string;
  cpu: number;
  gpu: number;
}

interface EnergyDistributionChartProps {
  data: EnergyDistributionData[];
}

export default function EnergyDistributionChart({ data }: EnergyDistributionChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-ppt-dark2 border border-ppt-light1/20 rounded-lg p-3 shadow-lg">
          <p className="text-ppt-light1 font-semibold mb-2">{payload[0].payload.version}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)} Wh
            </p>
          ))}
          <p className="text-ppt-light1/70 text-sm mt-2 border-t border-ppt-light1/20 pt-2">
            Total: {total.toFixed(2)} Wh
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#465469" opacity={0.3} />
          <XAxis
            dataKey="version"
            stroke="#E8E8E8"
            tick={{ fill: '#E8E8E8' }}
          />
          <YAxis
            stroke="#E8E8E8"
            tick={{ fill: '#E8E8E8' }}
            label={{ value: 'Energy (Wh)', angle: -90, position: 'insideLeft', fill: '#E8E8E8' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="cpu" stackId="a" name="CPU Energy" fill="#0F9ED5" />
          <Bar dataKey="gpu" stackId="a" name="GPU Energy" fill="#4EA72E" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

