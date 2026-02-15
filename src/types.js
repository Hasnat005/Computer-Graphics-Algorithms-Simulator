/**
 * Shared data types for 2D/3D algorithms.
 */

/**
 * @typedef {Object} Point3D
 * @property {number} x
 * @property {number} y
 * @property {number} z
 */

/**
 * @typedef {Object} Face
 * @property {Point3D[]} vertices
 * @property {Point3D} [normal]
 * @property {string} [color]
 */

/**
 * Create a 3D point.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {Point3D}
 */
export function createPoint3D(x, y, z) {
  return { x, y, z };
}

/**
 * Create a 3D face.
 * @param {Point3D[]} vertices
 * @param {Point3D} [normal]
 * @returns {Face}
 */
export function createFace(vertices, normal) {
  return { vertices, normal };
}
