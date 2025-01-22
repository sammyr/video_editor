'use client';

import React, { useState, useEffect } from 'react';
import { Clip } from '../editor/types';
import { settings } from '@/config/editor-settings';

interface TrackClipProps {
  clip: Clip;
  zoom: number;
  onSelect?: (clipName: string) => void;
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
  const [isHovering, setIsHovering] = useState(false);

  // Minimale Clip-Dauer in Sekunden
  const MIN_DURATION = 0.1;

  // Findet den nächsten Snap-Punkt für eine gegebene Position
  const findNearestSnapPoint = (position: number, isEndPoint: boolean = false): number => {
    if (!snapEnabled) return position;

    // Snap-Schwelle in Sekunden (10 Pixel)
    const snapThreshold = 10 / (settings.timeline.pixelsPerSecond * zoom);

    // Sammle alle möglichen Snap-Punkte
    let snapPoints: { position: number; priority: number }[] = [];

    // Clip-Snap-Punkte (höchste Priorität)
    allClips
      .filter(c => c.id !== clip.id)
      .forEach(c => {
        snapPoints.push({ position: c.start, priority: 1 }); // Start des Clips
        snapPoints.push({ position: c.start + c.duration, priority: 1 }); // Ende des Clips
      });

    // Timeline-Start (zweithöchste Priorität)
    snapPoints.push({ position: 0, priority: 2 });

    // Sekundenraster (niedrigste Priorität)
    const currentSecond = Math.round(position);
    const nearbySeconds = [-1, 0, 1]; // Prüfe auch benachbarte Sekunden
    nearbySeconds.forEach(offset => {
      const secondPosition = currentSecond + offset;
      if (secondPosition >= 0) {
        snapPoints.push({ position: secondPosition, priority: 3 });
      }
    });

    // Finde den nächstgelegenen Snap-Punkt
    let nearestPoint = position;
    let minDistance = snapThreshold;
    let highestPriority = Infinity;

    snapPoints.forEach(point => {
      const distance = Math.abs(position - point.position);
      if (distance <= snapThreshold) {
        // Wenn der Punkt näher ist oder die gleiche Distanz hat aber höhere Priorität
        if (distance < minDistance || (distance === minDistance && point.priority < highestPriority)) {
          minDistance = distance;
          nearestPoint = point.position;
          highestPriority = point.priority;
        }
      }
    });

    return nearestPoint;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'razor') {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const splitPoint = mouseX / (settings.timeline.pixelsPerSecond * zoom);
      onClipSplit?.(clip.id, clip.start + splitPoint);
      return;
    }

    if (selectedTool === 'select') {
      // Prüfe, ob wir auf einen der Trim-Griffe geklickt haben
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const isLeftHandle = clickX <= 6; // 6px = Breite des Trim-Griffs (1.5rem)
      const isRightHandle = clickX >= rect.width - 6;

      if (!isLeftHandle && !isRightHandle) {
        // Nur Drag & Drop starten, wenn wir nicht auf einen Trim-Griff geklickt haben
        e.stopPropagation();
        setIsDragging(true);
        setDragStartX(e.clientX);
        setOriginalStart(clip.start);
        setOriginalDuration(clip.duration);
        onSelect?.(clip.name);
      }
    }
  };

  const handleTrimStart = (e: React.MouseEvent) => {
    if (selectedTool === 'select') {
      e.stopPropagation();
      setIsTrimming('start');
      setDragStartX(e.clientX);
      setOriginalStart(clip.start);
      setOriginalDuration(clip.duration);
    }
  };

  const handleTrimEnd = (e: React.MouseEvent) => {
    if (selectedTool === 'select') {
      e.stopPropagation();
      setIsTrimming('end');
      setDragStartX(e.clientX);
      setOriginalStart(clip.start);
      setOriginalDuration(clip.duration);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((isDragging || isTrimming) && selectedTool === 'select') {
      e.stopPropagation();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / (settings.timeline.pixelsPerSecond * zoom);

      if (isTrimming === 'start') {
        // Trimmen vom Start
        const maxDeltaTime = originalDuration - MIN_DURATION;
        const clampedDeltaTime = Math.min(maxDeltaTime, Math.max(-originalStart, deltaTime));
        let newStart = originalStart + clampedDeltaTime;
        
        // Snap beim Trimmen vom Start
        newStart = findNearestSnapPoint(newStart, true);
        const newDuration = originalDuration - (newStart - originalStart);

        if (newDuration >= MIN_DURATION && !wouldOverlap(newStart, newDuration)) {
          onClipChange?.(clip.id, newStart, newDuration);
        }
      } else if (isTrimming === 'end') {
        // Trimmen vom Ende
        let newEnd = originalStart + originalDuration + deltaTime;
        
        // Snap beim Trimmen vom Ende
        newEnd = findNearestSnapPoint(newEnd, true);
        const newDuration = newEnd - originalStart;

        if (newDuration >= MIN_DURATION && !wouldOverlap(clip.start, newDuration)) {
          onClipChange?.(clip.id, clip.start, newDuration);
        }
      } else if (isDragging) {
        // Normales Verschieben
        let newStart = Math.max(0, originalStart + deltaTime);
        
        // Snap beim Verschieben
        newStart = findNearestSnapPoint(newStart);
        
        // Zusätzlich auf das Ende prüfen für besseres Snapping
        const newEnd = newStart + clip.duration;
        const snappedEnd = findNearestSnapPoint(newEnd, true);
        
        // Wenn das Ende näher an einem Snap-Punkt ist, von dort aus zurückrechnen
        const endDelta = Math.abs(newEnd - snappedEnd);
        const startDelta = Math.abs(newStart - findNearestSnapPoint(newStart));
        
        if (endDelta < startDelta) {
          newStart = snappedEnd - clip.duration;
        }

        if (!wouldOverlap(newStart)) {
          onClipChange?.(clip.id, newStart, clip.duration);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsTrimming(null);
  };

  const wouldOverlap = (newStart: number, newDuration: number = clip.duration): boolean => {
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
  };

  useEffect(() => {
    if (isDragging || isTrimming) {
      window.addEventListener('mousemove', handleMouseMove as any);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove as any);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isTrimming]);

  return (
    <div
      className={`absolute h-full select-none ${
        clip.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'
      } ${isDragging || isTrimming ? 'opacity-75' : ''} ${
        selectedTool === 'razor' ? 'cursor-crosshair' : 'cursor-move'
      } group`}
      style={{
        left: `${clip.start * settings.timeline.pixelsPerSecond * zoom}px`,
        width: `${clip.duration * settings.timeline.pixelsPerSecond * zoom}px`,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Trim-Griff links */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize 
          ${selectedTool === 'select' ? 'group-hover:bg-white/20' : ''} 
          ${isTrimming === 'start' ? 'bg-white/40' : ''}`}
        onMouseDown={handleTrimStart}
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
        onMouseDown={handleTrimEnd}
      />
    </div>
  );
}
