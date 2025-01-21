'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  selectedClip: string | null;
}

export function PreviewPanel({ selectedClip }: PreviewPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 relative">
        <Card className="absolute inset-4 flex items-center justify-center bg-muted">
          {selectedClip ? (
            <div className="text-center">
              <h3 className="text-lg font-medium">{selectedClip}</h3>
              <p className="text-sm text-muted-foreground">Vorschau</p>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p>Kein Clip ausgewählt</p>
            </div>
          )}
        </Card>
      </div>
      <div className="h-16 border-t flex items-center justify-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button variant="ghost" size="icon">
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
        <Button variant="ghost" size="icon">
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}