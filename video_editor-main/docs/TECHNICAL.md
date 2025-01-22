# Technische Dokumentation - Video Editor

## Architektur

### Komponenten-Struktur

```
components/
├── editor/
│   ├── Editor.tsx             # Hauptkomponente
│   ├── Timeline.tsx           # Timeline-Komponente
│   ├── MediaBrowser.tsx       # Media Browser
│   ├── PreviewPanel.tsx       # Vorschau-Panel
│   └── types/
│       └── index.ts           # Gemeinsame Typdefinitionen
├── tracks/
│   ├── VideoTrack.tsx         # Video-Spur Komponente
│   ├── AudioTrack.tsx         # Audio-Spur Komponente
│   └── TrackClip.tsx          # Clip-Komponente für Spuren
└── ui/                        # UI-Komponenten (shadcn/ui)
```

## Komponenten

### Editor
- Hauptkomponente, die den gesamten Editor verwaltet
- Verwendet DndContext für Drag & Drop
- Verwaltet den globalen Zustand (Tracks, aktive Clips)

### Timeline
- Zeigt Video- und Audiospuren an
- Verwaltet Zoom und Scrolling
- Rendert Zeitmarker und Spuren
- Verhindert unbeabsichtigtes Verschieben der Spuren

### MediaBrowser
- Zeigt verfügbare Medien-Dateien
- Ermöglicht Drag & Drop von Clips
- Unterstützt Suche und Sortierung

### Tracks
- Separate Komponenten für Video- und Audiospuren
- TrackClip-Komponente für einzelne Clips
- Unterstützt Drag & Drop innerhalb der Timeline

## Datenmodelle

### Clip
```typescript
interface Clip {
  id: string;
  name: string;
  start: number;
  duration: number;
  track: number;
  type: 'video' | 'audio';
}
```

### Track
```typescript
interface Track {
  id: number;
  type: 'video' | 'audio';
  clips: Clip[];
}
```

## Drag & Drop System

### Media Browser zu Timeline
1. Clip wird aus dem Media Browser gezogen
2. DndContext verwaltet den Drag-Zustand
3. Nur kompatible Spuren akzeptieren den Drop
4. Position wird basierend auf Timeline-Offset berechnet

### Innerhalb der Timeline
1. Clips können nur horizontal verschoben werden
2. Spuren sind fixiert und können nicht verschoben werden
3. Clips bleiben in ihrer ursprünglichen Spur

## Event-System

### Timeline Events
- `onClipSelect`: Wenn ein Clip ausgewählt wird
- `onTimelineOffsetChange`: Bei Timeline-Scroll
- `onZoomChange`: Bei Zoom-Änderungen

### Track Events
- `onClipMove`: Wenn ein Clip verschoben wird
- `onClipResize`: Wenn ein Clip in der Größe verändert wird

## Styling
- Verwendet Tailwind CSS für das Styling
- Shadcn/ui für UI-Komponenten
- Konsistente Farbpalette für Video/Audio

## Performance-Optimierungen
- Virtualisierung für lange Timelines
- Lazy Loading für Media Browser
- Optimierte Render-Zyklen

## Timeline-Komponente

Die Timeline-Komponente ist das Herzstück des Video-Editors und ermöglicht die präzise Bearbeitung von Video- und Audio-Clips.

### Komponenten-Hierarchie

```
Timeline
├── TimelineTools
├── TimelineRuler
└── Track
    └── TrackClip
```

### Hauptfunktionen

#### 1. Clip-Management

- **Clip-Positionierung**: 
  - Präzises Snapping-System für exakte Clip-Platzierung
  - Automatische Ausrichtung an Timeline-Start und anderen Clips
  - Verhindert Überlappungen und Lücken zwischen Clips

- **Clip-Splitting**:
  - Teilt Clips an der Cursor-Position
  - Generiert neue eindeutige IDs für geteilte Clips
  - Behält alle Eigenschaften des Original-Clips bei

#### 2. Snapping-System

- **Aktivierung/Deaktivierung**:
  - Toggle-Button in der Toolbar
  - Tastaturkürzel 'S'
  - Standard: aktiviert

