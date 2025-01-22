# Zukünftige Features

## 1. Video-Thumbnail-Vorschau

### Beschreibung
Beim Hover über einen Clip wird eine Live-Vorschau des Videoinhalts an der entsprechenden Zeitposition angezeigt.

### Technische Details
- **Vorschau-Container**: 
  - Schwebendes Div über dem Clip
  - Feste Größe: 160x90px (16:9)
  - Abgerundete Ecken und Schatten

- **Thumbnail-Generierung**:
  - Extraktion von Frames an der Hover-Position
  - Caching der Thumbnails für bessere Performance
  - Progressive Ladung bei Bewegung

- **Performance-Optimierung**:
  - Debouncing der Hover-Events (150ms)
  - Vorab-Laden benachbarter Frames
  - Maximale Cache-Größe: 100 Frames pro Clip

### Implementation
```typescript
interface ThumbnailPreview {
  clipId: string;
  position: number;  // Zeitposition in Sekunden
  imageUrl: string;  // Base64 oder Blob-URL
  width: number;
  height: number;
}
```

## 2. Clip-Löschfunktion

### Beschreibung
Ein Lösch-Button erscheint in der oberen rechten Ecke des Clips beim Hover.

### Technische Details
- **Button-Design**:
  - Rotes X-Icon (24x24px)
  - Halbtransparenter Hintergrund
  - Hover-Effekt: Vollständig opak

- **Interaktion**:
  - Klick öffnet Bestätigungsdialog
  - Optionale Rückgängig-Funktion (30 Sekunden)
  - Keyboard-Shortcut: Delete-Taste

- **Sicherheit**:
  - Bestätigungsdialog bei Clips > 10 Sekunden
  - Anzeige der Clip-Länge im Dialog
  - Warnung bei verknüpften Clips

### Implementation
```typescript
interface DeleteButton {
  visible: boolean;
  position: 'top-right' | 'bottom-right';
  confirmationRequired: boolean;
  undoTimeoutMs: number;
}
```

## 3. Automatischer Lückenlöscher

### Beschreibung
Funktion zum automatischen Entfernen von Lücken zwischen Clips auf der Timeline.

### Technische Details
- **Erkennungssystem**:
  - Minimale Lückengröße: 0.1 Sekunden
  - Maximale Lückengröße: konfigurierbar
  - Ignoriert beabsichtigte Pausen

- **Lösungsmethoden**:
  1. **Automatisch**:
     - Clips werden automatisch zusammengeschoben
     - Ripple-Effekt für nachfolgende Clips
     - Erhalt relativer Abstände

  2. **Manuell mit Vorschau**:
     - Markierung aller Lücken
     - Vorschau der resultierenden Timeline
     - Selektive Lückenkorrektur

- **Einstellungen**:
  ```typescript
  interface GapCloserSettings {
    minGapSize: number;      // Sekunden
    maxGapSize: number;      // Sekunden
    autoClose: boolean;      // Automatisches Schließen
    preserveRythm: boolean;  // Erhält zeitliche Muster
    rippleAffected: boolean; // Ripple für Folge-Clips
  }
  ```

### Benutzerinterface
- **Toolbar-Button**:
  - Toggle für automatischen Modus
  - Dropdown für Einstellungen
  - Statusanzeige aktiver Lücken

- **Visualisierung**:
  - Hervorhebung von Lücken
  - Anzeige der Lückengröße
  - Vorschau der Korrektur

### Keyboard-Shortcuts
- `Alt + G`: Lückenlöscher aktivieren
- `Alt + Shift + G`: Alle Lücken automatisch schließen
- `Alt + Click`: Einzelne Lücke manuell schließen

### Undo/Redo
- Gruppierte Rückgängig-Operation
- Wiederherstellung ursprünglicher Positionen
- Historie der Lückenkorrekturen
