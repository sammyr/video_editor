/**
 * Editor-Einstellungen
 * Diese Datei enthält alle konfigurierbaren Einstellungen für den Video-Editor
 */

'use client';

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
    /** Standard-Dauer der Timeline in Sekunden */
    defaultDuration: number;
  };
  tracks: {
    /** Höhe einer Spur in Pixeln */
    height: number;
    /** Breite des Spur-Headers in Pixeln */
    headerWidth: number;
    gap: number;
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
    snapGrid: 5, // Auf 1 Sekunde setzen für präziseres Snapping
    markerInterval: 100,
    markerIntervalSmall: 200,
    smallZoomThreshold: 0.3,
    defaultDuration: 3600, // 60 Minuten in Sekunden
  },
  tracks: {
    height: 100,
    headerWidth: 0,  // Temporär auf 0 gesetzt zum Testen
    gap: 10
  },
  clips: {
    minWidth: 10,
    minDuration: 0.1,
  },
};

export function loadSettings(): EditorSettings {
  if (typeof window === 'undefined') {
    return defaultSettings;
  }

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

export function saveSettings(settings: Partial<EditorSettings>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...settings };
    localStorage.setItem('editorSettings', JSON.stringify(newSettings));
  } catch (error) {
    console.error('Fehler beim Speichern der Einstellungen:', error);
  }
}

// Exportiere die aktuellen Einstellungen
export const settings = loadSettings();
