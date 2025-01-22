# Timeline-Editor Dokumentation

## Übersicht
Der Timeline-Editor ist eine professionelle Videobearbeitungskomponente, die auf React und TypeScript basiert. Sie ermöglicht das Drag & Drop von Medien-Clips, präzises Schneiden mit der Rasierklinge und eine flexible Zeitleistensteuerung.

## Komponenten-Struktur

```
components/
├── timeline/
│   ├── TimelineRuler.tsx    # Zeitlineal mit Markierungen
│   └── TimelineTools.tsx    # Werkzeugleiste (Auswahl, Rasierklinge, Hand)
├── tracks/
│   ├── Track.tsx           # Einzelne Videospur
│   └── TrackClip.tsx       # Medien-Clip in der Spur
└── timeline.tsx            # Hauptkomponente
```

## Kernfunktionen

### 1. Clip-Management

#### Clip-Datenstruktur
```typescript
interface Clip {
  id: string;
  name: string;
  start: number;      // Startposition in Sekunden
  duration: number;   // Dauer in Sekunden
  type: 'video' | 'audio';
  track: number;      // Track-ID
}
```

#### Clip-Splitting
```typescript
// In Timeline.tsx
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

  // Entferne zuerst den ursprünglichen Clip
  onClipChange(trackId, clipId, 0, 0);
  // Füge dann die neuen Clips hinzu
  onClipChange(trackId, newClip1.id, newClip1.start, newClip1.duration);
  onClipChange(trackId, newClip2.id, newClip2.start, newClip2.duration);
};
```

#### Clip-Verwaltung
```typescript
// In Editor.tsx
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

    // Split-Operation
    if (clipId.includes('-1') || clipId.includes('-2')) {
      const originalClipId = clipId.split('-')[0];
      const track = prevTracks.find(t => t.id === trackId);
      
      // Aktualisiere existierenden Split-Clip
      const existingSplitClip = track?.clips.find(c => c.id === clipId);
      if (existingSplitClip) {
        return prevTracks.map(t => ({
          ...t,
          clips: t.id === trackId 
            ? t.clips.map(c => c.id === clipId 
                ? { ...c, start: newStart, duration: newDuration }
                : c)
            : t.clips
        }));
      }

      // Erstelle neuen Split-Clip
      return prevTracks.map(t => t.id === trackId ? {
        ...t,
        clips: t.clips
          .filter(c => c.id !== originalClipId && c.duration > 0)
          .concat({
            id: clipId,
            name: `Clip ${clipId.includes('-1') ? '1' : '2'}`,
            start: newStart,
            duration: newDuration,
            track: trackId,
            type: t.type,
          })
          .sort((a, b) => a.start - b.start)
      } : t);
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
```

### 2. Drag & Drop System

#### TrackClip-Komponente
```typescript
// In TrackClip.tsx
export function TrackClip({ clip, zoom, onSelect, onClipChange, onClipSplit, selectedTool }: TrackClipProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [originalStart, setOriginalStart] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'razor') {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const splitPoint = mouseX / (settings.timeline.pixelsPerSecond * zoom);
      onClipSplit?.(clip.id, clip.start + splitPoint);
      return;
    }

    if (selectedTool === 'select') {
      e.stopPropagation();
      setIsDragging(true);
      setDragStartX(e.clientX);
      setOriginalStart(clip.start);
      onSelect?.(clip.name);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedTool === 'select') {
      e.stopPropagation();
      const deltaX = e.clientX - dragStartX;
      const deltaTime = deltaX / (settings.timeline.pixelsPerSecond * zoom);
      const newStart = Math.max(0, originalStart + deltaTime);
      
      // Snapping
      const snapThreshold = 5 / (settings.timeline.pixelsPerSecond * zoom);
      const snappedStart = Math.round(newStart * settings.timeline.snapGrid) / settings.timeline.snapGrid;
      
      if (Math.abs(newStart - snappedStart) < snapThreshold) {
        onClipChange?.(snappedStart, clip.duration);
      } else {
        onClipChange?.(newStart, clip.duration);
      }
    }
  };
}
```

### 3. Werkzeuge

