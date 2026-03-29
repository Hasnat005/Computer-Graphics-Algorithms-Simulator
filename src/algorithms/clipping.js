/**
 * Clipping Algorithms
 *
 * Includes:
 * - Cohen-Sutherland Line Clipping
 * - Sutherland-Hodgman Polygon Clipping
 */

/**
 * @typedef {{xmin: number, ymin: number, xmax: number, ymax: number}} ClipWindow
 * @typedef {{x: number, y: number}} Point2D
 */

const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

function safeRatio(numerator, denominator) {
  if (denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

/**
 * Compute outcode for Cohen-Sutherland clipping.
 * @param {number} x
 * @param {number} y
 * @param {ClipWindow} window
 * @returns {number}
 */
function computeOutCode(x, y, window) {
  let code = INSIDE;

  if (x < window.xmin) code |= LEFT;
  else if (x > window.xmax) code |= RIGHT;

  if (y < window.ymin) code |= BOTTOM;
  else if (y > window.ymax) code |= TOP;

  return code;
}

/**
 * Clip a line segment using Cohen-Sutherland algorithm.
 * @param {{x1: number, y1: number, x2: number, y2: number}} line
 * @param {ClipWindow} window
 * @returns {{accepted: boolean, line: {x1: number, y1: number, x2: number, y2: number} | null}}
 */
export function cohenSutherlandLineClip(line, window) {
  let { x1, y1, x2, y2 } = line;

  let outCode1 = computeOutCode(x1, y1, window);
  let outCode2 = computeOutCode(x2, y2, window);
  let accepted = false;

  while (true) {
    // Trivial accept
    if (!(outCode1 | outCode2)) {
      accepted = true;
      break;
    }

    // Trivial reject
    if (outCode1 & outCode2) {
      break;
    }

    // Pick one endpoint outside
    const outCodeOut = outCode1 ? outCode1 : outCode2;

    let x = 0;
    let y = 0;

    if (outCodeOut & TOP) {
      const t = safeRatio(window.ymax - y1, y2 - y1);
      if (t === null) break;
      x = x1 + (x2 - x1) * t;
      y = window.ymax;
    } else if (outCodeOut & BOTTOM) {
      const t = safeRatio(window.ymin - y1, y2 - y1);
      if (t === null) break;
      x = x1 + (x2 - x1) * t;
      y = window.ymin;
    } else if (outCodeOut & RIGHT) {
      const t = safeRatio(window.xmax - x1, x2 - x1);
      if (t === null) break;
      y = y1 + (y2 - y1) * t;
      x = window.xmax;
    } else if (outCodeOut & LEFT) {
      const t = safeRatio(window.xmin - x1, x2 - x1);
      if (t === null) break;
      y = y1 + (y2 - y1) * t;
      x = window.xmin;
    }

    if (outCodeOut === outCode1) {
      x1 = x;
      y1 = y;
      outCode1 = computeOutCode(x1, y1, window);
    } else {
      x2 = x;
      y2 = y;
      outCode2 = computeOutCode(x2, y2, window);
    }
  }

  if (!accepted) {
    return { accepted: false, line: null };
  }

  return {
    accepted: true,
    line: { x1, y1, x2, y2 },
  };
}

/**
 * Clip polygon by one edge for Sutherland-Hodgman.
 * @param {Point2D[]} points
 * @param {(p: Point2D) => boolean} isInside
 * @param {(a: Point2D, b: Point2D) => Point2D} intersect
 * @returns {Point2D[]}
 */
function clipAgainstEdge(points, isInside, intersect) {
  if (!points.length) return [];

  const output = [];
  let prev = points[points.length - 1];

  for (const curr of points) {
    const currInside = isInside(curr);
    const prevInside = isInside(prev);

    if (currInside) {
      if (!prevInside) {
        output.push(intersect(prev, curr));
      }
      output.push(curr);
    } else if (prevInside) {
      output.push(intersect(prev, curr));
    }

    prev = curr;
  }

  return output;
}

/**
 * Clip a polygon using Sutherland-Hodgman against an axis-aligned rectangle.
 * @param {Point2D[]} polygon
 * @param {ClipWindow} window
 * @returns {Point2D[]}
 */
export function sutherlandHodgmanPolygonClip(polygon, window) {
  if (!Array.isArray(polygon) || polygon.length < 3) {
    return [];
  }

  let output = [...polygon];

  output = clipAgainstEdge(
    output,
    (p) => p.x >= window.xmin,
    (a, b) => {
      const t = safeRatio(window.xmin - a.x, b.x - a.x);
      if (t === null) return { x: window.xmin, y: a.y };
      return { x: window.xmin, y: a.y + t * (b.y - a.y) };
    }
  );

  output = clipAgainstEdge(
    output,
    (p) => p.x <= window.xmax,
    (a, b) => {
      const t = safeRatio(window.xmax - a.x, b.x - a.x);
      if (t === null) return { x: window.xmax, y: a.y };
      return { x: window.xmax, y: a.y + t * (b.y - a.y) };
    }
  );

  output = clipAgainstEdge(
    output,
    (p) => p.y >= window.ymin,
    (a, b) => {
      const t = safeRatio(window.ymin - a.y, b.y - a.y);
      if (t === null) return { x: a.x, y: window.ymin };
      return { x: a.x + t * (b.x - a.x), y: window.ymin };
    }
  );

  output = clipAgainstEdge(
    output,
    (p) => p.y <= window.ymax,
    (a, b) => {
      const t = safeRatio(window.ymax - a.y, b.y - a.y);
      if (t === null) return { x: a.x, y: window.ymax };
      return { x: a.x + t * (b.x - a.x), y: window.ymax };
    }
  );

  return output;
}
