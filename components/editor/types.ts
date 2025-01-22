// Types für den Video-Editor

// Clip-Typ
export interface Clip {
  id: string;
  name: string;
  start: number;      // Startposition in Sekunden
  duration: number;   // Dauer in Sekunden
  type: 'video' | 'audio';
  track?: number;     // Track-ID
}

// Track-Typ
export interface Track {
  id: number;
  name?: string;
  type: 'video' | 'audio';
  clips: Clip[];
}

// Props für Track-Komponente
export interface TrackProps {
  track: Track;
}

// Media-Datei-Typ
export interface MediaFile {
  name: string;
  type: 'video' | 'audio';
  duration: string | number;  // Format: "MM:SS" oder Sekunden als Zahl
  path?: string;
}
