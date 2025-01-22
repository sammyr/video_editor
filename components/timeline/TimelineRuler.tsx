'use client';

import React from 'react';
import { settings } from '@/config/editor-settings';

interface TimelineRulerProps {
  zoom: number;
  offset: number;
  width: number;
}

export function TimelineRuler({ zoom, offset, width }: TimelineRulerProps) {
  const pixelsPerSecond = settings.timeline.pixelsPerSecond * zoom;
  const totalSeconds = Math.ceil(width / pixelsPerSecond);
  
  // Generiere Markierungen für jede Sekunde
  const markers = Array.from({ length: totalSeconds }, (_, i) => {
    const x = i * pixelsPerSecond + offset;
    const minutes = Math.floor(i / 60);
    const seconds = i % 60;
    
    // Große Markierung alle 10 Sekunden
    const isMajor = i % 10 === 0;
    // Mittlere Markierung alle 5 Sekunden
    const isMedium = i % 5 === 0;
    
    return (
      <div
        key={i}
        className="absolute"
        style={{ left: `${x}px` }}
      >
        <div
          className={`${
            isMajor
              ? 'h-4 border-l border-white/40'
              : isMedium
              ? 'h-3 border-l border-white/30'
              : 'h-2 border-l border-white/20'
          }`}
        />
        {isMajor && (
          <div className="text-[10px] text-white/60 -ml-4 mt-1">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="h-8 bg-[#2a2a2a] border-b border-[#1a1a1a] relative">
      {markers}
    </div>
  );
}
