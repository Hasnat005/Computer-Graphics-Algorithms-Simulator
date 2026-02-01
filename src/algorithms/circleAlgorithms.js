/**
 * Circle Drawing Algorithms
 * 
 * This module contains implementations of circle drawing algorithms
 * used in computer graphics rasterization.
 */

/**
 * Plots a point in all 8 octants using 8-way symmetry
 * 
 * A circle has 8-way symmetry, meaning if we calculate points in one octant,
 * we can derive points in all other octants through reflection.
 * 
 * Given a point (x, y) relative to center (cx, cy), the 8 symmetric points are:
 * 1. (cx + x, cy + y) - Original point
 * 2. (cx - x, cy + y) - Reflect across y-axis
 * 3. (cx + x, cy - y) - Reflect across x-axis
 * 4. (cx - x, cy - y) - Reflect across both axes
 * 5. (cx + y, cy + x) - Swap x and y
 * 6. (cx - y, cy + x) - Swap and reflect across y-axis
 * 7. (cx + y, cy - x) - Swap and reflect across x-axis
 * 8. (cx - y, cy - x) - Swap and reflect across both axes
 * 
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} x - X offset from center
 * @param {number} y - Y offset from center
 * @returns {Array<{x: number, y: number}>} Array of 8 symmetric points
 */
function plotCirclePoints(cx, cy, x, y) {
  return [
    { x: cx + x, y: cy + y },
    { x: cx - x, y: cy + y },
    { x: cx + x, y: cy - y },
    { x: cx - x, y: cy - y },
    { x: cx + y, y: cy + x },
    { x: cx - y, y: cy + x },
    { x: cx + y, y: cy - x },
    { x: cx - y, y: cy - x }
  ];
}

/**
 * Midpoint Circle Drawing Algorithm (Bresenham's Circle Algorithm)
 * 
 * The Midpoint Circle Algorithm uses the concept of a decision parameter
 * to determine which pixel is closer to the actual circle. It only uses
 * integer arithmetic, making it efficient.
 * 
 * The algorithm works in the first octant (from (0, r) to (r/√2, r/√2))
 * and uses 8-way symmetry to draw the complete circle.
 * 
 * Algorithm Steps:
 * 1. Start at (0, r) - top of the circle
 * 2. Initialize decision parameter p = 1 - r
 * 3. For each point, we always increment x
 * 4. If p < 0, the midpoint is inside the circle, keep y the same
 *    and update p = p + 2x + 1
 * 5. If p >= 0, the midpoint is outside, decrement y
 *    and update p = p + 2x - 2y + 1
 * 6. Continue until x >= y (end of first octant)
 * 
 * The decision parameter determines whether the actual circle passes
 * above or below the midpoint between two candidate pixels.
 * 
 * Time Complexity: O(r) where r is the radius
 * 
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} r - Radius of the circle
 * @returns {Array<{x: number, y: number}>} Array of pixel coordinates
 */
export function midpointCircle(cx, cy, r) {
  const points = [];
  
  // Handle edge case of zero or negative radius
  if (r <= 0) {
    points.push({ x: cx, y: cy });
    return points;
  }
  
  // Start at the top of the circle
  let x = 0;
  let y = r;
  
  // Initial decision parameter
  // Derived from the circle equation: x² + y² - r² = 0
  // p = 1 - r is the simplified initial value
  let p = 1 - r;
  
  // Plot the initial point and its symmetric points
  points.push(...plotCirclePoints(cx, cy, x, y));
  
  // Continue until we reach the 45-degree line (x = y)
  // We only need to calculate points in the first octant
  while (x < y) {
    x++;
    
    if (p < 0) {
      // Midpoint is inside the circle
      // Choose the pixel at (x+1, y)
      // Update decision parameter for next iteration
      p = p + 2 * x + 1;
    } else {
      // Midpoint is outside or on the circle
      // Choose the pixel at (x+1, y-1)
      y--;
      // Update decision parameter for next iteration
      p = p + 2 * x - 2 * y + 1;
    }
    
    // Plot all 8 symmetric points
    points.push(...plotCirclePoints(cx, cy, x, y));
  }
  
  // Remove duplicate points that occur at octant boundaries
  // (when x = 0, y = r, or x = y)
  const uniquePoints = [];
  const seen = new Set();
  
  for (const point of points) {
    const key = `${point.x},${point.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePoints.push(point);
    }
  }
  
  return uniquePoints;
}
