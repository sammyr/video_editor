'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Track } from './editor/types';
import { Track as TrackComponent } from './tracks/Track';
import { TimelineRuler } from './timeline/TimelineRuler';
import { TimelineTools } from './timeline/TimelineTools';
import { settings } from '@/config/editor-settings';

interface TimelineProps {
  tracks: Track[];
  onClipSelect: (clipName: string) => void;
  onClipChange: (trackId: number, clipId: string, newStart: number, newDuration: number) => void;
  onTimelineOffsetChange: (offset: number) => void;
  onZoomChange: (zoom: number) => void;
}

export function Timeline({ tracks, onClipSelect, onClipChange, onTimelineOffsetChange, onZoomChange }: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState<'select' | 'razor' | 'hand'>('select');
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [startDragX, setStartDragX] = useState(0);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
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
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (isDraggingTimeline && selectedTool === 'hand') {
      const delta = (e.clientX - startDragX) / 2; // Halbiere die Bewegungsgeschwindigkeit
      const newOffset = timelineOffset + delta;
      setTimelineOffset(newOffset);
      onTimelineOffsetChange(newOffset);
      setStartDragX(e.clientX);
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
    const newClip1Id = `${clipId}-1`;
    const newClip2Id = `${clipId}-2`;

    // Aktualisiere den ersten Teil
    onClipChange(trackId, newClip1Id, clip.start, splitDuration);

    // Füge den zweiten Teil hinzu
    onClipChange(trackId, newClip2Id, splitPoint, remainingDuration);
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
    <div 
      className="h-full bg-[#1e1e1e] overflow-hidden flex flex-col"
      onMouseMove={handleTimelineMouseMove}
      onMouseUp={handleTimelineMouseUp}
      onMouseLeave={handleTimelineMouseUp}
      ref={timelineRef}
    >
      <TimelineTools
        zoom={zoom}
        onZoomChange={handleZoomChange}
        selectedTool={selectedTool}
        onToolChange={handleToolChange}
        currentTime={currentTime}
      />

      <TimelineRuler
        zoom={zoom}
        offset={timelineOffset}
        width={timelineWidth}
      />

      <div
        className="flex-1 relative overflow-auto"
        onMouseDown={handleTimelineMouseDown}
        style={{ cursor: isDraggingTimeline ? 'grabbing' : selectedTool === 'razor' ? 'crosshair' : 'default' }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translateX(${timelineOffset}px)` }}
        >
          {tracks.map((track) => (
            <TrackComponent
              key={track.id}
              track={track}
              zoom={zoom}
              selectedTool={selectedTool}
              onClipSelect={onClipSelect}
              onClipChange={(clipId, newStart, newDuration) =>
                onClipChange(track.id, clipId, newStart, newDuration)
              }
              onClipSplit={(clipId, splitPoint) =>
                handleClipSplit(track.id, clipId, splitPoint)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}