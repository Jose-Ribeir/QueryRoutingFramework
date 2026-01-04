'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface EnergyDataPoint {
  version: string;
  energy: number;
  correctness: number;
  color: string;
}

interface EnergyChartProps {
  data: EnergyDataPoint[];
}

export default function EnergyChart({ data }: EnergyChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-ppt-dark2 border border-ppt-light1/20 rounded-lg p-3 shadow-lg">
          <p className="text-ppt-light1 font-semibold mb-1">{data.version}</p>
          <p className="text-ppt-accent4 text-sm">Energy: {data.energy} Wh/query</p>
          <p className="text-ppt-accent6 text-sm">Correctness: {data.correctness}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#465469" opacity={0.3} />
          <XAxis
            type="number"
            dataKey="energy"
            name="Energy"
            unit=" Wh/query"
            stroke="#E8E8E8"
            tick={{ fill: '#E8E8E8' }}
            label={{ value: 'Energy Consumption (Wh/query)', position: 'insideBottom', offset: -5, fill: '#E8E8E8' }}
          />
          <YAxis
            type="number"
            dataKey="correctness"
            name="Correctness"
            unit="%"
            stroke="#E8E8E8"
            tick={{ fill: '#E8E8E8' }}
            label={{ value: 'Answer Correctness (%)', angle: -90, position: 'insideLeft', fill: '#E8E8E8' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Scatter name="Instruction Versions" data={data} fill="#0F9ED5">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

