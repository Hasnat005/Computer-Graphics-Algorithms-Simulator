import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { scanLineFill, floodFill, boundaryFill } from './polygonFill';

afterEach(() => {
  cleanup();
});

const mapFromPixels = (pixels, bounds, filledChar = '#', emptyChar = '.') => {
  const { minX, maxX, minY, maxY } = bounds;
  const occupied = new Set(pixels.map((pixel) => `${pixel.x},${pixel.y}`));
  const rows = [];

  for (let y = maxY; y >= minY; y--) {
    let row = '';
    for (let x = minX; x <= maxX; x++) {
      row += occupied.has(`${x},${y}`) ? filledChar : emptyChar;
    }
    rows.push(row);
  }

  return rows.join('\n');
};

const MapSnapshot = ({ map }) => (
  <pre data-testid="result-map">{map}</pre>
);

describe('scanLineFill', () => {
  test('returns empty array for invalid polygons', () => {
    expect(scanLineFill([])).toEqual([]);
    expect(scanLineFill([{ x: 0, y: 0 }, { x: 1, y: 1 }])).toEqual([]);
    expect(scanLineFill([{ x: 'a', y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }])).toEqual([]);
  });

  test('fills an axis-aligned rectangle using scan lines', () => {
    const rectangle = [
      { x: 1, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 3 },
      { x: 1, y: 3 },
    ];

    const pixels = scanLineFill(rectangle);

    expect(pixels).toHaveLength(8);
    expect(pixels).toEqual(
      expect.arrayContaining([
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ])
    );
  });

  test('fills a right triangle with expected pixel count', () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 4 },
    ];

    const pixels = scanLineFill(triangle);

    expect(pixels).toHaveLength(14);
    expect(pixels).toEqual(
      expect.arrayContaining([
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 0, y: 1 },
        { x: 3, y: 1 },
        { x: 0, y: 2 },
        { x: 2, y: 2 },
        { x: 0, y: 3 },
        { x: 1, y: 3 },
      ])
    );
  });

  test('invokes step callback with scan-line segment metadata', () => {
    const polygon = [
      { x: 1, y: 1 },
      { x: 4, y: 1 },
      { x: 4, y: 3 },
      { x: 1, y: 3 },
    ];

    const onStep = jest.fn();
    const pixels = scanLineFill(polygon, onStep);

    expect(pixels).toHaveLength(8);
    expect(onStep).toHaveBeenCalledTimes(2);

    expect(onStep).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        scanline: 1,
        activeEdgeCount: 2,
        segments: [{ xStart: 1, xEnd: 4 }],
        pixelsAdded: 4,
        totalPixels: 4,
      })
    );

    expect(onStep).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        scanline: 2,
        activeEdgeCount: 2,
        segments: [{ xStart: 1, xEnd: 4 }],
        pixelsAdded: 4,
        totalPixels: 8,
      })
    );
  });

  test('fills a convex polygon and matches expected result map', () => {
    const convexPolygon = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 2 },
      { x: 2, y: 4 },
      { x: -1, y: 2 },
    ];

    const pixels = scanLineFill(convexPolygon);
    const map = mapFromPixels(pixels, { minX: -1, maxX: 5, minY: 0, maxY: 4 });

    const expectedMap = [
      '.......',
      '..###..',
      '#######',
      '.#####.',
      '.#####.',
    ].join('\n');

    expect(map).toBe(expectedMap);

    const { container } = render(<MapSnapshot map={map} />);
    expect(container.firstChild).toMatchSnapshot('scanLineFill convex map');
  });

  test('fills a concave polygon and matches expected result map', () => {
    const concavePolygon = [
      { x: 1, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 3, y: 2 },
      { x: 3, y: 4 },
      { x: 1, y: 4 },
    ];

    const pixels = scanLineFill(concavePolygon);
    const map = mapFromPixels(pixels, { minX: 1, maxX: 5, minY: 1, maxY: 4 });

    const expectedMap = [
      '.....',
      '###..',
      '###..',
      '#####',
    ].join('\n');

    expect(map).toBe(expectedMap);

    const { container } = render(<MapSnapshot map={map} />);
    expect(container.firstChild).toMatchSnapshot('scanLineFill concave map');
  });
});

