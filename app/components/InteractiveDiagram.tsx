'use client';

import React, { useState } from 'react';

type RouteType = 'direct' | 'cot' | 'rag' | null;

export default function InteractiveDiagram() {
  const [hoveredRoute, setHoveredRoute] = useState<RouteType>(null);

  const routes = [
    { id: 'direct' as RouteType, label: 'Direct Answer', color: 'bg-ppt-accent4', description: 'Fastest path for simple queries' },
    { id: 'cot' as RouteType, label: 'Chain-of-Thought', color: 'bg-ppt-accent6', description: 'Step-by-step reasoning for complex queries' },
    { id: 'rag' as RouteType, label: 'RAG', color: 'bg-ppt-accent2', description: 'Retrieval-augmented generation for knowledge-intensive queries' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative bg-ppt-dark2/30 rounded-xl p-8 border border-ppt-light1/20">
        {/* Flow Diagram */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Input Query */}
          <div className="flex-shrink-0">
            <div className="bg-ppt-accent1/20 border-2 border-ppt-accent1 rounded-lg px-6 py-4 text-center">
              <div className="text-sm text-ppt-light1/70 mb-1">Input</div>
              <div className="text-lg font-semibold text-ppt-light1">Query</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-ppt-accent4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>

          {/* Adaptive Controller */}
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-br from-ppt-accent4/30 to-ppt-accent6/30 border-2 border-ppt-accent4 rounded-lg px-6 py-4 text-center min-w-[180px]">
              <div className="text-sm text-ppt-light1/70 mb-1">Adaptive</div>
              <div className="text-lg font-semibold text-ppt-light1">Controller</div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-ppt-accent4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>

          {/* Routes */}
          <div className="flex-1 flex flex-col gap-3">
            {routes.map((route) => (
              <div
                key={route.id}
                onMouseEnter={() => setHoveredRoute(route.id)}
                onMouseLeave={() => setHoveredRoute(null)}
                className={`${route.color} rounded-lg px-4 py-3 text-center cursor-pointer transition-all duration-300 ${
                  hoveredRoute === route.id ? 'scale-105 shadow-lg shadow-ppt-accent4/50' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div className="text-sm font-semibold text-ppt-light1">{route.label}</div>
                {hoveredRoute === route.id && (
                  <div className="text-xs text-ppt-light1/90 mt-1">{route.description}</div>
                )}
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <svg className="w-8 h-8 text-ppt-accent4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </div>

          {/* Output */}
          <div className="flex-shrink-0">
            <div className="bg-ppt-accent3/20 border-2 border-ppt-accent3 rounded-lg px-6 py-4 text-center">
              <div className="text-sm text-ppt-light1/70 mb-1">Output</div>
              <div className="text-lg font-semibold text-ppt-light1">Answer</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {hoveredRoute && (
          <div className="mt-6 p-4 bg-ppt-dark2/50 rounded-lg border border-ppt-light1/20 animate-in fade-in duration-300">
            <p className="text-ppt-light1/90 text-center">
              {routes.find(r => r.id === hoveredRoute)?.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

