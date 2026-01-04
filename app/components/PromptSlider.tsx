'use client';

import React, { useState } from 'react';

interface PromptVersion {
  version: string;
  title: string;
  description: string;
  routingAccuracy: number;
  answerAccuracy: number;
  energyConsumption: number;
}

const promptVersions: PromptVersion[] = [
  {
    version: 'V1',
    title: 'A Simple Baseline',
    description: 'Minimal baseline with binary classification. Heavy emphasis on output format rather than decision-making logic.',
    routingAccuracy: 52.3,
    answerAccuracy: 55,
    energyConsumption: 2.0,
  },
  {
    version: 'V2',
    title: 'An Aggressive, Safety-First Heuristic',
    description: 'Strong bias towards retrieval. Default assumption is retrieval unless query meets very strict criteria.',
    routingAccuracy: 66.7,
    answerAccuracy: 70,
    energyConsumption: 1.9,
  },
  {
    version: 'V3',
    title: 'Introducing Balanced Criteria',
    description: 'Strikes balance between V1 and V2. Introduces explicit positive categories for non-retrieval.',
    routingAccuracy: 65.0,
    answerAccuracy: 72,
    energyConsumption: 1.8,
  },
  {
    version: 'V4',
    title: 'A Shift to Profile-Based Classification',
    description: 'Major conceptual shift to profile-based matching. Two detailed profiles: "Retrieval Required" vs "Direct Answer Sufficient".',
    routingAccuracy: 82.0,
    answerAccuracy: 83,
    energyConsumption: 1.7,
  },
  {
    version: 'V5',
    title: 'Final Refinement with a Guiding Principle',
    description: 'Adds explicit guiding principle: "A slow but correct answer is always better than a fast but wrong one."',
    routingAccuracy: 81.1,
    answerAccuracy: 83,
    energyConsumption: 1.75,
  },
  {
    version: 'V6',
    title: 'A Strategic Pivot to Efficiency',
    description: 'Deliberate reversal from accuracy-first. Focuses on avoiding unnecessary retrieval, prioritizing efficiency.',
    routingAccuracy: 72.6,
    answerAccuracy: 85,
    energyConsumption: 2.2,
  },
];

export default function PromptSlider() {
  const [currentIndex, setCurrentIndex] = useState(3); // Start at V4

  const currentVersion = promptVersions[currentIndex];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(parseInt(e.target.value));
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-ppt-dark2/30 rounded-xl p-8 border border-ppt-light1/20">
        {/* Version Info */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-ppt-light1 mb-1">
                {currentVersion.version}: {currentVersion.title}
              </h3>
              <p className="text-ppt-light1/80">{currentVersion.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-ppt-accent4">{currentVersion.version}</div>
            </div>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-6">
          <input
            type="range"
            min="0"
            max={promptVersions.length - 1}
            value={currentIndex}
            onChange={handleSliderChange}
            className="w-full h-2 bg-ppt-dark2 rounded-lg appearance-none cursor-pointer accent-ppt-accent4"
            style={{
              background: `linear-gradient(to right, #0F9ED5 0%, #0F9ED5 ${(currentIndex / (promptVersions.length - 1)) * 100}%, #334054 ${(currentIndex / (promptVersions.length - 1)) * 100}%, #334054 100%)`,
            }}
          />
          <div className="flex justify-between mt-2 text-xs text-ppt-light1/60">
            {promptVersions.map((v, idx) => (
              <span key={idx} className={idx === currentIndex ? 'text-ppt-accent4 font-semibold' : ''}>
                {v.version}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-ppt-accent4/10 rounded-lg p-4 border border-ppt-accent4/30">
            <div className="text-sm text-ppt-light1/70 mb-1">Routing Accuracy</div>
            <div className="text-2xl font-bold text-ppt-accent4">{currentVersion.routingAccuracy}%</div>
          </div>
          <div className="bg-ppt-accent6/10 rounded-lg p-4 border border-ppt-accent6/30">
            <div className="text-sm text-ppt-light1/70 mb-1">Answer Accuracy</div>
            <div className="text-2xl font-bold text-ppt-accent6">{currentVersion.answerAccuracy}%</div>
          </div>
          <div className="bg-ppt-accent2/10 rounded-lg p-4 border border-ppt-accent2/30">
            <div className="text-sm text-ppt-light1/70 mb-1">Energy (Wh/query)</div>
            <div className="text-2xl font-bold text-ppt-accent2">{currentVersion.energyConsumption}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