#### TimelineTools-Komponente
```typescript
// In TimelineTools.tsx
export function TimelineTools({ zoom, onZoomChange, selectedTool, onToolChange, currentTime }: TimelineToolsProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const frames = Math.floor((time % 1) * 30);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-12 bg-[#2a2a2a] border-b border-[#1a1a1a] flex items-center px-4 gap-4">
      {/* Werkzeuge */}
      <div className="flex items-center gap-2">
        <button onClick={() => onToolChange('select')} title="Auswahlwerkzeug (V)">
          {/* SVG für Auswahlwerkzeug */}
        </button>
        <button onClick={() => onToolChange('razor')} title="Rasierklinge (C)">
          {/* SVG für Rasierklinge */}
        </button>
        <button onClick={() => onToolChange('hand')} title="Hand-Werkzeug (H)">
          {/* SVG für Hand-Werkzeug */}
        </button>
      </div>

      {/* Aktuelle Zeit */}
      <div className="bg-[#1e1e1e] px-3 py-1 rounded font-mono text-sm">
        {formatTime(currentTime)}
      </div>

      {/* Zoom-Steuerung */}
      <div className="flex items-center gap-2 ml-auto">
        <button onClick={() => onZoomChange(Math.max(0.1, zoom / 1.2))}>
          {/* SVG für Verkleinern */}
        </button>
        <Slider
          value={[zoom]}
          min={0.1}
          max={5}
          step={0.1}
          onValueChange={([value]) => onZoomChange(value)}
          className="w-32"
        />
        <button onClick={() => onZoomChange(Math.min(5, zoom * 1.2))}>
          {/* SVG für Vergrößern */}
        </button>
      </div>
    </div>
  );
}
```

## Implementierungsdetails

### 1. Konfiguration
```typescript
// config/editor-settings.ts
export const settings = {
  timeline: {
    pixelsPerSecond: 100,
    snapGrid: 0.1,  // Sekunden
    minZoom: 0.1,
    maxZoom: 5
  }
};
```

### 2. Event-Handling

#### Tastaturkürzel
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'v': setSelectedTool('select'); break;
      case 'c': setSelectedTool('razor'); break;
      case 'h': setSelectedTool('hand'); break;
      case '-': handleZoomChange(Math.max(0.1, zoom / 1.2)); break;
      case '+':
      case '=': handleZoomChange(Math.min(5, zoom * 1.2)); break;
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [zoom]);
```

## Best Practices

1. **Clip-Management**:
   - Immer den ursprünglichen Clip entfernen, bevor neue Clips hinzugefügt werden
   - Clips nach Startzeit sortieren
   - Dauer 0 für zu löschende Clips verwenden

2. **State-Updates**:
   - Immutable Updates verwenden
   - Clips filtern, bevor neue hinzugefügt werden
   - Snapping für präzise Positionierung nutzen

3. **Performance**:
   - Event-Handler optimieren
   - Unnötige Re-Renders vermeiden
   - Effiziente Clip-Filterung

## Fehlerbehebung

### Häufige Probleme

1. **Duplikate beim Clip-Splitting**:
   ```typescript
   // Lösung: Clips mit Dauer 0 entfernen
   if (newDuration === 0) {
     return prevTracks.map(t => ({
       ...t,
       clips: t.id === trackId ? t.clips.filter(c => c.id !== clipId) : t.clips
     }));
   }
   ```

2. **Ungenauer Drag & Drop**:
   ```typescript
   // Lösung: Snapping implementieren
   const snapThreshold = 5 / (pixelsPerSecond * zoom);
   const snappedTime = Math.round(time / snapGrid) * snapGrid;
   ```

3. **Inkonsistente Clip-IDs**:
   ```typescript
   // Lösung: Eindeutige IDs für Split-Clips
   const newClip1Id = `${clipId}-1`;
   const newClip2Id = `${clipId}-2`;
   ```

## Testing

1. **Unit Tests**:
   - Clip-Splitting
   - Drag & Drop
   - Werkzeug-Wechsel

2. **Integration Tests**:
   - Timeline-Interaktionen
   - State-Management
   - Event-Handling

3. **End-to-End Tests**:
   - Komplette Bearbeitungsabläufe
   - Keyboard-Shortcuts
   - Tool-Interaktionen