describe('floodFill', () => {
  const createGrid = (rows) => rows.map((row) => row.slice());

  const createGridAccessors = (grid) => ({
    getPixelColor: (x, y) => grid[y]?.[x],
    setPixelColor: (x, y, color) => {
      if (!grid[y] || typeof grid[y][x] === 'undefined') {
        return;
      }
      grid[y][x] = color;
    },
  });

  test('returns empty array for invalid inputs', async () => {
    await expect(floodFill(null, 'A', 'B', {})).resolves.toEqual([]);
    await expect(floodFill({ x: 0, y: 0 }, 'A', 'A', {})).resolves.toEqual([]);
    await expect(
      floodFill(
        { x: 0, y: 0 },
        'A',
        'B',
        { getPixelColor: () => 'A', setPixelColor: () => {}, connectivity: 16 }
      )
    ).resolves.toEqual([]);
  });

  test('fills connected region using iterative stack and returns ordered changes', async () => {
    const grid = createGrid([
      ['A', 'A', '#'],
      ['A', 'A', '#'],
      ['#', '#', '#'],
    ]);

    const changes = await floodFill(
      { x: 0, y: 0 },
      'A',
      'B',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 3,
        height: 3,
      }
    );

    expect(changes).toHaveLength(4);
    expect(changes[0]).toEqual({ x: 0, y: 0, previousColor: 'A', newColor: 'B' });
    expect(new Set(changes.map((change) => `${change.x},${change.y}`)).size).toBe(4);
    expect(grid).toEqual([
      ['B', 'B', '#'],
      ['B', 'B', '#'],
      ['#', '#', '#'],
    ]);
  });

  test('respects 4-connectivity versus 8-connectivity', async () => {
    const diagonalOnly = [
      ['A', '#', 'A'],
      ['#', 'A', '#'],
      ['A', '#', 'A'],
    ];

    const grid4 = createGrid(diagonalOnly);
    const result4 = await floodFill(
      { x: 1, y: 1 },
      'A',
      'B',
      {
        ...createGridAccessors(grid4),
        connectivity: 4,
        width: 3,
        height: 3,
      }
    );

    const grid8 = createGrid(diagonalOnly);
    const result8 = await floodFill(
      { x: 1, y: 1 },
      'A',
      'B',
      {
        ...createGridAccessors(grid8),
        connectivity: 8,
        width: 3,
        height: 3,
      }
    );

    expect(result4).toHaveLength(1);
    expect(result8).toHaveLength(5);
  });

  test('invokes animated step callback and respects speed delay', async () => {
    const grid = createGrid([
      ['A', 'A'],
      ['A', 'A'],
    ]);

    const onStep = jest.fn();
    const startedAt = Date.now();

    const changes = await floodFill(
      { x: 0, y: 0 },
      'A',
      'B',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 2,
        height: 2,
        speed: 5,
        onStep,
      }
    );

    const elapsed = Date.now() - startedAt;

    expect(changes).toHaveLength(4);
    expect(elapsed).toBeGreaterThanOrEqual(10);
    expect(onStep).toHaveBeenCalledTimes(4);
    expect(onStep).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        index: 0,
        pixel: { x: 0, y: 0 },
        connectivity: 4,
        speed: 5,
      })
    );
  });

  test('handles edge case where seed pixel is outside bounded region', async () => {
    const grid = createGrid([
      ['A', 'A'],
      ['A', 'A'],
    ]);

    const changes = await floodFill(
      { x: -1, y: -1 },
      'A',
      'B',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 2,
        height: 2,
      }
    );

    expect(changes).toEqual([]);
    expect(grid).toEqual([
      ['A', 'A'],
      ['A', 'A'],
    ]);
  });

  test('produces expected flood-fill map for a boxed region', async () => {
    const grid = createGrid([
      ['#', '#', '#', '#', '#'],
      ['#', 'A', 'A', 'A', '#'],
      ['#', 'A', 'A', 'A', '#'],
      ['#', '#', '#', '#', '#'],
    ]);

    const changes = await floodFill(
      { x: 2, y: 1 },
      'A',
      'B',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 5,
        height: 4,
      }
    );

    const map = mapFromPixels(changes.map((change) => ({ x: change.x, y: change.y })), {
      minX: 0,
      maxX: 4,
      minY: 0,
      maxY: 3,
    });

    const expectedMap = [
      '.....',
      '.###.',
      '.###.',
      '.....',
    ].join('\n');

    expect(map).toBe(expectedMap);

    const { container } = render(<MapSnapshot map={map} />);
    expect(container.firstChild).toMatchSnapshot('floodFill boxed map');
  });
});

