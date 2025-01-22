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
  snapEnabled?: boolean;
  allTracks?: TrackProps[]; // Alle Tracks für Clip-Snapping
}

export function Track({ 
  track, 
  zoom, 
  onClipSelect, 
  onClipChange, 
  onClipSplit, 
  selectedTool,
  snapEnabled,
  allTracks = []
}: TrackComponentProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  // Prüft, ob ein Clip an der angegebenen Position eine Überlappung verursachen würde
  const checkOverlap = (clipId: string, newStart: number, duration: number): boolean => {
    return track.clips.some(existingClip => {
      if (existingClip.id === clipId) return false;
      
      const clipEnd = newStart + duration;
      const existingEnd = existingClip.start + existingClip.duration;
      
      return (
        (newStart >= existingClip.start && newStart < existingEnd) ||
        (clipEnd > existingClip.start && clipEnd <= existingEnd) ||
        (newStart <= existingClip.start && clipEnd >= existingEnd)
      );
    });
  };

  // Behandelt Änderungen an Clips mit Überlappungsprüfung
  const handleClipChange = (clipId: string, newStart: number, duration: number) => {
    if (!checkOverlap(clipId, newStart, duration)) {
      onClipChange?.(clipId, newStart, duration);
    }
  };

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

          // Prüfe auf Überlappungen beim Hinzufügen neuer Clips
          const clipId = `clip-${Date.now()}`;
          if (!checkOverlap(clipId, Math.max(0, snappedTime), duration)) {
            onClipChange?.(clipId, Math.max(0, snappedTime), duration);
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Drop:', error);
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

      <div className="absolute left-24 right-0 h-full">
        {track.clips.map((clip) => (
          <TrackClip
            key={clip.id}
            clip={clip}
            zoom={zoom}
            selectedTool={selectedTool}
            snapEnabled={snapEnabled}
            allClips={track.clips}
            onSelect={onClipSelect}
            onClipChange={(clipId, newStart, newDuration) =>
              handleClipChange(clipId, newStart, newDuration)
            }
            onClipSplit={(clipId, splitPoint) =>
              onClipSplit?.(clipId, splitPoint)
            }
          />
        ))}
      </div>
    </div>
  );
}
