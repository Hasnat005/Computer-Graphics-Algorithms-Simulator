/**
 * Basic 2D Transformations
 *
 * Supports translation, scaling, rotation, shearing, and reflection
 * for a 2D object represented as an array of points.
 */

/**
 * @typedef {{x: number, y: number}} Point2D
 */

/**
 * Apply a 3x3 affine transformation matrix to a set of points.
 * @param {Point2D[]} points
 * @param {number[][]} matrix
 * @returns {Point2D[]}
 */
export function applyMatrix2D(points, matrix) {
  if (!Array.isArray(points)) return [];

  return points.map((point) => {
    const x = point.x;
    const y = point.y;

    return {
      x: matrix[0][0] * x + matrix[0][1] * y + matrix[0][2],
      y: matrix[1][0] * x + matrix[1][1] * y + matrix[1][2],
    };
  });
}

/**
 * Translate points by (tx, ty).
 * @param {Point2D[]} points
 * @param {number} tx
 * @param {number} ty
 * @returns {Point2D[]}
 */
export function translate2D(points, tx, ty) {
  return applyMatrix2D(points, [
    [1, 0, tx],
    [0, 1, ty],
    [0, 0, 1],
  ]);
}

/**
 * Scale points around an optional pivot.
 * @param {Point2D[]} points
 * @param {number} sx
 * @param {number} sy
 * @param {Point2D} [pivot={ x: 0, y: 0 }]
 * @returns {Point2D[]}
 */
export function scale2D(points, sx, sy, pivot = { x: 0, y: 0 }) {
  const px = pivot.x;
  const py = pivot.y;

  return points.map((point) => ({
    x: px + (point.x - px) * sx,
    y: py + (point.y - py) * sy,
  }));
}

/**
 * Rotate points by angle in degrees around an optional pivot.
 * Positive angles rotate counter-clockwise.
 * @param {Point2D[]} points
 * @param {number} angleDeg
 * @param {Point2D} [pivot={ x: 0, y: 0 }]
 * @returns {Point2D[]}
 */
export function rotate2D(points, angleDeg, pivot = { x: 0, y: 0 }) {
  const radians = (angleDeg * Math.PI) / 180;
  const cosTheta = Math.cos(radians);
  const sinTheta = Math.sin(radians);
  const px = pivot.x;
  const py = pivot.y;

  return points.map((point) => {
    const x = point.x - px;
    const y = point.y - py;

    return {
      x: px + x * cosTheta - y * sinTheta,
      y: py + x * sinTheta + y * cosTheta,
    };
  });
}

/**
 * Shear points around an optional pivot.
 * x' = x + shx * y, y' = y + shy * x
 * @param {Point2D[]} points
 * @param {number} shx
 * @param {number} shy
 * @param {Point2D} [pivot={ x: 0, y: 0 }]
 * @returns {Point2D[]}
 */
export function shear2D(points, shx, shy, pivot = { x: 0, y: 0 }) {
  const px = pivot.x;
  const py = pivot.y;

  return points.map((point) => {
    const x = point.x - px;
    const y = point.y - py;

    return {
      x: px + x + shx * y,
      y: py + y + shy * x,
    };
  });
}

/**
 * Reflect points against common reference lines/axes.
 * @param {Point2D[]} points
 * @param {'x' | 'y' | 'origin' | 'y=x' | 'y=-x'} axis
 * @returns {Point2D[]}
 */
export function reflect2D(points, axis) {
  if (!Array.isArray(points)) return [];

  switch (axis) {
    case 'x':
      return points.map((point) => ({ x: point.x, y: -point.y }));
    case 'y':
      return points.map((point) => ({ x: -point.x, y: point.y }));
    case 'origin':
      return points.map((point) => ({ x: -point.x, y: -point.y }));
    case 'y=x':
      return points.map((point) => ({ x: point.y, y: point.x }));
    case 'y=-x':
      return points.map((point) => ({ x: -point.y, y: -point.x }));
    default:
      return points.map((point) => ({ ...point }));
  }
}
