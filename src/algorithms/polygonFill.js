/**
 * Polygon Filling Algorithms
 *
 * This module contains polygon rasterization/filling algorithms.
 */

/**
 * Scan-line Polygon Fill
 *
 * Fills a polygon using an Edge Table (ET) and Active Edge Table (AET).
 *
 * Algorithm overview:
 * 1. Build Edge Table entries for non-horizontal edges
 * 2. For each scan line:
 *    - Add starting edges from ET into AET
 *    - Remove edges whose ymax has been reached
 *    - Sort AET by current x (then slope for deterministic pairing)
 *    - Pair edges and emit fill segments between each pair
 *    - Advance each active edge x by inverse slope for next scan line
 *
 * Notes:
 * - Horizontal edges are ignored in ET construction
 * - Upper endpoints are treated as exclusive (standard scan conversion rule)
 * - Works best with integer-coordinate vertices
 *
 * @param {Array<{x: number, y: number}>} vertices - Polygon vertices in order
 * @param {(step: {
 *   scanline: number,
 *   activeEdgeCount: number,
 *   segments: Array<{xStart: number, xEnd: number}>,
 *   pixelsAdded: number,
 *   totalPixels: number
 * }) => void} [onStep] - Optional callback invoked after each scan line
 * @returns {Array<{x: number, y: number}>} Pixel coordinates inside the polygon
 */
export function scanLineFill(vertices, onStep) {
  if (!Array.isArray(vertices) || vertices.length < 3) {
    return [];
  }

  const normalizedVertices = vertices.map((vertex) => ({
    x: Number(vertex.x),
    y: Number(vertex.y),
  }));

  if (normalizedVertices.some((vertex) => Number.isNaN(vertex.x) || Number.isNaN(vertex.y))) {
    return [];
  }

  const edgeTable = new Map();
  let globalMinY = Infinity;
  let globalMaxY = -Infinity;

  for (let i = 0; i < normalizedVertices.length; i++) {
    const current = normalizedVertices[i];
    const next = normalizedVertices[(i + 1) % normalizedVertices.length];

    if (current.y === next.y) {
      continue;
    }

    const lower = current.y < next.y ? current : next;
    const upper = current.y < next.y ? next : current;

    const yMin = Math.ceil(lower.y);
    const yMax = Math.ceil(upper.y);

    if (yMin >= yMax) {
      continue;
    }

    const inverseSlope = (upper.x - lower.x) / (upper.y - lower.y);
    const xAtYMin = lower.x + (yMin - lower.y) * inverseSlope;

    const edge = {
      yMax,
      x: xAtYMin,
      inverseSlope,
    };

    if (!edgeTable.has(yMin)) {
      edgeTable.set(yMin, []);
    }

    edgeTable.get(yMin).push(edge);

    if (yMin < globalMinY) {
      globalMinY = yMin;
    }

    if (yMax > globalMaxY) {
      globalMaxY = yMax;
    }
  }

  if (!Number.isFinite(globalMinY) || !Number.isFinite(globalMaxY)) {
    return [];
  }

  const filledPixels = [];
  const activeEdgeTable = [];

  for (let scanline = globalMinY; scanline < globalMaxY; scanline++) {
    const startingEdges = edgeTable.get(scanline);
    if (startingEdges && startingEdges.length > 0) {
      activeEdgeTable.push(...startingEdges);
    }

    for (let i = activeEdgeTable.length - 1; i >= 0; i--) {
      if (scanline >= activeEdgeTable[i].yMax) {
        activeEdgeTable.splice(i, 1);
      }
    }

    activeEdgeTable.sort((left, right) => {
      if (left.x !== right.x) {
        return left.x - right.x;
      }
      return left.inverseSlope - right.inverseSlope;
    });

    const segments = [];
    let pixelsAddedThisLine = 0;

    for (let i = 0; i + 1 < activeEdgeTable.length; i += 2) {
      const leftEdge = activeEdgeTable[i];
      const rightEdge = activeEdgeTable[i + 1];

      const xStart = Math.ceil(leftEdge.x);
      const xEnd = Math.floor(rightEdge.x);

      if (xStart > xEnd) {
        continue;
      }

      segments.push({ xStart, xEnd });

      for (let x = xStart; x <= xEnd; x++) {
        filledPixels.push({ x, y: scanline });
        pixelsAddedThisLine++;
      }
    }

    if (typeof onStep === 'function') {
      onStep({
        scanline,
        activeEdgeCount: activeEdgeTable.length,
        segments,
        pixelsAdded: pixelsAddedThisLine,
        totalPixels: filledPixels.length,
      });
    }

    for (let i = 0; i < activeEdgeTable.length; i++) {
      activeEdgeTable[i].x += activeEdgeTable[i].inverseSlope;
    }
  }

  return filledPixels;
}

