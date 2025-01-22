'use client';

import React, { useState } from 'react';
import { TrackProps } from '../editor/types';
import { TrackClip } from './TrackClip';
import { settings } from '@/config/editor-settings';

interface TrackComponentProps extends TrackProps {
  zoom: number;
  onClipSelect?: (clipName: string) => void;
  onClipChange?: (clipId: string, newStart: number, newDuration: number) => void;
  onClipSplit?: (clipId: string, splitPoint: number) => void;
  selectedTool?: 'select' | 'razor' | 'hand';
}

export function Track({ track, zoom, onClipSelect, onClipChange, onClipSplit, selectedTool }: TrackComponentProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const data = e.dataTransfer.types.includes('application/json');
      if (data) {
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
      }
    } catch (error) {
      console.error('Fehler beim Drag Over:', error);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const mediaItem = JSON.parse(data);
        if (track.type === mediaItem.type) {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const timePosition = mouseX / (settings.timeline.pixelsPerSecond * zoom);
          const snappedTime = Math.round(timePosition * settings.timeline.snapGrid) / settings.timeline.snapGrid;

          const duration = typeof mediaItem.duration === 'string'
            ? parseFloat(mediaItem.duration.split(':').reduce((acc: number, time: string) => (60 * acc) + parseFloat(time), 0))
            : (typeof mediaItem.duration === 'number' ? mediaItem.duration : 30);

          const clipId = `clip-${Date.now()}`;
          onClipChange?.(clipId, Math.max(0, snappedTime), duration);
        }
      }
    } catch (error) {
      console.error('Fehler beim Drop:', error);
    }
  };

  const handleClipSplit = (clipId: string, splitPoint: number) => {
    const clip = track.clips.find(c => c.id === clipId);
    if (clip && onClipSplit) {
      onClipSplit(clipId, splitPoint);
    }
  };

  return (
    <div
      className={`relative h-24 border-b border-[#1a1a1a] transition-colors ${
        isDragOver
          ? track.type === 'video'
            ? 'bg-blue-500/10'
            : 'bg-green-500/10'
          : 'bg-[#2b2b2b]'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragExit={handleDragLeave}
      onDrop={handleDrop}
      style={{
        cursor: selectedTool === 'razor' ? 'crosshair' : 'default'
      }}
    >
      <div className="absolute left-0 top-0 w-24 h-full bg-[#323232] border-r border-[#1a1a1a] flex flex-col justify-center px-2">
        <span className="text-xs font-medium text-[#888]">
          {track.type === 'video' ? `Video ${track.id + 1}` : `Audio ${track.id - 2}`}
        </span>
        <div className="flex items-center gap-1 mt-1">
          <div className={`w-3 h-3 rounded-sm ${track.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'}`} />
          <span className="text-[10px] text-[#666]">
            {track.type === 'video' ? 'VID' : 'AUD'}
          </span>
        </div>
      </div>
      
      <div className="ml-24 h-full relative">
        {track.clips.map((clip) => (
          <TrackClip
            key={clip.id}
            clip={clip}
            zoom={zoom}
            onSelect={onClipSelect}
            onClipChange={(newStart, newDuration) => 
              onClipChange?.(clip.id, newStart, newDuration)
            }
            onClipSplit={handleClipSplit}
            selectedTool={selectedTool}
          />
        ))}
      </div>
    </div>
  );
}
