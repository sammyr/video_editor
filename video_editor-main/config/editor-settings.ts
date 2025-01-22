/**
 * Editor-Einstellungen
 * Diese Datei enthält alle konfigurierbaren Einstellungen für den Video-Editor
 */

export interface EditorSettings {
  timeline: {
    /** Minimaler Zoom-Wert */
    minZoom: number;
    /** Maximaler Zoom-Wert */
    maxZoom: number;
    /** Zoom-Schrittweite */
    zoomStep: number;
    /** Pixel pro Sekunde bei Zoom 1 */
    pixelsPerSecond: number;
    /** Snapping-Raster in Pixeln */
    snapGrid: number;
    /** Zeitmarker-Intervall bei normalem Zoom */
    markerInterval: number;
    /** Zeitmarker-Intervall bei kleinem Zoom */
    markerIntervalSmall: number;
    /** Schwellenwert für kleinen Zoom */
    smallZoomThreshold: number;
  };
  tracks: {
    /** Höhe einer Spur in Pixeln */
    height: number;
    /** Breite des Spur-Headers in Pixeln */
    headerWidth: number;
  };
  clips: {
    /** Minimale Clip-Breite in Pixeln */
    minWidth: number;
    /** Minimale Clip-Dauer in Sekunden */
    minDuration: number;
  };
}

const defaultSettings: EditorSettings = {
  timeline: {
    minZoom: 0.1,
    maxZoom: 2.0,
    zoomStep: 0.1,
    pixelsPerSecond: 100,
    snapGrid: 2,
    markerInterval: 100,
    markerIntervalSmall: 200,
    smallZoomThreshold: 0.3,
  },
  tracks: {
    height: 96, // 24px * 4
    headerWidth: 96,
  },
  clips: {
    minWidth: 10,
    minDuration: 0.1,
  },
};

export function loadSettings(): EditorSettings {
  try {
    const savedSettings = localStorage.getItem('editorSettings');
    if (savedSettings) {
      return { ...defaultSettings, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('Fehler beim Laden der Einstellungen:', error);
  }
  return defaultSettings;
}

export function saveSettings(settings: Partial<EditorSettings>) {
  try {
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem('editorSettings', JSON.stringify(newSettings));
  } catch (error) {
    console.error('Fehler beim Speichern der Einstellungen:', error);
  }
}

export const settings = loadSettings();
