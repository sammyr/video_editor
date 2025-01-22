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
    console.log('handleClipChange:', { trackId, clipId, newStart, newDuration }); // Debug-Ausgabe
    
    setTracks(prevTracks => {
      const newTracks = prevTracks.map(track => {
        if (track.id !== trackId) return track;

        // Wenn es ein existierender Clip ist
        const existingClip = track.clips.find(c => c.id === clipId);
        if (existingClip) {
          return {
            ...track,
            clips: track.clips.map(clip =>
              clip.id === clipId
                ? { ...clip, start: newStart, duration: newDuration }
                : clip
            ),
          };
        }

        // Wenn es ein neuer Clip ist
        return {
          ...track,
          clips: [
            ...track.clips,
            {
              id: clipId,
              name: `Clip ${track.clips.length + 1}`,
              start: newStart,
              duration: newDuration,
              track: trackId,
              type: track.type,
            },
          ],
        };
      });

      console.log('New tracks state:', newTracks); // Debug-Ausgabe
      return newTracks;
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