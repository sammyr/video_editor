'use client';

import React, { useState } from 'react';
import { Clip } from '../editor/types';
import { settings } from '@/config/editor-settings';

interface TrackClipProps {
  clip: Clip;
  zoom: number;
  onSelect?: (clipName: string) => void;
  onClipChange?: (newStart: number, newDuration: number) => void;
  onClipSplit?: (clipId: string, splitPoint: number) => void;
  selectedTool?: 'select' | 'razor' | 'hand';
}

export function TrackClip({ clip, zoom, onSelect, onClipChange, onClipSplit, selectedTool }: TrackClipProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalStart, setOriginalStart] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'razor') {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const splitPoint = mouseX / (settings.timeline.pixelsPerSecond * zoom);
      onClipSplit?.(clip.id, clip.start + splitPoint);
      return;
    }

    if (selectedTool === 'select') {
      e.stopPropagation();
      setIsDragging(true);
      setDragStartX(e.clientX);
      setOriginalStart(clip.start);
      onSelect?.(clip.name);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedTool === 'select') {
      e.stopPropagation();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / (settings.timeline.pixelsPerSecond * zoom);
      const newStart = Math.max(0, originalStart + deltaTime);
      
      // Snapping-Logik
      const snapThreshold = 5 / (settings.timeline.pixelsPerSecond * zoom); // 5 Pixel in Zeit
      const snappedStart = Math.round(newStart * settings.timeline.snapGrid) / settings.timeline.snapGrid;
      
      if (Math.abs(newStart - snappedStart) < snapThreshold) {
        onClipChange?.(snappedStart, clip.duration);
      } else {
        onClipChange?.(newStart, clip.duration);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      className={`absolute h-full select-none ${
        clip.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'
      } ${isDragging ? 'opacity-75' : ''} ${
        selectedTool === 'razor' ? 'cursor-crosshair' : 'cursor-move'
      }`}
      style={{
        left: `${clip.start * settings.timeline.pixelsPerSecond * zoom}px`,
        width: `${clip.duration * settings.timeline.pixelsPerSecond * zoom}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`h-full border-l-2 border-r-2 ${
        clip.type === 'video' ? 'border-blue-500/30' : 'border-green-500/30'
      }`}>
        <div className="px-2 py-1">
          <div className="text-xs font-medium text-white/90 truncate">{clip.name}</div>
          <div className="text-[10px] text-white/60">
            {Math.floor(clip.duration)}s
          </div>
        </div>
      </div>
    </div>
  );
}
