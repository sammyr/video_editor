'use client';

import React, { useState } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { MenuBar } from '@/components/menu-bar';
import { MediaBrowser } from '@/components/media-browser';
import { PreviewPanel } from '@/components/preview-panel';
import { Timeline } from '@/components/timeline';
import { Track, Clip } from './editor/types';

export function Editor() {
  const [tracks, setTracks] = useState<Track[]>([
    { id: 0, type: 'video', clips: [] },
    { id: 1, type: 'video', clips: [] },
    { id: 2, type: 'video', clips: [] },
    { id: 3, type: 'audio', clips: [] },
    { id: 4, type: 'audio', clips: [] },
    { id: 5, type: 'audio', clips: [] },
  ]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [timelineOffset, setTimelineOffset] = useState(0);
  const [zoom, setZoom] = useState(1);

  const handleClipSelect = (clipName: string) => {
    setSelectedClip(clipName);
  };

  const handleClipChange = (trackId: number, clipId: string, newStart: number, newDuration: number) => {
    setTracks(prevTracks => {
      // Wenn die Dauer 0 ist, entferne den Clip
      if (newDuration === 0) {
        return prevTracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: t.clips.filter(c => c.id !== clipId)
            };
          }
          return t;
        });
      }

      // Finde den Track
      const track = prevTracks.find(t => t.id === trackId);
      if (!track) return prevTracks;

      // Wenn es ein Split-Operation ist (clipId enthält "-1" oder "-2")
      if (clipId.includes('-1') || clipId.includes('-2')) {
        const originalClipId = clipId.split('-')[0];
        
        // Prüfe, ob der Split-Clip bereits existiert
        const existingSplitClip = track.clips.find(c => c.id === clipId);
        if (existingSplitClip) {
          // Aktualisiere nur die Position des existierenden Split-Clips
          return prevTracks.map(t => {
            if (t.id === trackId) {
              return {
                ...t,
                clips: t.clips.map(c => 
                  c.id === clipId 
                    ? { ...c, start: newStart, duration: newDuration }
                    : c
                )
              };
            }
            return t;
          });
        }

        // Erstelle einen neuen Split-Clip
        return prevTracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: t.clips
                .filter(c => c.id !== originalClipId && c.duration > 0) // Entferne den ursprünglichen Clip und Clips mit Dauer 0
                .concat({ // Füge den neuen Clip hinzu
                  id: clipId,
                  name: `Clip ${clipId.includes('-1') ? '1' : '2'}`,
                  start: newStart,
                  duration: newDuration,
                  track: trackId,
                  type: t.type,
                })
                .sort((a, b) => a.start - b.start) // Sortiere nach Startzeit
            };
          }
          return t;
        });
      }

      // Normaler Clip-Update oder neuer Clip
      return prevTracks.map(t => {
        if (t.id !== trackId) return t;

        const existingClip = t.clips.find(c => c.id === clipId);
        if (existingClip) {
          return {
            ...t,
            clips: t.clips.map(clip =>
              clip.id === clipId
                ? { ...clip, start: newStart, duration: newDuration }
                : clip
            ),
          };
        }

        // Neuer Clip
        return {
          ...t,
          clips: [
            ...t.clips,
            {
              id: clipId,
              name: `Clip ${t.clips.length + 1}`,
              start: newStart,
              duration: newDuration,
              track: trackId,
              type: t.type,
            },
          ].sort((a, b) => a.start - b.start),
        };
      });
    });
  };

  return (
    <div className="h-screen bg-[#232323]">
      <MenuBar />
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={70}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={20} minSize={15}>
              <MediaBrowser />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={80}>
              <PreviewPanel selectedClip={selectedClip} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={30}>
          <Timeline 
            tracks={tracks}
            onClipSelect={handleClipSelect}
            onClipChange={handleClipChange}
            onTimelineOffsetChange={setTimelineOffset}
            onZoomChange={setZoom}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}