import { settings } from '@/config/editor-settings';

/**
 * Hook zum Snappen von Positionen auf ein Raster
 */
export function useSnapPosition() {
  const snapToGrid = (position: number): number => {
    const grid = settings.timeline.snapGrid;
    return Math.round(position / grid) * grid;
  };

  const snapTimeToGrid = (time: number, zoom: number): number => {
    const pixelPosition = time * settings.timeline.pixelsPerSecond * zoom;
    const snappedPixels = snapToGrid(pixelPosition);
    return snappedPixels / (settings.timeline.pixelsPerSecond * zoom);
  };

  return {
    snapToGrid,
    snapTimeToGrid,
  };
}
