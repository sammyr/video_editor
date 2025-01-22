// Types für den Video-Editor

// Clip-Typ
export interface Clip {
  id: string;
  name: string;
  type: 'video' | 'audio';
  start: number;       // Position in der Timeline
  duration: number;    // Dauer in der Timeline
  originalStart: number;  // Ursprüngliche Startzeit im Quellmaterial
  originalDuration: number;  // Ursprüngliche Dauer im Quellmaterial
  track?: number;     // Track-ID
  source?: string;     // Pfad zur Quelldatei
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
