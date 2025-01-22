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
