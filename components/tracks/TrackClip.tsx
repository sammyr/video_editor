'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clip } from '../editor/types';
import { settings } from '@/config/editor-settings';

// Formatiere die Zeit in Sekunden
const formatSeconds = (seconds: number): string => {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    return '0s';
  }
  
  // Runde auf 2 Dezimalstellen
  return `${seconds.toFixed(2)}s`;
};

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

  // Helper-Funktion für Debug-Logs
  const debugLog = (type: string, message: string, data: any, color: string = 'White') => {
    try {
      // Erstelle eine einzige PowerShell-Instanz für den Debug-Output
      const cmd = `Write-Host "[CLIP][${type}] ${message} | " -NoNewline; Write-Host '${JSON.stringify(data)}' -ForegroundColor ${color}`;
      console.log(`[CLIP][${type}]`, message, data);
    } catch (error) {
      console.error('Debug Log Fehler:', error);
    }
  };

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
      
      debugLog('Razor', 'Split Position', {
        clipId: clip.id,
        splitPoint: clip.start + clipTime,
        clipStart: clip.start,
        clipDuration: clip.duration,
        position: {
          x: mouseX,
          absolute: e.clientX,
          relative: mouseX - rect.left
        }
      }, 'Yellow');
      
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

    debugLog('MouseDown', 'Clip Interaktion', {
      clipId: clip.id,
      position: {
        x: clickX,
        absolute: e.clientX,
        relative: clickX
      },
      isLeftHandle,
      isRightHandle,
      clipInfo: {
        start: clip.start,
        duration: clip.duration,
        end: clip.start + clip.duration
      }
    }, 'Green');

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

      debugLog('MouseMove', 'Trim Start', {
        operation: 'trim_start',
        clipId: clip.id,
        delta: {
          x: deltaX,
          time: deltaTime
        },
        position: {
          newStart,
          newDuration,
          originalStart,
          originalDuration
        }
      }, 'Magenta');

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

      debugLog('MouseMove', 'Trim End', {
        operation: 'trim_end',
        clipId: clip.id,
        delta: {
          x: deltaX,
          time: deltaTime
        },
        position: {
          newDuration,
          originalDuration
        }
      }, 'Magenta');

      if (!checkOverlap(clip.start, newDuration)) {
        onClipChange?.(clip.id, clip.start, newDuration);
      }
    } else if (isDragging) {
      // Normales Verschieben
      const newStart = Math.max(0, originalStart + deltaTime);
      const snappedStart = findNearestSnapPoint(newStart, clip.duration);

      debugLog('MouseMove', 'Drag', {
        operation: 'drag',
        clipId: clip.id,
        delta: {
          x: deltaX,
          time: deltaTime
        },
        position: {
          newStart,
          snappedStart,
          originalStart,
          duration: clip.duration
        }
      }, 'Blue');

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

  // Füge diese Funktion hinzu, um den Clip für Drag & Drop vorzubereiten
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (selectedTool !== 'select') {
      e.preventDefault();
      return;
    }

    const clipData = {
      ...clip,
      id: clip.id,
      start: clip.start,
      duration: clip.duration
    };
    
    debugLog('DragStart', 'Clip Daten', clipData, 'Cyan');
    
    e.dataTransfer.setData('application/json', JSON.stringify(clipData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Berechne die aktuelle Position basierend auf dem Zustand
  const currentPosition = clip.start;

  return (
    <div
      className={`absolute h-full select-none ${
        clip.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'
      } ${isDragging || isTrimming ? 'opacity-85' : ''} ${
        selectedTool === 'razor' ? 'cursor-crosshair' : 'cursor-move'
      } group`}
      style={{
        left: `${(clip.start * settings.timeline.pixelsPerSecond * zoom) + settings.tracks.headerWidth}px`,
        width: `${clip.duration * settings.timeline.pixelsPerSecond * zoom}px`,
        transition: isDragging || isTrimming ? 'none' : 'left 0.1s ease-out'
      }}
      onMouseDown={handleMouseDown}
      draggable={selectedTool === 'select'}
      onDragStart={handleDragStart}
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
          <div className="text-[10px] text-white/60 text-center">
            {formatSeconds(clip.duration)}
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