- **Snap-Verhalten**:
  - Snap-Schwelle: 10 Pixel (skaliert mit Zoom)
  - Präzises Einrasten am Timeline-Start (0)
  - Exaktes Anschließen an andere Clips (Start/Ende)
  - Verhindert jegliche Überlappungen

- **Snap-Prioritäten**:
  1. Clip-Grenzen (Start/Ende anderer Clips)
  2. Timeline-Anfang (0)
  3. Sekundenraster

#### 3. Werkzeuge

- **Auswahlwerkzeug (V)**:
  - Clips verschieben
  - Snapping zu anderen Clips
  - Überlappungsprüfung

- **Rasierklinge (C)**:
  - Clips an Cursor-Position teilen
  - Erzeugt zwei neue Clips
  - Behält Original-Eigenschaften

- **Hand-Werkzeug (H)**:
  - Timeline-Navigation
  - Horizontales Scrollen

#### 4. Tastaturkürzel

- **V**: Auswahlwerkzeug
- **C**: Rasierklinge
- **H**: Hand-Werkzeug
- **S**: Snapping ein/aus
- **+**: Zoom in
- **-**: Zoom out

### Technische Details

#### Clip-Struktur
```typescript
interface Clip {
  id: string;
  name: string;
  start: number;    // Startzeit in Sekunden
  duration: number; // Dauer in Sekunden
  type: 'video' | 'audio';
}
```

#### Track-Struktur
```typescript
interface Track {
  id: number;
  type: 'video' | 'audio';
  clips: Clip[];
}
```

#### Snapping-Logik

1. **Clip-Bewegung**:
   ```typescript
   // Snap-Schwelle berechnen (10 Pixel in Zeit)
   const snapThreshold = 10 / (pixelsPerSecond * zoom);
   
   // Prüfe Timeline-Start
   if (newStart <= snapThreshold) {
     newStart = 0;
   }
   
   // Prüfe andere Clips
   if (nearestClip) {
     if (Math.abs(clipEnd - nearestClip.start) <= snapThreshold) {
       // Snap ans Ende
       newStart = nearestClip.start - clip.duration;
     } else if (Math.abs(newStart - nearestClip.end) <= snapThreshold) {
       // Snap an den Start
       newStart = nearestClip.end;
     }
   }
   ```

2. **Überlappungsprüfung**:
   ```typescript
   const hasOverlap = clips.some(otherClip => {
     if (otherClip.id === clip.id) return false;
     const clipEnd = newStart + clip.duration;
     const otherEnd = otherClip.start + otherClip.duration;
     return (
       (newStart >= otherClip.start && newStart < otherEnd) ||
       (clipEnd > otherClip.start && clipEnd <= otherEnd) ||
       (newStart <= otherClip.start && clipEnd >= otherEnd)
     );
   });
   ```

### Konfiguration

Die Timeline verwendet die folgenden Standardeinstellungen:

```typescript
const settings = {
  timeline: {
    pixelsPerSecond: 100,  // Zeitliche Auflösung
    snapGrid: 1,           // Snapping-Raster in Sekunden
    minZoom: 0.1,         // Minimaler Zoom-Faktor
    maxZoom: 5            // Maximaler Zoom-Faktor
  }
};
```

### Leistungsoptimierung

- Effiziente Überlappungsprüfung
- Optimierte Snap-Berechnung
- Vermeidung unnötiger Re-Renders
- Präzise Clip-Positionierung ohne Toleranzen

### Bekannte Einschränkungen

- Maximale Zoom-Stufe: 5x
- Minimale Zoom-Stufe: 0.1x
- Clips müssen eine Mindestdauer > 0 haben
- Keine vertikale Verschiebung zwischen Tracks

### Zukünftige Erweiterungen

- Multi-Track-Selection
- Ripple-Edit-Modus
- Keyboard-Trimming
- Clip-Transitions
- Nested-Sequences

## Zukünftige Erweiterungen
- [ ] Mehrspuren-Bearbeitung
- [ ] Effekte und Übergänge
- [ ] Keyframe-Animation
- [ ] Export-Funktionen

## Änderungsprotokoll

### Version 0.1.0 (21.01.2025)
- Initiale Implementierung
- Grundlegende Drag & Drop-Funktionalität
- Timeline-Komponente mit Zoom
