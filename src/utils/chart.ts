export interface Point {
  x: number;
  y: number;
}

export function buildSmoothPath(points: Point[]): string {
  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const previous = points[index - 1];
    const cp1x = previous.x + (point.x - previous.x) * 0.5;
    return `${path} C ${cp1x} ${previous.y}, ${cp1x} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

