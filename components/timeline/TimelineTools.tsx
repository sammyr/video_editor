'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';

interface TimelineToolsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  selectedTool: 'select' | 'razor' | 'hand';
  onToolChange: (tool: 'select' | 'razor' | 'hand') => void;
  currentTime: number;
  snapEnabled: boolean;
  onSnapChange: (enabled: boolean) => void;
}

export function TimelineTools({ 
  zoom, 
  onZoomChange, 
  selectedTool, 
  onToolChange, 
  currentTime,
  snapEnabled,
  onSnapChange 
}: TimelineToolsProps) {
  // Formatiere die aktuelle Zeit
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 30); // Annahme: 30fps
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center w-full gap-4">
      {/* Werkzeuge */}
      <div className="flex items-center gap-2">
        <button
          className={`p-2 rounded-lg ${selectedTool === 'select' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          onClick={() => onToolChange('select')}
          title="Auswahlwerkzeug (V)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
            <path d="M13 13l6 6"/>
          </svg>
        </button>
        
        <button
          className={`p-2 rounded-lg ${selectedTool === 'razor' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          onClick={() => onToolChange('razor')}
          title="Rasierklinge (C)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 3L9 15"/>
            <path d="M9 15l-6 2 2-6"/>
            <path d="M9 15l3-3"/>
          </svg>
        </button>

        <button
          className={`p-2 rounded-lg ${selectedTool === 'hand' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          onClick={() => onToolChange('hand')}
          title="Hand-Werkzeug (H)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
            <path d="M10 10V2a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
            <path d="M6 19v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"/>
          </svg>
        </button>

        {/* Snap-Button */}
        <button
          className={`p-2 rounded-lg ${snapEnabled ? 'bg-white/10' : 'hover:bg-white/5'}`}
          onClick={() => onSnapChange(!snapEnabled)}
          title="Snapping (S)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5v14"/>
            <path d="M19 5v14"/>
            <path d="M5 12h14"/>
          </svg>
        </button>
      </div>

      {/* Aktuelle Zeit */}
      <div className="bg-[#1e1e1e] px-3 py-1 rounded font-mono text-sm min-w-[100px] text-center">
        {formatTime(currentTime)}
      </div>

      {/* Zoom-Regler */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          className="p-2 rounded-lg hover:bg-white/5"
          onClick={() => onZoomChange(Math.max(0.1, zoom / 1.2))}
          title="Verkleinern (-)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/>
          </svg>
        </button>

        <div className="w-32">
          <Slider
            value={[zoom]}
            min={0.1}
            max={5}
            step={0.1}
            onValueChange={([value]) => onZoomChange(value)}
          />
        </div>

        <button
          className="p-2 rounded-lg hover:bg-white/5"
          onClick={() => onZoomChange(Math.min(5, zoom * 1.2))}
          title="Vergrößern (+)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14"/>
            <path d="M5 12h14"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
