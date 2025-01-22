'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MediaFile } from './editor/types';

export function MediaBrowser() {
  const mediaFiles: MediaFile[] = [
    { name: 'Video 1', type: 'video', duration: '00:30' },
    { name: 'Video 2', type: 'video', duration: '01:00' },
    { name: 'Audio 1', type: 'audio', duration: '00:45' },
    { name: 'Audio 2', type: 'audio', duration: '02:00' },
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, file: MediaFile) => {
    // Setze die Drag-Effekte
    e.dataTransfer.effectAllowed = 'copy';
    
    // Setze ein visuelles Drag-Image
    const dragImage = document.createElement('div');
    dragImage.className = 'p-2 rounded bg-blue-500 text-white text-sm';
    dragImage.textContent = file.name;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);

    // Setze die Clip-Daten
    const clipData = {
      name: file.name,
      type: file.type,
      duration: file.duration
    };
    e.dataTransfer.setData('application/json', JSON.stringify(clipData));
  };

  return (
    <div className="h-full bg-[#1e1e1e] border-r border-[#2a2a2a]">
      <div className="p-4 border-b border-[#2a2a2a]">
        <h2 className="text-sm font-medium text-white/90">Media Browser</h2>
      </div>
      
      <ScrollArea className="h-[calc(100%-57px)]">
        <div className="p-4 space-y-2">
          {mediaFiles.map((file, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, file)}
              className={`
                p-3 rounded-lg cursor-move select-none
                ${file.type === 'video' ? 'bg-blue-500/10' : 'bg-green-500/10'}
                ${file.type === 'video' ? 'hover:bg-blue-500/20' : 'hover:bg-green-500/20'}
                transition-colors
              `}
            >
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  file.type === 'video' ? 'bg-blue-500/20' : 'bg-green-500/20'
                }`}>
                  {file.type === 'video' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
                      <path d="M4 4h16v12H4z" />
                      <path d="M2 18h20v2H2z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-500">
                      <path d="M12 3v18M3 12h18" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">{file.name}</div>
                  <div className="text-xs text-white/60">{file.duration}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}