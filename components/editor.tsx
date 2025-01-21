'use client';

import React, { useState } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';
import { MenuBar } from '@/components/menu-bar';
import { MediaBrowser } from '@/components/media-browser';
import { PreviewPanel } from '@/components/preview-panel';
import { Timeline } from '@/components/timeline';
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

export function Editor() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<any>(null);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id.toString().startsWith('track-')) {
      const trackId = parseInt(over.id.toString().split('-')[1]);
      const mediaItem = active.data.current;
      
      if (mediaItem) {
        const trackType = over.data.current?.type;
        if (trackType === mediaItem.type) {
          const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
          if (trackElement) {
            const dropEvent = new CustomEvent('clipDrop', {
              detail: {
                trackId,
                mediaItem: {
                  ...mediaItem,
                  start: 0,
                  duration: mediaItem.duration || 30,
                }
              }
            });
            trackElement.dispatchEvent(dropEvent);
          }
        }
      }
    }

    setActiveId(null);
    setActiveDragData(null);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleClipSelect = (clipName: string) => {
    setSelectedClip(clipName);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-screen bg-background">
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
            <Timeline onClipSelect={handleClipSelect} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DndContext>
  );
}