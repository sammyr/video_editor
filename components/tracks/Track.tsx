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

  // Helper-Funktion für Debug-Logs
  const debugLog = (type: string, message: string, data: any, color: string = 'White') => {
    try {
      // Erstelle eine einzige PowerShell-Instanz für den Debug-Output
      const cmd = `Write-Host "[TRACK][${type}] ${message} | " -NoNewline; Write-Host '${JSON.stringify(data)}' -ForegroundColor ${color}`;
      console.log(`[TRACK][${type}]`, message, data);
    } catch (error) {
      console.error('Debug Log Fehler:', error);
    }
  };

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
      // Prüfe den Clip-Typ aus den Drag-Daten
      const rawData = e.dataTransfer.getData('application/json');
      if (rawData) {
        const dragData = JSON.parse(rawData);
        debugLog('DragOver', 'Clip über Track', {
          trackId: track.id,
          trackType: track.type,
          clipId: dragData.id,
          clipType: dragData.type,
          clipDuration: dragData.duration,
          mousePosition: {
            x: e.clientX,
            y: e.clientY
          }
        }, 'Yellow');

        if (dragData.type === track.type) {
          e.dataTransfer.dropEffect = 'copy';
          setIsDragOver(true);
        } else {
          e.dataTransfer.dropEffect = 'none';
          setIsDragOver(false);
        }
      }
    } catch (error) {
      debugLog('Error', 'Drag Over Fehler', error, 'Red');
      e.dataTransfer.dropEffect = 'none';
      setIsDragOver(false);
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
        debugLog('Error', 'Drop Fehler', 'Keine Daten im Drop-Event gefunden', 'Red');
        return;
      }

      const clipData = JSON.parse(data);
      if (track.type !== clipData.type) {
        debugLog('Error', 'Drop Fehler', `Track-Typ stimmt nicht überein: ${track.type} != ${clipData.type}`, 'Red');
        return;
      }

      // Berechne die Position relativ zum Track-Content
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const trackStartX = settings.tracks.headerWidth;
      const relativeX = Math.max(0, mouseX - trackStartX);
      const timePosition = relativeX / (settings.timeline.pixelsPerSecond * zoom);

      // Debug-Ausgabe für die Position
      debugLog('Position', 'Drop Position', {
        trackId: track.id,
        clipId: clipData.id,
        mouse: {
          absolute: e.clientX,
          relative: mouseX,
          trackRelative: relativeX
        },
        time: {
          position: timePosition,
          zoom
        },
        trackInfo: {
          headerWidth: settings.tracks.headerWidth,
          pixelsPerSecond: settings.timeline.pixelsPerSecond
        }
      }, 'Cyan');

      // Verwende die Original-Dauer oder die aktuelle Dauer
      const duration = clipData.duration;

      if (duration <= 0) {
        debugLog('Error', 'Drop Fehler', `Ungültige Clip-Dauer: ${duration}`, 'Red');
        return;
      }

      // Finde den nächsten Snap-Punkt
      const snappedPosition = findNearestSnapPoint(timePosition, duration);

      // Debug-Ausgabe für den Snap
      debugLog('Snap', 'Drop Snap Position', {
        trackId: track.id,
        clipId: clipData.id,
        original: timePosition,
        snapped: snappedPosition,
        duration,
        clips: track.clips.map(c => ({
          id: c.id,
          start: c.start,
          duration: c.duration
        }))
      }, 'Magenta');

      // Prüfe auf Überlappungen
      if (!checkOverlap(snappedPosition, duration)) {
        debugLog('Success', 'Drop Erfolgreich', {
          trackId: track.id,
          clipId: clipData.id,
          position: snappedPosition,
          duration: clipData.duration
        }, 'Green');

        onClipChange?.(clipData.id, snappedPosition, clipData.duration);
      } else {
        debugLog('Warning', 'Drop Überlappung', {
          trackId: track.id,
          clipId: clipData.id,
          position: snappedPosition,
          duration,
          existingClips: track.clips.map(c => ({
            id: c.id,
            start: c.start,
            duration: c.duration
          }))
        }, 'Red');
      }
    } catch (error) {
      debugLog('Error', 'Drop Fehler', error, 'Red');
    }
  };

  return (
    <div className="flex h-24">
      {/* Track-Header */}
      <div className="relative w-24 h-full bg-[#323232] border-r border-[#1a1a1a] flex flex-col justify-center px-2">
        <span className="text-xs font-medium text-[#888]">
          {track.type === 'video' ? `Video ${track.id + 1}` : `Audio ${track.id - 2}`}
        </span>
        <div className="flex items-center gap-1 mt-1">
          <div className={`w-3 h-3 rounded-sm ${track.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'}`} />
          <span className="text-[10px] text-[#666]">
            {track.type === 'video' ? 'VID' : 'AUD'}
          </span>
        </div>
        {/* Vertikale Linie am rechten Rand */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-[#1a1a1a]" />
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
        {/* Horizontale Linien für das Raster */}
        <div className="absolute inset-0">
          <div className="h-0 border-b border-[#666666] bg-[#1a1a1a]/00" />

        </div>

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
