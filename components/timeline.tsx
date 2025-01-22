'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Track, Clip } from './editor/types';
import { Track as TrackComponent } from './tracks/Track';
import { TimelineRuler } from './timeline/TimelineRuler';
import { TimelineTools } from './timeline/TimelineTools';
import { settings } from '@/config/editor-settings';

interface TimelineProps {
  tracks: Track[];
  onClipSelect: (clipId: string | null) => void;
  onClipChange: (trackId: number, clipId: string, newStart: number, newDuration: number) => void;
  onTimelineOffsetChange?: (offset: number) => void;
  onZoomChange: (zoom: number) => void;
  duration: number;
}

export function Timeline({ 
  tracks, 
  onClipSelect, 
  onClipChange, 
  onTimelineOffsetChange, 
  onZoomChange, 
  duration 
}: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState<'select' | 'razor' | 'hand'>('select');
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [startDragX, setStartDragX] = useState(0);
  const [startOffset, setStartOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'hand' && e.target === e.currentTarget) {
      setIsDraggingTimeline(true);
      setStartDragX(e.clientX);
      setStartOffset(timelineOffset);
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (isDraggingTimeline && selectedTool === 'hand') {
      const delta = e.clientX - startDragX;
      const newOffset = startOffset + delta;
      setTimelineOffset(newOffset);
      onTimelineOffsetChange?.(newOffset);
    }
  };

  const handleTimelineMouseUp = () => {
    setIsDraggingTimeline(false);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    onZoomChange(newZoom);
  };

  const handleToolChange = (tool: 'select' | 'razor' | 'hand') => {
    setSelectedTool(tool);
  };

  const handleClipSplit = (trackId: number, clipId: string, splitPoint: number) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;

    // Berechne die Position und Dauer der beiden neuen Clips
    const splitDuration = splitPoint - clip.start;
    const remainingDuration = clip.duration - splitDuration;

    // Erstelle die neuen Clips
    const newClip1: Clip = {
      id: `${clipId}-1`,
      name: `${clip.name} (1)`,
      start: clip.start,
      duration: splitDuration,
      type: clip.type,
      track: trackId
    };

    const newClip2: Clip = {
      id: `${clipId}-2`,
      name: `${clip.name} (2)`,
      start: splitPoint,
      duration: remainingDuration,
      type: clip.type,
      track: trackId
    };

    // Aktualisiere den State über die Parent-Komponente
    // Entferne zuerst den ursprünglichen Clip
    onClipChange(trackId, clipId, 0, 0);
    // Füge dann die neuen Clips hinzu
    onClipChange(trackId, newClip1.id, newClip1.start, newClip1.duration);
    onClipChange(trackId, newClip2.id, newClip2.start, newClip2.duration);
  };

  // Tastaturkürzel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'v':
          setSelectedTool('select');
          break;
        case 'c':
          setSelectedTool('razor');
          break;
        case 'h':
          setSelectedTool('hand');
          break;
        case 's':
          setSnapEnabled(prev => !prev);
          break;
        case '-':
          handleZoomChange(Math.max(0.1, zoom / 1.2));
          break;
        case '+':
        case '=':
          handleZoomChange(Math.min(5, zoom * 1.2));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  return (
    <div className="flex flex-col w-full h-full bg-[#1a1a1a] select-none">
      {/* Werkzeugleiste */}
      <div className="flex items-center h-12 px-4 bg-[#2b2b2b] border-b border-[#1a1a1a]">
        <TimelineTools
          selectedTool={selectedTool}
          onToolChange={handleToolChange}
          zoom={zoom}
          onZoomChange={handleZoomChange}
          snapEnabled={snapEnabled}
          onSnapChange={setSnapEnabled}
          currentTime={currentTime}
        />
      </div>

      {/* Timeline-Container */}
      <div 
        ref={timelineRef}
        className="relative flex flex-col flex-1 overflow-hidden"
        onMouseDown={handleTimelineMouseDown}
        onMouseMove={handleTimelineMouseMove}
        onMouseUp={handleTimelineMouseUp}
        onMouseLeave={handleTimelineMouseUp}
      >
        {/* Zeitlineal */}
        <TimelineRuler 
          zoom={zoom}
          duration={duration}
          offset={timelineOffset}
          width={timelineWidth}
          currentTime={currentTime}
        />

        {/* Tracks */}
        <div className="flex-1 overflow-y-auto">
          {tracks.map((track) => (
            <TrackComponent
              key={track.id}
              track={track}
              zoom={zoom}
              selectedTool={selectedTool}
              snapEnabled={snapEnabled}
              onClipSelect={onClipSelect}
              onClipChange={(clipId, newStart, newDuration) => {
                onClipChange(track.id, clipId, newStart, newDuration);
              }}
              onClipSplit={(clipId, splitPoint) => {
                handleClipSplit(track.id, clipId, splitPoint);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}