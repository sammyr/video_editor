'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';

interface TimelineToolsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  selectedTool: 'select' | 'razor' | 'hand';
  onToolChange: (tool: 'select' | 'razor' | 'hand') => void;
  currentTime: number;
}

export function TimelineTools({ zoom, onZoomChange, selectedTool, onToolChange, currentTime }: TimelineToolsProps) {
  // Formatiere die aktuelle Zeit
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 30); // Annahme: 30fps
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-12 bg-[#2a2a2a] border-b border-[#1a1a1a] flex items-center px-4 gap-4">
      {/* Werkzeuge */}
      <div className="flex items-center gap-2">
        <button
          className={`p-2 rounded-lg ${selectedTool === 'select' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          onClick={() => onToolChange('select')}
          title="Auswahlwerkzeug (V)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M13 1l3.5 3.5-10 10L3 18l3.5-3.5 10-10z" />
          </svg>
        </button>
        
        <button
          className={`p-2 rounded-lg ${selectedTool === 'razor' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          onClick={() => onToolChange('razor')}
          title="Rasierklinge (C)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M19 3L5 17l-2 4 4-2L21 5z" />
          </svg>
        </button>

        <button
          className={`p-2 rounded-lg ${selectedTool === 'hand' ? 'bg-white/10' : 'hover:bg-white/5'}`}
          onClick={() => onToolChange('hand')}
          title="Hand-Werkzeug (H)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M12 1c-3.3 0-6 2.7-6 6v6l-2 2v3h16v-3l-2-2V7c0-3.3-2.7-6-6-6z" />
          </svg>
        </button>
      </div>

      {/* Aktuelle Zeit */}
      <div className="bg-[#1e1e1e] px-3 py-1 rounded font-mono text-sm">
        {formatTime(currentTime)}
      </div>

      {/* Zoom-Regler */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          className="p-2 rounded-lg hover:bg-white/5"
          onClick={() => onZoomChange(Math.max(0.1, zoom / 1.2))}
          title="Verkleinern (-)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        </button>
        
        <Slider
          value={[zoom]}
          min={0.1}
          max={5}
          step={0.1}
          onValueChange={([value]) => onZoomChange(value)}
          className="w-32"
        />
        
        <button
          className="p-2 rounded-lg hover:bg-white/5"
          onClick={() => onZoomChange(Math.min(5, zoom * 1.2))}
          title="Vergrößern (+)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
