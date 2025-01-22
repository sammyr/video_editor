'use client';

import React, { useState, useCallback } from 'react';
import { Track as TrackType, Clip } from '../editor/types';
import { TrackClip } from './TrackClip';
import { settings } from '@/config/editor-settings';

interface TrackProps {
  track: TrackType;
  zoom: number;
  selectedTool?: 'select' | 'razor' | 'hand';
  snapEnabled?: boolean;
  onClipSelect?: (clipId: string | null) => void;
  onClipChange?: (clipId: string, newStart: number, newDuration: number) => void;
  onClipSplit?: (clipId: string, splitPoint: number) => void;
}

export function Track({ 
  track, 
  zoom,
  selectedTool = 'select',
  snapEnabled = true,
  onClipSelect,
  onClipChange,
  onClipSplit
}: TrackProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const findNearestSnapPoint = useCallback((position: number, duration: number): number => {
    if (!snapEnabled) return position;

    // Snap-Schwelle in Sekunden (10 Pixel)
    const snapThreshold = 10 / (settings.timeline.pixelsPerSecond * zoom);
    let nearestPoint = position;
    let minDistance = snapThreshold;

    // Timeline-Start
    if (Math.abs(position) < snapThreshold) {
      return 0;
    }

    // Andere Clips
    track.clips.forEach(otherClip => {
      // Snap zum Start des anderen Clips
      const startDistance = Math.abs(position - otherClip.start);
      if (startDistance < minDistance) {
        minDistance = startDistance;
        nearestPoint = otherClip.start;
      }

      // Snap zum Ende des anderen Clips
      const endDistance = Math.abs(position - (otherClip.start + otherClip.duration));
      if (endDistance < minDistance) {
        minDistance = endDistance;
        nearestPoint = otherClip.start + otherClip.duration;
      }

      // Snap zum Ende unseres Clips an den Start des anderen Clips
      const ourEndToTheirStart = Math.abs((position + duration) - otherClip.start);
      if (ourEndToTheirStart < minDistance) {
        minDistance = ourEndToTheirStart;
        nearestPoint = otherClip.start - duration;
      }
    });

    return nearestPoint;
  }, [snapEnabled, zoom, track.clips]);

  const checkOverlap = useCallback((start: number, duration: number): boolean => {
    return track.clips.some(clip => {
      const clipEnd = start + duration;
      const existingClipEnd = clip.start + clip.duration;
      
      return (
        (start >= clip.start && start < existingClipEnd) ||
        (clipEnd > clip.start && clipEnd <= existingClipEnd) ||
        (start <= clip.start && clipEnd >= existingClipEnd)
      );
    });
  }, [track.clips]);

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
      if (!data) {
        console.log('Keine Daten im Drop-Event gefunden');
        return;
      }

      const mediaItem = JSON.parse(data);
      if (track.type !== mediaItem.type) {
        console.log('Track-Typ stimmt nicht überein:', track.type, mediaItem.type);
        return;
      }

      // Berechne die Position relativ zum Track-Content
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const timePosition = (mouseX - settings.tracks.headerWidth) / (settings.timeline.pixelsPerSecond * zoom);
      
      // Berechne die Dauer
      let duration = 0;
      if (typeof mediaItem.duration === 'string') {
        // Format: "MM:SS" oder "HH:MM:SS"
        const parts = mediaItem.duration.split(':');
        if (parts.length === 2) {
          // MM:SS Format
          duration = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else if (parts.length === 3) {
          // HH:MM:SS Format
          duration = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
      } else if (typeof mediaItem.duration === 'number') {
        duration = mediaItem.duration;
      }

      if (duration <= 0) {
        console.error('Ungültige Clip-Dauer:', duration);
        return;
      }

      // Finde den nächsten Snap-Punkt
      const basePosition = Math.max(0, timePosition);
      const snappedPosition = findNearestSnapPoint(basePosition, duration);

      // Generiere eine eindeutige ID für den neuen Clip
      const clipId = mediaItem.id || `clip-${Date.now()}`;

      // Prüfe auf Überlappungen
      if (!checkOverlap(snappedPosition, duration)) {
        console.log('Füge Clip hinzu:', {
          clipId,
          start: snappedPosition,
          duration
        });
        onClipChange?.(clipId, snappedPosition, duration);
      } else {
        console.log('Überlappung erkannt - Clip kann nicht platziert werden');
      }
    } catch (error) {
      console.error('Fehler beim Drop:', error);
    }
  };

  return (
    <div className="flex h-24">
      {/* Track-Header */}
      <div className="w-24 h-full bg-[#323232] border-r border-[#1a1a1a] flex flex-col justify-center px-2">
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

      {/* Track-Content */}
      <div 
        className={`relative flex-1 h-full border-b border-[#1a1a1a] ${
          isDragOver ? 'bg-blue-500/10' : 'bg-[#2b2b2b]'
        } ${track.type === 'video' ? 'bg-blue-950/20' : 'bg-green-950/20'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          cursor: selectedTool === 'razor' ? 'crosshair' : 'default'
        }}
      >
        {track.clips.map((clip) => (
          <TrackClip
            key={clip.id}
            clip={clip}
            zoom={zoom}
            selectedTool={selectedTool}
            snapEnabled={snapEnabled}
            onSelect={onClipSelect}
            onClipChange={(clipId, newStart, newDuration) =>
              onClipChange?.(clipId, newStart, newDuration)
            }
            onClipSplit={onClipSplit}
            allClips={track.clips}
          />
        ))}
      </div>
    </div>
  );
}
