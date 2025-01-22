export interface Clip {
  id: string;
  name: string;
  start: number;
  duration: number;
  track: number;
  type: 'video' | 'audio';
}

export interface Track {
  id: number;
  type: 'video' | 'audio';
  clips: Clip[];
}

export interface TrackClipProps {
  clip: Clip;
  zoom: number;
  onSelect: (clipName: string) => void;
  isDragging?: boolean;
}

export interface TrackProps {
  track: Track;
  zoom: number;
  onClipSelect: (clipName: string) => void;
}