/**
 * Flood Fill (Iterative Stack)
 *
 * Fills connected pixels from a seed using depth-first traversal with an
 * explicit stack (no recursion).
 *
 * Requirements:
 * - Uses iterative stack traversal
 * - Returns pixel changes in the exact order applied
 * - Supports 4- and 8-connectivity
 * - Optional speed delay and animated per-step callback
 *
 * @param {{x: number, y: number}} seed - Starting pixel
 * @param {string} targetColor - Color to replace
 * @param {string} fillColor - Replacement color
 * @param {{
 *   getPixelColor: (x: number, y: number) => string | undefined,
 *   setPixelColor: (x: number, y: number, color: string) => void,
 *   connectivity?: 4 | 8,
 *   speed?: number,
 *   width?: number,
 *   height?: number,
 *   isInside?: (x: number, y: number) => boolean,
 *   onStep?: (step: {
 *     index: number,
 *     pixel: {x: number, y: number},
 *     previousColor: string,
 *     newColor: string,
 *     totalPixels: number,
 *     remainingStack: number,
 *     connectivity: 4 | 8,
 *     speed: number
 *   }) => void
 * }} options - Fill configuration and pixel accessors
 * @returns {Promise<Array<{x: number, y: number, previousColor: string, newColor: string}>>}
 */
export async function floodFill(seed, targetColor, fillColor, options = {}) {
  const {
    getPixelColor,
    setPixelColor,
    connectivity = 4,
    speed = 0,
    width,
    height,
    isInside,
    onStep,
  } = options;

  if (!seed || typeof seed.x !== 'number' || typeof seed.y !== 'number') {
    return [];
  }

  if (typeof getPixelColor !== 'function' || typeof setPixelColor !== 'function') {
    return [];
  }

  if (connectivity !== 4 && connectivity !== 8) {
    return [];
  }

  if (typeof targetColor !== 'string' || typeof fillColor !== 'string') {
    return [];
  }

  if (targetColor === fillColor) {
    return [];
  }

  const safeSpeed = Number.isFinite(speed) && speed > 0 ? speed : 0;
  const inside = typeof isInside === 'function'
    ? isInside
    : (x, y) => {
        if (Number.isFinite(width) && Number.isFinite(height)) {
          return x >= 0 && y >= 0 && x < width && y < height;
        }
        return true;
      };

  const fourDirections = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  const eightDirections = [
    ...fourDirections,
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
  ];

  const directions = connectivity === 8 ? eightDirections : fourDirections;
  const stack = [{ x: Math.trunc(seed.x), y: Math.trunc(seed.y) }];
  const visited = new Set();
  const changes = [];

  const wait = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

  while (stack.length > 0) {
    const current = stack.pop();
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    if (!inside(current.x, current.y)) {
      continue;
    }

    const currentColor = getPixelColor(current.x, current.y);
    if (currentColor !== targetColor) {
      continue;
    }

    setPixelColor(current.x, current.y, fillColor);

    const change = {
      x: current.x,
      y: current.y,
      previousColor: currentColor,
      newColor: fillColor,
    };

    changes.push(change);

    if (typeof onStep === 'function') {
      onStep({
        index: changes.length - 1,
        pixel: { x: current.x, y: current.y },
        previousColor: currentColor,
        newColor: fillColor,
        totalPixels: changes.length,
        remainingStack: stack.length,
        connectivity,
        speed: safeSpeed,
      });
    }

    for (let i = 0; i < directions.length; i++) {
      const nextX = current.x + directions[i].dx;
      const nextY = current.y + directions[i].dy;
      const nextKey = `${nextX},${nextY}`;

      if (!visited.has(nextKey)) {
        stack.push({ x: nextX, y: nextY });
      }
    }

    if (safeSpeed > 0) {
      await wait(safeSpeed);
    }
  }

  return changes;
}