describe('boundaryFill', () => {
  const createGrid = (rows) => rows.map((row) => row.slice());

  const createGridAccessors = (grid) => ({
    getPixelColor: (x, y) => grid[y]?.[x],
    setPixelColor: (x, y, color) => {
      if (!grid[y] || typeof grid[y][x] === 'undefined') {
        return;
      }
      grid[y][x] = color;
    },
  });

  test('returns empty array for invalid inputs', () => {
    expect(boundaryFill(null, '#', 'F', {})).toEqual([]);
    expect(boundaryFill({ x: 0, y: 0 }, '#', '#', {})).toEqual([]);
    expect(
      boundaryFill(
        { x: 0, y: 0 },
        '#',
        'F',
        { getPixelColor: () => '.', setPixelColor: () => {}, connectivity: 16 }
      )
    ).toEqual([]);
  });

  test('fills interior region and stops at boundary', () => {
    const grid = createGrid([
      ['#', '#', '#', '#', '#'],
      ['#', '.', '.', '.', '#'],
      ['#', '.', '.', '.', '#'],
      ['#', '.', '.', '.', '#'],
      ['#', '#', '#', '#', '#'],
    ]);

    const changes = boundaryFill(
      { x: 2, y: 2 },
      '#',
      'F',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 5,
        height: 5,
      }
    );

    expect(changes).toHaveLength(9);
    expect(changes[0]).toEqual({ x: 2, y: 2, previousColor: '.', newColor: 'F' });
    expect(new Set(changes.map((change) => `${change.x},${change.y}`)).size).toBe(9);
    expect(grid[0]).toEqual(['#', '#', '#', '#', '#']);
    expect(grid[4]).toEqual(['#', '#', '#', '#', '#']);
    expect(grid[2][2]).toBe('F');
  });

  test('respects 4-connectivity versus 8-connectivity', () => {
    const diagonalInterior = [
      ['#', '#', '#', '#', '#'],
      ['#', '.', '#', '.', '#'],
      ['#', '#', '.', '#', '#'],
      ['#', '.', '#', '.', '#'],
      ['#', '#', '#', '#', '#'],
    ];

    const grid4 = createGrid(diagonalInterior);
    const result4 = boundaryFill(
      { x: 2, y: 2 },
      '#',
      'F',
      {
        ...createGridAccessors(grid4),
        connectivity: 4,
        width: 5,
        height: 5,
      }
    );

    const grid8 = createGrid(diagonalInterior);
    const result8 = boundaryFill(
      { x: 2, y: 2 },
      '#',
      'F',
      {
        ...createGridAccessors(grid8),
        connectivity: 8,
        width: 5,
        height: 5,
      }
    );

    expect(result4).toHaveLength(1);
    expect(result8).toHaveLength(5);
  });

  test('invokes step callback in fill order', () => {
    const grid = createGrid([
      ['#', '#', '#'],
      ['#', '.', '#'],
      ['#', '#', '#'],
    ]);

    const onStep = jest.fn();

    const changes = boundaryFill(
      { x: 1, y: 1 },
      '#',
      'F',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 3,
        height: 3,
        onStep,
      }
    );

    expect(changes).toHaveLength(1);
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 0,
        pixel: { x: 1, y: 1 },
        previousColor: '.',
        newColor: 'F',
        totalPixels: 1,
        connectivity: 4,
      })
    );
  });

  test('returns no changes when seed is boundary color', () => {
    const grid = createGrid([
      ['#', '#', '#'],
      ['#', '.', '#'],
      ['#', '#', '#'],
    ]);

    const changes = boundaryFill(
      { x: 0, y: 0 },
      '#',
      'F',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 3,
        height: 3,
      }
    );

    expect(changes).toEqual([]);
  });

  test('produces expected boundary-fill map for enclosed interior', () => {
    const grid = createGrid([
      ['#', '#', '#', '#', '#'],
      ['#', '.', '.', '.', '#'],
      ['#', '.', '.', '.', '#'],
      ['#', '#', '#', '#', '#'],
    ]);

    const changes = boundaryFill(
      { x: 1, y: 1 },
      '#',
      'F',
      {
        ...createGridAccessors(grid),
        connectivity: 4,
        width: 5,
        height: 4,
      }
    );

    const map = mapFromPixels(changes.map((change) => ({ x: change.x, y: change.y })), {
      minX: 0,
      maxX: 4,
      minY: 0,
      maxY: 3,
    });

    const expectedMap = [
      '.....',
      '.###.',
      '.###.',
      '.....',
    ].join('\n');

    expect(map).toBe(expectedMap);

    const { container } = render(<MapSnapshot map={map} />);
    expect(container.firstChild).toMatchSnapshot('boundaryFill enclosed map');
  });
});
