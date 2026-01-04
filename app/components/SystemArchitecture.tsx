'use client';

import React from 'react';

export default function SystemArchitecture() {
  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-ppt-dark2/30 rounded-xl p-8 border border-ppt-light1/20">
        <div className="space-y-6">
          {/* Flow Steps */}
          <div className="flex flex-col gap-4">
            {/* Step 1: Query Input */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ppt-accent1/20 border-2 border-ppt-accent1 flex items-center justify-center">
                <span className="text-ppt-accent1 font-bold">1</span>
              </div>
              <div className="flex-1 bg-ppt-dark2/50 rounded-lg p-4 border border-ppt-light1/10">
                <h4 className="text-ppt-light1 font-semibold mb-1">User Query</h4>
                <p className="text-ppt-light1/70 text-sm">Query received from user</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-ppt-accent4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Step 2: Rewriter Module */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ppt-accent4/20 border-2 border-ppt-accent4 flex items-center justify-center">
                <span className="text-ppt-accent4 font-bold">2</span>
              </div>
              <div className="flex-1 bg-ppt-dark2/50 rounded-lg p-4 border border-ppt-light1/10">
                <h4 className="text-ppt-light1 font-semibold mb-1">Rewriter Module</h4>
                <p className="text-ppt-light1/70 text-sm">Analyzes query and inserts instruction to determine routing strategy</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-ppt-accent4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Step 3: Routing Decision */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ppt-accent6/20 border-2 border-ppt-accent6 flex items-center justify-center">
                <span className="text-ppt-accent6 font-bold">3</span>
              </div>
              <div className="flex-1 bg-ppt-dark2/50 rounded-lg p-4 border border-ppt-light1/10">
                <h4 className="text-ppt-light1 font-semibold mb-1">Adaptive Controller</h4>
                <p className="text-ppt-light1/70 text-sm">Selects optimal route: Direct Answer, CoT, or RAG</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-ppt-accent4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Step 4: Processing Routes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-ppt-accent4/10 rounded-lg p-4 border border-ppt-accent4/30">
                <h5 className="text-ppt-accent4 font-semibold mb-2">Direct Answer</h5>
                <p className="text-ppt-light1/70 text-xs">Single hop, fastest path</p>
              </div>
              <div className="bg-ppt-accent6/10 rounded-lg p-4 border border-ppt-accent6/30">
                <h5 className="text-ppt-accent6 font-semibold mb-2">Chain-of-Thought</h5>
                <p className="text-ppt-light1/70 text-xs">Step-by-step reasoning</p>
              </div>
              <div className="bg-ppt-accent2/10 rounded-lg p-4 border border-ppt-accent2/30">
                <h5 className="text-ppt-accent2 font-semibold mb-2">RAG</h5>
                <p className="text-ppt-light1/70 text-xs">Embedding → Retrieval → Reranking</p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-ppt-accent4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Step 5: Output */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ppt-accent3/20 border-2 border-ppt-accent3 flex items-center justify-center">
                <span className="text-ppt-accent3 font-bold">4</span>
              </div>
              <div className="flex-1 bg-ppt-dark2/50 rounded-lg p-4 border border-ppt-light1/10">
                <h4 className="text-ppt-light1 font-semibold mb-1">Final Answer</h4>
                <p className="text-ppt-light1/70 text-sm">Generated response returned to user</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

