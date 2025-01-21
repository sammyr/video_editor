'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useDroppable } from '@dnd-kit/core';
import {
  ZoomIn,
  ZoomOut,
  Scissors,
  MousePointer,
  ChevronRight,
} from 'lucide-react';

interface Clip {
  id: string;
  name: string;
  start: number;
  duration: number;
  track: number;
  type: 'video' | 'audio';
  thumbnail?: string;
}

interface Track {
  id: number;
  type: 'video' | 'audio';
  clips: Clip[];
}

interface TimelineProps {
  onClipSelect: (clipName: string) => void;
}

export function Timeline({ onClipSelect }: TimelineProps) {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 0, type: 'video', clips: [] },
    { id: 1, type: 'video', clips: [] },
    { id: 2, type: 'video', clips: [] },
    { id: 3, type: 'audio', clips: [] },
    { id: 4, type: 'audio', clips: [] },
    { id: 5, type: 'audio', clips: [] },
  ]);
  const [zoom, setZoom] = useState(1);
  const [playhead, setPlayhead] = useState(0);
  const [selectedTool, setSelectedTool] = useState<'select' | 'cut'>('select');
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false);
  const [startDragX, setStartDragX] = useState(0);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Separate Droppable für jede Spur
  const droppableTrackRefs = tracks.map((track) => ({
    ...useDroppable({
      id: `track-${track.id}`,
      data: {
        trackId: track.id,
        type: track.type,
      },
    }),
    type: track.type,
  }));

  useEffect(() => {
    const handleClipDrop = (event: CustomEvent) => {
      const { trackId, mediaItem } = event.detail;
      const track = tracks.find(t => t.id === trackId);
      
      if (!track) return;
      if (track.type !== mediaItem.type) return;

      const newClip: Clip = {
        id: `clip-${Date.now()}`,
        name: mediaItem.name,
        start: Math.max(0, (playhead - timelineOffset) / (100 * zoom)),
        duration: mediaItem.duration,
        track: trackId,
        type: track.type,
      };

      setTracks(prevTracks =>
        prevTracks.map(t =>
          t.id === trackId
            ? { ...t, clips: [...t.clips, newClip] }
            : t
        )
      );
    };

    // Event-Listener für jede Spur registrieren
    tracks.forEach(track => {
      const trackElement = document.querySelector(`[data-track-id="${track.id}"]`);
      if (trackElement) {
        trackElement.addEventListener('clipDrop', handleClipDrop as EventListener);
      }
    });

    return () => {
      // Event-Listener entfernen
      tracks.forEach(track => {
        const trackElement = document.querySelector(`[data-track-id="${track.id}"]`);
        if (trackElement) {
          trackElement.removeEventListener('clipDrop', handleClipDrop as EventListener);
        }
      });
    };
  }, [tracks, playhead, timelineOffset, zoom]);

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'select') {
      setIsDraggingTimeline(true);
      setStartDragX(e.clientX - timelineOffset);
    }
  };

  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (isDraggingTimeline && selectedTool === 'select') {
      const newOffset = e.clientX - startDragX;
      setTimelineOffset(newOffset);
    }
  };

  const handleTimelineMouseUp = () => {
    setIsDraggingTimeline(false);
  };

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingTimeline(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const renderTimeMarkers = () => {
    const markers = [];
    const totalWidth = 3000 * zoom; // Arbitrary timeline width
    const interval = 100 * zoom; // Marker interval in pixels
    
    for (let i = 0; i <= totalWidth; i += interval) {
      const seconds = Math.floor(i / (100 * zoom));
      markers.push(
        <div
          key={i}
          className="absolute top-0 h-4 border-l border-border"
          style={{ left: `${i}px` }}
        >
          <span className="text-xs text-muted-foreground ml-1">
            {seconds}s
          </span>
        </div>
      );
    }
    return markers;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-2 border-b flex items-center gap-2">
        <Button
          variant={selectedTool === 'select' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setSelectedTool('select')}
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        <Button
          variant={selectedTool === 'cut' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => setSelectedTool('cut')}
        >
          <Scissors className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoom(z => z + 0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div 
          className="relative" 
          style={{ minHeight: '500px' }}
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseUp={handleTimelineMouseUp}
        >
          {/* Time markers */}
          <div className="sticky top-0 h-6 bg-background border-b z-10">
            {renderTimeMarkers()}
          </div>
          
          {/* Tracks */}
          <div 
            className="relative" 
            style={{ 
              transform: `translateX(${timelineOffset}px)`,
              transition: isDraggingTimeline ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {tracks.map((track, index) => {
              const { setNodeRef, isOver } = droppableTrackRefs[index];
              return (
                <div
                  key={track.id}
                  ref={setNodeRef}
                  data-track-id={track.id}
                  className={`relative h-20 border-b ${
                    track.type === 'video' 
                      ? isOver 
                        ? 'bg-blue-100/20' 
                        : 'bg-blue-50/5'
                      : isOver 
                        ? 'bg-green-100/20' 
                        : 'bg-green-50/5'
                  }`}
                >
                  {/* Track label */}
                  <div className="absolute left-0 top-0 w-24 h-full bg-muted/50 border-r flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {track.type === 'video' ? `Video ${track.id + 1}` : `Audio ${track.id - 2}`}
                    </span>
                  </div>
                  
                  {/* Clips container */}
                  <div className="ml-24 h-full relative">
                    {track.clips.map((clip) => (
                      <div
                        key={clip.id}
                        className={`absolute h-16 border rounded cursor-pointer ${
                          clip.type === 'video'
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-green-500/20 border-green-500'
                        }`}
                        style={{
                          left: `${clip.start * 100 * zoom}px`,
                          width: `${clip.duration * 100 * zoom}px`,
                          top: '8px',
                        }}
                        onClick={() => onClipSelect(clip.name)}
                      >
                        <div className="p-2 truncate text-sm">{clip.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}