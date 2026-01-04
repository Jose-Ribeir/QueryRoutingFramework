'use client';

import React from 'react';

interface ResearchQuestionCardProps {
  id: string;
  question: string;
  description: string;
}

export default function ResearchQuestionCard({ id, question, description }: ResearchQuestionCardProps) {
  return (
    <div className="group relative bg-ppt-dark2/50 border border-ppt-light1/20 rounded-lg p-6 hover:border-ppt-accent4/50 transition-all duration-300 hover:shadow-lg hover:shadow-ppt-accent4/20">
      <div className="absolute inset-0 bg-gradient-to-br from-ppt-accent4/5 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-ppt-accent4/20 flex items-center justify-center border-2 border-ppt-accent4/50 group-hover:border-ppt-accent4 group-hover:bg-ppt-accent4/30 transition-all duration-300">
              <span className="text-ppt-accent4 font-bold text-lg">{id}</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-ppt-light1 mb-2 group-hover:text-ppt-accent4 transition-colors duration-300">
              {question}
            </h3>
            <p className="text-ppt-light1/80 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

