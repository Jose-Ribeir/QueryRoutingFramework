'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface ModelData {
  name: string;
  parameters: string;
  accuracy: number;
  energy: number;
  color: string;
}

interface PerformanceChartProps {
  models: ModelData[];
}

export default function PerformanceChart({ models }: PerformanceChartProps) {
  const chartData = models.map(model => ({
    name: model.name,
    accuracy: model.accuracy,
    energy: model.energy,
    color: model.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const model = models.find(m => m.name === data.name);
      return (
        <div className="bg-ppt-dark2 border border-ppt-light1/20 rounded-lg p-3 shadow-lg">
          <p className="text-ppt-light1 font-semibold mb-2">{data.name}</p>
          <p className="text-ppt-accent6 text-sm mb-1">Accuracy: {data.accuracy}%</p>
          <p className="text-ppt-accent2 text-sm">Energy: {data.energy} Wh/query</p>
          {model && <p className="text-ppt-light1/70 text-xs mt-2">Parameters: {model.parameters}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#465469" opacity={0.3} />
          <XAxis
            dataKey="name"
            stroke="#E8E8E8"
            tick={{ fill: '#E8E8E8' }}
            angle={-15}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#E8E8E8"
            tick={{ fill: '#E8E8E8' }}
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', fill: '#E8E8E8' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="accuracy" name="Accuracy (%)" fill="#4EA72E">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

