'use client';

import React, { useState } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { MenuBar } from '@/components/menu-bar';
import { MediaBrowser } from '@/components/media-browser';
import { PreviewPanel } from '@/components/preview-panel';
import { Timeline } from '@/components/timeline';
import { Track, Clip } from './editor/types';
import { settings } from '@/config/editor-settings';

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
  const [timelineDuration, setTimelineDuration] = useState(settings.timeline.defaultDuration); // 60 Minuten

  // Berechne die benötigte Timeline-Dauer basierend auf allen Clips
  const calculateRequiredDuration = (currentTracks: Track[]) => {
    let maxEndTime = 0;
    
    currentTracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEndTime = clip.start + clip.duration;
        maxEndTime = Math.max(maxEndTime, clipEndTime);
      });
    });

    // Füge 30 Sekunden Puffer hinzu und runde auf die nächsten 10 Sekunden auf
    const newDuration = Math.ceil((maxEndTime + 30) / 10) * 10;
    
    // Mindestens 4 Minuten oder die berechnete Dauer, je nachdem was größer ist
    return Math.max(240, newDuration);
  };

  const handleClipSelect = (clipName: string) => {
    setSelectedClip(clipName);
  };

  const handleClipChange = (trackId: number, clipId: string, newStart: number, clipDuration: number) => {
    setTracks(prevTracks => {
      // Wenn die Dauer 0 ist, entferne den Clip
      if (clipDuration === 0) {
        const updatedTracks = prevTracks.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              clips: t.clips.filter(c => c.id !== clipId)
            };
          }
          return t;
        });

        // Aktualisiere die Timeline-Dauer nach dem Entfernen des Clips
        const newDuration = calculateRequiredDuration(updatedTracks);
        setTimelineDuration(newDuration);
        return updatedTracks;
      }

      let updatedTracks: Track[];

      // Wenn es ein Split-Operation ist
      if (clipId.includes('-1') || clipId.includes('-2')) {
        const originalClipId = clipId.split('-')[0];
        updatedTracks = prevTracks.map(t => {
          if (t.id === trackId) {
            const existingSplitClip = t.clips.find(c => c.id === clipId);
            if (existingSplitClip) {
              return {
                ...t,
                clips: t.clips.map(c => 
                  c.id === clipId 
                    ? { ...c, start: newStart, duration: clipDuration }
                    : c
                )
              };
            }

            return {
              ...t,
              clips: t.clips
                .filter(c => c.id !== originalClipId && c.duration > 0)
                .concat({
                  id: clipId,
                  name: `Clip ${clipId.includes('-1') ? '1' : '2'}`,
                  start: newStart,
                  duration: clipDuration,
                  type: t.type,
                })
                .sort((a, b) => a.start - b.start)
            };
          }
          return t;
        });
      } else {
        // Normaler Clip-Update oder neuer Clip
        updatedTracks = prevTracks.map(t => {
          if (t.id !== trackId) return t;
          
          const existingClip = t.clips.find(c => c.id === clipId);
          if (existingClip) {
            return {
              ...t,
              clips: t.clips.map(clip =>
                clip.id === clipId
                  ? { ...clip, start: newStart, duration: clipDuration }
                  : clip
              ),
            };
          }

          return {
            ...t,
            clips: [
              ...t.clips,
              {
                id: clipId,
                name: `Clip ${t.clips.length + 1}`,
                start: newStart,
                duration: clipDuration,
                type: t.type,
              },
            ].sort((a, b) => a.start - b.start),
          };
        });
      }

      // Berechne die neue Timeline-Dauer basierend auf allen Clips
      const newDuration = calculateRequiredDuration(updatedTracks);
      setTimelineDuration(newDuration);

      return updatedTracks;
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
            duration={timelineDuration}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}