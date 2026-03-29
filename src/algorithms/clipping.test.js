import {
  cohenSutherlandLineClip,
  sutherlandHodgmanPolygonClip,
} from './clipping';

describe('Clipping Algorithms', () => {
  const windowRect = {
    xmin: 0,
    ymin: 0,
    xmax: 10,
    ymax: 10,
  };

  describe('cohenSutherlandLineClip', () => {
    test('accepts a line fully inside the clipping window', () => {
      const result = cohenSutherlandLineClip(
        { x1: 1, y1: 1, x2: 8, y2: 8 },
        windowRect
      );

      expect(result.accepted).toBe(true);
      expect(result.line).toEqual({ x1: 1, y1: 1, x2: 8, y2: 8 });
    });

    test('rejects a line fully outside the clipping window', () => {
      const result = cohenSutherlandLineClip(
        { x1: -5, y1: -5, x2: -1, y2: -1 },
        windowRect
      );

      expect(result.accepted).toBe(false);
      expect(result.line).toBeNull();
    });

    test('clips a crossing line at window boundaries', () => {
      const result = cohenSutherlandLineClip(
        { x1: -5, y1: 5, x2: 15, y2: 5 },
        windowRect
      );

      expect(result.accepted).toBe(true);
      expect(result.line.x1).toBeCloseTo(0, 6);
      expect(result.line.y1).toBeCloseTo(5, 6);
      expect(result.line.x2).toBeCloseTo(10, 6);
      expect(result.line.y2).toBeCloseTo(5, 6);
    });
  });

  describe('sutherlandHodgmanPolygonClip', () => {
    test('returns same polygon when fully inside', () => {
      const polygon = [
        { x: 2, y: 2 },
        { x: 8, y: 2 },
        { x: 8, y: 8 },
        { x: 2, y: 8 },
      ];

      const result = sutherlandHodgmanPolygonClip(polygon, windowRect);
      expect(result).toEqual(polygon);
    });

    test('clips polygon intersecting window', () => {
      const polygon = [
        { x: -2, y: 4 },
        { x: 5, y: 12 },
        { x: 12, y: 4 },
        { x: 5, y: -2 },
      ];

      const result = sutherlandHodgmanPolygonClip(polygon, windowRect);

      expect(result.length).toBeGreaterThan(0);
      for (const point of result) {
        expect(point.x).toBeGreaterThanOrEqual(windowRect.xmin - 1e-6);
        expect(point.x).toBeLessThanOrEqual(windowRect.xmax + 1e-6);
        expect(point.y).toBeGreaterThanOrEqual(windowRect.ymin - 1e-6);
        expect(point.y).toBeLessThanOrEqual(windowRect.ymax + 1e-6);
      }
    });

    test('returns empty array for invalid polygon', () => {
      expect(sutherlandHodgmanPolygonClip([], windowRect)).toEqual([]);
      expect(sutherlandHodgmanPolygonClip([{ x: 0, y: 0 }], windowRect)).toEqual([]);
    });
  });
});