/**
 * Boundary Fill (Iterative Stack)
 *
 * Fills outward from a seed until reaching boundaryColor using an explicit
 * stack-based traversal to avoid recursion depth overflow.
 *
 * @param {{x: number, y: number}} seed - Starting pixel
 * @param {string} boundaryColor - Color that stops filling
 * @param {string} fillColor - Replacement color
 * @param {{
 *   getPixelColor: (x: number, y: number) => string | undefined,
 *   setPixelColor: (x: number, y: number, color: string) => void,
 *   connectivity?: 4 | 8,
 *   width?: number,
 *   height?: number,
 *   isInside?: (x: number, y: number) => boolean,
 *   onStep?: (step: {
 *     index: number,
 *     pixel: {x: number, y: number},
 *     previousColor: string,
 *     newColor: string,
 *     totalPixels: number,
 *     remainingStack: number,
 *     connectivity: 4 | 8
 *   }) => void
 * }} options - Fill configuration and pixel accessors
 * @returns {Array<{x: number, y: number, previousColor: string, newColor: string}>}
 */
export function boundaryFill(seed, boundaryColor, fillColor, options = {}) {
  const {
    getPixelColor,
    setPixelColor,
    connectivity = 4,
    width,
    height,
    isInside,
    onStep,
  } = options;

  if (!seed || typeof seed.x !== 'number' || typeof seed.y !== 'number') {
    return [];
  }

  if (typeof getPixelColor !== 'function' || typeof setPixelColor !== 'function') {
    return [];
  }

  if (connectivity !== 4 && connectivity !== 8) {
    return [];
  }

  if (typeof boundaryColor !== 'string' || typeof fillColor !== 'string') {
    return [];
  }

  if (boundaryColor === fillColor) {
    return [];
  }

  const inside = typeof isInside === 'function'
    ? isInside
    : (x, y) => {
        if (Number.isFinite(width) && Number.isFinite(height)) {
          return x >= 0 && y >= 0 && x < width && y < height;
        }
        return true;
      };

  const fourDirections = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  const eightDirections = [
    ...fourDirections,
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 },
  ];

  const directions = connectivity === 8 ? eightDirections : fourDirections;
  const stack = [{ x: Math.trunc(seed.x), y: Math.trunc(seed.y) }];
  const visited = new Set();
  const changes = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const key = `${current.x},${current.y}`;

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    if (!inside(current.x, current.y)) {
      continue;
    }

    const currentColor = getPixelColor(current.x, current.y);

    if (currentColor === boundaryColor || currentColor === fillColor || typeof currentColor === 'undefined') {
      continue;
    }

    setPixelColor(current.x, current.y, fillColor);

    const change = {
      x: current.x,
      y: current.y,
      previousColor: currentColor,
      newColor: fillColor,
    };

    changes.push(change);

    if (typeof onStep === 'function') {
      onStep({
        index: changes.length - 1,
        pixel: { x: current.x, y: current.y },
        previousColor: currentColor,
        newColor: fillColor,
        totalPixels: changes.length,
        remainingStack: stack.length,
        connectivity,
      });
    }

    for (let i = 0; i < directions.length; i++) {
      const nextX = current.x + directions[i].dx;
      const nextY = current.y + directions[i].dy;
      const nextKey = `${nextX},${nextY}`;

      if (!visited.has(nextKey)) {
        stack.push({ x: nextX, y: nextY });
      }
    }
  }

  return changes;
}
