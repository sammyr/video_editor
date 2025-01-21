'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Music, Search } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio';
  duration: string;
}

const mediaFilesData: MediaFile[] = [
  { id: '1', name: 'Video 1.mp4', type: 'video', duration: '0:30' },
  { id: '2', name: 'Audio 1.mp3', type: 'audio', duration: '1:00' },
  { id: '3', name: 'Video 2.mp4', type: 'video', duration: '1:30' },
  { id: '4', name: 'Audio 2.mp3', type: 'audio', duration: '2:00' },
  { id: '5', name: 'Video 3.mp4', type: 'video', duration: '2:30' },
  { id: '6', name: 'Audio 3.mp3', type: 'audio', duration: '3:00' },
];

export function MediaBrowser() {
  const [mediaFiles, setMediaFiles] = useState(mediaFilesData);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const draggableRefs = mediaFiles.map(() => useDraggable({
    id: `media-${Math.random()}`,
    data: {
      type: 'media',
    },
  }));

  const handleDragStart = (event: DragEvent<HTMLDivElement>, file: MediaFile) => {
    event.dataTransfer.setData('application/json', JSON.stringify(file));
  };

  const filteredFiles = mediaFiles
    .filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'duration') {
        return a.duration.localeCompare(b.duration);
      }
      return 0;
    });

  return (
    <div className="w-80 h-full bg-background border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Media Browser</h2>
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea className="h-[calc(100%-129px)]">
        <div className="p-4">
          {filteredFiles.map((file, index) => {
            const { attributes, listeners, setNodeRef, transform, isDragging } = draggableRefs[index];
            return (
              <div
                key={file.id}
                ref={setNodeRef}
                {...attributes}
                {...listeners}
                className={`p-3 rounded-lg border ${
                  file.type === 'video' ? 'bg-blue-50/5' : 'bg-green-50/5'
                } ${isDragging ? 'opacity-50' : ''} cursor-grab active:cursor-grabbing`}
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
                style={{
                  transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
                }}
              >
                <div className="flex items-center space-x-3">
                  {file.type === 'video' ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <Music className="w-5 h-5" />
                  )}
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {file.duration}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}