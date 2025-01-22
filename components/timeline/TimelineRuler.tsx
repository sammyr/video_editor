'use client';

import React from 'react';
import { settings } from '@/config/editor-settings';

interface TimelineRulerProps {
  zoom: number;
  offset: number;
  width: number;
  duration: number;
}

export function TimelineRuler({ zoom, offset, width, duration }: TimelineRulerProps) {
  const pixelsPerSecond = settings.timeline.pixelsPerSecond * zoom;
  const totalWidth = duration * pixelsPerSecond;
  
  const getMarkerInterval = () => {
    if (zoom < 0.05) return 300; // 5 Minuten
    if (zoom < 0.1) return 120;  // 2 Minuten
    if (zoom < 0.3) return 60;   // 1 Minute
    if (zoom < 0.6) return 30;   // 30 Sekunden
    if (zoom < 1.0) return 15;   // 15 Sekunden
    return 5;                    // 5 Sekunden
  };

  const getSubMarkerCount = () => {
    if (zoom < 0.05) return 5;  // Alle 1 Minute
    if (zoom < 0.1) return 4;   // Alle 30 Sekunden
    if (zoom < 0.3) return 3;   // Alle 20 Sekunden
    if (zoom < 0.6) return 2;   // Alle 15 Sekunden
    return 5;                   // Alle 1 Sekunde
  };

  const interval = getMarkerInterval();
  const subMarkerCount = getSubMarkerCount();
  const markers = [];
  
  for (let time = 0; time <= duration; time += interval) {
    const position = time * pixelsPerSecond;
    
    // Hauptmarkierung
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    let timeText;
    if (hours > 0) {
      timeText = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    markers.push(
      <div
        key={time}
        className="absolute flex flex-col items-center"
        style={{
          left: `${position}px`,
          transform: 'translateX(-50%)',
          color: '#fff',
        }}
      >
        <div className="h-3 w-[1px] bg-gray-400" />
        <div className="text-[10px] text-gray-300 mt-0.5 whitespace-nowrap">
          {timeText}
        </div>
      </div>
    );
    
    // Zwischenmarkierungen
    const subInterval = interval / subMarkerCount;
    for (let i = 1; i < subMarkerCount; i++) {
      const subTime = time + (i * subInterval);
      if (subTime < duration) {
        const subPosition = subTime * pixelsPerSecond;
        markers.push(
          <div
            key={`sub-${subTime}`}
            className="absolute"
            style={{
              left: `${subPosition}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="h-2 w-[1px] bg-gray-600" />
          </div>
        );
      }
    }
  }

  return (
    <div className="h-8 relative border-b border-gray-700 bg-[#1a1a1a]">
      <div
        className="absolute top-0 left-0 h-full"
        style={{
          width: `${totalWidth}px`,
          transform: `translateX(${offset}px)`,
        }}
      >
        {markers}
      </div>
    </div>
  );
}
