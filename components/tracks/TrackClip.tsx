'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clip } from '../editor/types';
import { settings } from '@/config/editor-settings';

interface TrackClipProps {
  clip: Clip;
  zoom: number;
  onSelect?: (clipId: string | null) => void;
  onClipChange?: (clipId: string, newStart: number, newDuration: number) => void;
  onClipSplit?: (clipId: string, splitPoint: number) => void;
  selectedTool?: 'select' | 'razor' | 'hand';
  snapEnabled?: boolean;
  allClips?: Clip[];
}

export function TrackClip({ 
  clip, 
  zoom, 
  onSelect, 
  onClipChange, 
  onClipSplit, 
  selectedTool,
  snapEnabled = true,
  allClips = []
}: TrackClipProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isTrimming, setIsTrimming] = useState<'start' | 'end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalStart, setOriginalStart] = useState(0);
  const [originalDuration, setOriginalDuration] = useState(0);
  const lastValidPosition = useRef(clip.start);

  // Findet den nächsten Snap-Punkt für eine gegebene Position
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
    allClips
      .filter(c => c.id !== clip.id)
      .forEach(otherClip => {
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
  }, [snapEnabled, zoom, clip.id, allClips]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'razor') {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const clipTime = mouseX / (settings.timeline.pixelsPerSecond * zoom);
      onClipSplit?.(clip.id, clip.start + clipTime);
      return;
    }

    if (selectedTool !== 'select') return;
    if (e.button !== 0) return; // Nur linke Maustaste

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Prüfe ob wir auf einen der Trim-Griffe geklickt haben
    const isLeftHandle = clickX <= 6;
    const isRightHandle = clickX >= rect.width - 6;

    if (isLeftHandle) {
      setIsTrimming('start');
    } else if (isRightHandle) {
      setIsTrimming('end');
    } else {
      setIsDragging(true);
    }

    setDragStartX(e.clientX);
    setOriginalStart(clip.start);
    setOriginalDuration(clip.duration);
    onSelect?.(clip.id);
  };

  const checkOverlap = useCallback((newStart: number, newDuration: number): boolean => {
    return allClips.some(otherClip => {
      if (otherClip.id === clip.id) return false;
      
      const clipEnd = newStart + newDuration;
      const otherEnd = otherClip.start + otherClip.duration;
      
      return (
        (newStart >= otherClip.start && newStart < otherEnd) ||
        (clipEnd > otherClip.start && clipEnd <= otherEnd) ||
        (newStart <= otherClip.start && clipEnd >= otherEnd)
      );
    });
  }, [clip.id, allClips]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isTrimming) return;

    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / (settings.timeline.pixelsPerSecond * zoom);

    if (isTrimming === 'start') {
      // Trimmen vom Start
      const maxDeltaTime = originalDuration - settings.clips.minDuration;
      const clampedDeltaTime = Math.min(maxDeltaTime, Math.max(-originalStart, deltaTime));
      const newStart = Math.max(0, originalStart + clampedDeltaTime);
      const newDuration = originalDuration - (newStart - originalStart);

      if (newDuration >= settings.clips.minDuration) {
        const snappedStart = findNearestSnapPoint(newStart, newDuration);
        if (!checkOverlap(snappedStart, newDuration)) {
          onClipChange?.(clip.id, snappedStart, newDuration);
          lastValidPosition.current = snappedStart;
        }
      }
    } else if (isTrimming === 'end') {
      // Trimmen vom Ende
      const newDuration = Math.max(
        settings.clips.minDuration,
        originalDuration + deltaTime
      );

      if (!checkOverlap(clip.start, newDuration)) {
        onClipChange?.(clip.id, clip.start, newDuration);
      }
    } else if (isDragging) {
      // Normales Verschieben
      const newStart = Math.max(0, originalStart + deltaTime);
      const snappedStart = findNearestSnapPoint(newStart, clip.duration);
      
      // Prüfe auf Überlappungen
      if (!checkOverlap(snappedStart, clip.duration)) {
        onClipChange?.(clip.id, snappedStart, clip.duration);
        lastValidPosition.current = snappedStart;
      }
    }
  }, [
    isDragging,
    isTrimming,
    dragStartX,
    originalStart,
    originalDuration,
    zoom,
    clip,
    onClipChange,
    snapEnabled,
    findNearestSnapPoint,
    checkOverlap
  ]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsTrimming(null);
  }, []);

  useEffect(() => {
    if (isDragging || isTrimming) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isTrimming, handleMouseMove, handleMouseUp]);

  // Berechne die aktuelle Position basierend auf dem Zustand
  const currentPosition = clip.start;

  return (
    <div
      className={`absolute h-full select-none ${
        clip.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'
      } ${isDragging || isTrimming ? 'opacity-75' : ''} ${
        selectedTool === 'razor' ? 'cursor-crosshair' : 'cursor-move'
      } group`}
      style={{
        left: `${(currentPosition * settings.timeline.pixelsPerSecond * zoom) + settings.tracks.headerWidth}px`,
        width: `${clip.duration * settings.timeline.pixelsPerSecond * zoom}px`,
        transition: isDragging || isTrimming ? 'none' : 'left 0.1s ease-out'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Trim-Griff links */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize 
          ${selectedTool === 'select' ? 'group-hover:bg-white/20' : ''} 
          ${isTrimming === 'start' ? 'bg-white/40' : ''}`}
      />

      {/* Clip-Inhalt */}
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

      {/* Trim-Griff rechts */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize
          ${selectedTool === 'select' ? 'group-hover:bg-white/20' : ''} 
          ${isTrimming === 'end' ? 'bg-white/40' : ''}`}
      />
    </div>
  );
}
