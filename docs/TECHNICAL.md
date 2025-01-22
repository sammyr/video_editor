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

### Architektur

Die Timeline-Komponente ist hierarchisch aufgebaut:

```
Timeline
├── TimelineHeader
│   ├── Zeitlineal
│   └── Werkzeugleiste
├── TimelineTracks
│   ├── Track 1
│   │   ├── TrackClip 1
│   │   └── TrackClip 2
│   └── Track 2
│       └── TrackClip 3
└── TimelineControls
    ├── Zoom
    └── Snap-Toggle
```

### Komponenten im Detail

#### TrackClip

Die TrackClip-Komponente ist das Herzstück der Timeline-Bearbeitung:

##### Eigenschaften
- `clip`: Clip-Daten (id, name, start, duration, type)
- `zoom`: Aktueller Zoom-Faktor
- `snapEnabled`: Aktiviert/Deaktiviert Snapping
- `selectedTool`: Aktives Werkzeug (select, razor, hand)

##### Interaktionen
1. **Drag & Drop**
   - Verschieben von Clips auf der Timeline
   - Präzises Snapping an anderen Clips
   - Überlappungsprüfung

2. **Trimming**
   - Start- und End-Trimming mit Griffen
   - Minimale Clip-Dauer: 0.1 Sekunden
   - Snapping während des Trimmens

3. **Snapping-System**
   Priorisierte Snap-Punkte:
   1. Clip-Grenzen (höchste Priorität)
      - Start- und Endpunkte anderer Clips
      - Präzise Ausrichtung ohne Lücken
   2. Timeline-Anfang
      - Snap auf Position 0
   3. Sekundenraster (niedrigste Priorität)
      - Snap auf ganze Sekunden
      - Berücksichtigt benachbarte Sekunden

   Snap-Verhalten:
   - Snap-Schwelle: 10 Pixel (skaliert mit Zoom)
   - Wählt nächstgelegenen Punkt mit höchster Priorität
   - Verhindert Überlappungen und negative Positionen

##### Implementierungsdetails
- Verwendung von React-States für Drag & Drop und Trimming
- Effiziente Überlappungsprüfung
- Skalierbare Snap-Logik
- Pixel-zu-Zeit-Konvertierung basierend auf Zoom

#### Track

Die Track-Komponente verwaltet eine Reihe von Clips:

##### Eigenschaften
- `clips`: Array von Clip-Objekten
- `selectedClip`: Aktuell ausgewählter Clip
- `height`: Höhe der Spur

##### Funktionen
- Organisation von Clips
- Clip-Auswahl
- Visuelles Feedback

#### Timeline

Die Hauptkomponente koordiniert alle Unterkomponenten:

##### Eigenschaften
- `tracks`: Array von Track-Objekten
- `zoom`: Globaler Zoom-Faktor
- `snapEnabled`: Globale Snap-Einstellung
- `selectedTool`: Aktives Bearbeitungswerkzeug

##### Funktionen
- Zentrale Zustandsverwaltung
- Event-Handling
- Zoom-Kontrolle
- Werkzeug-Verwaltung

### Datenstrukturen

#### Clip
```typescript
interface Clip {
  id: string;          // Eindeutige ID
  name: string;        // Anzeigename
  start: number;       // Startposition in Sekunden
  duration: number;    // Dauer in Sekunden
  type: 'video' | 'audio'; // Clip-Typ
}
```

#### Track
```typescript
interface Track {
  id: string;          // Track-ID
  clips: Clip[];       // Clips im Track
  type: 'video' | 'audio'; // Track-Typ
}
```

### Konfiguration

Die Timeline verwendet folgende Standardeinstellungen:

```typescript
const settings = {
  timeline: {
    pixelsPerSecond: 100,  // Basis-Zeitskala
    snapGrid: 1,           // Sekunden-Raster
    minZoom: 0.1,         // Minimaler Zoom
    maxZoom: 10,          // Maximaler Zoom
    defaultZoom: 1        // Standard-Zoom
  }
};
```

### Performance-Optimierungen

1. **Effiziente Rendering-Updates**
   - Verwendung von React.memo für TrackClip
   - Optimierte Zustandsaktualisierungen

2. **Snap-Berechnung**
   - Caching von Snap-Punkten
   - Priorisierte Suche
   - Optimierte Distanzberechnung

3. **Überlappungsprüfung**
   - Frühe Abbrüche bei Nicht-Überlappung
   - Effiziente Bereichsprüfung

### Bekannte Einschränkungen

1. **Zoom-Grenzen**
   - Minimaler Zoom: 0.1
   - Maximaler Zoom: 10

2. **Performance**
   - Leistungseinbußen bei sehr vielen Clips
   - Empfohlenes Maximum: 100 Clips pro Track

### Erweiterungsmöglichkeiten

1. **Multi-Track-Selektion**
   - Gleichzeitiges Verschieben mehrerer Clips
   - Gruppierte Operationen

2. **Erweiterte Snap-Funktionen**
   - Snap an Markern
   - Benutzerdefinierte Snap-Punkte

3. **Transitions**
   - Übergangseffekte zwischen Clips
   - Anpassbare Überblendungen

4. **Keyboard-Shortcuts**
   - Präzises Verschieben mit Pfeiltasten
   - Schnelles Trimmen mit Tastenkombinationen

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
