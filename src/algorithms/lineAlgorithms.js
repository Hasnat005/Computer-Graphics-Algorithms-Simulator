/**
 * Line Drawing Algorithms
 * 
 * This module contains implementations of classic line drawing algorithms
 * used in computer graphics rasterization.
 */

/**
 * DDA (Digital Differential Analyzer) Line Drawing Algorithm
 * 
 * The DDA algorithm is a simple line generation algorithm that uses
 * floating-point arithmetic. It calculates the intermediate points
 * by computing the slope and incrementing x or y based on which
 * dimension has the larger change.
 * 
 * Algorithm Steps:
 * 1. Calculate dx (x2 - x1) and dy (y2 - y1)
 * 2. Determine the number of steps as max(|dx|, |dy|)
 * 3. Calculate x-increment and y-increment per step
 * 4. Start from (x1, y1) and plot points by incrementing
 * 
 * Time Complexity: O(max(|dx|, |dy|))
 * 
 * @param {number} x1 - Starting x coordinate
 * @param {number} y1 - Starting y coordinate
 * @param {number} x2 - Ending x coordinate
 * @param {number} y2 - Ending y coordinate
 * @returns {Array<{x: number, y: number}>} Array of pixel coordinates
 */
export function ddaLine(x1, y1, x2, y2) {
  const points = [];
  
  // Calculate the differences
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Determine the number of steps required
  // We take the maximum of absolute differences to ensure
  // we don't skip any pixels along the longer axis
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  
  // Handle the case where start and end points are the same
  if (steps === 0) {
    points.push({ x: Math.round(x1), y: Math.round(y1) });
    return points;
  }
  
  // Calculate the increment for each step
  // This gives us the exact amount to move in each dimension per step
  const xIncrement = dx / steps;
  const yIncrement = dy / steps;
  
  // Start from the initial point
  let x = x1;
  let y = y1;
  
  // Generate all points along the line
  for (let i = 0; i <= steps; i++) {
    // Round to get the nearest pixel coordinate
    points.push({
      x: Math.round(x),
      y: Math.round(y)
    });
    
    // Increment x and y for the next iteration
    x += xIncrement;
    y += yIncrement;
  }
  
  return points;
}

/**
 * Bresenham's Line Drawing Algorithm
 * 
 * Bresenham's algorithm is an efficient line drawing algorithm that uses
 * only integer arithmetic, making it faster than DDA. It determines which
 * pixel to plot next by maintaining a decision parameter.
 * 
 * Algorithm Steps:
 * 1. Calculate dx and dy
 * 2. Initialize decision parameter p = 2*dy - dx (for |slope| < 1)
 * 3. For each x, if p < 0, next point is (x+1, y) and p += 2*dy
 *    Otherwise, next point is (x+1, y+1) and p += 2*dy - 2*dx
 * 
 * The algorithm handles all octants by swapping x/y and adjusting signs.
 * 
 * Time Complexity: O(max(|dx|, |dy|))
 * 
 * @param {number} x1 - Starting x coordinate
 * @param {number} y1 - Starting y coordinate
 * @param {number} x2 - Ending x coordinate
 * @param {number} y2 - Ending y coordinate
 * @returns {Array<{x: number, y: number}>} Array of pixel coordinates
 */
export function bresenhamLine(x1, y1, x2, y2) {
  const points = [];
  
  // Calculate absolute differences
  let dx = Math.abs(x2 - x1);
  let dy = Math.abs(y2 - y1);
  
  // Determine the direction of increment
  const sx = x1 < x2 ? 1 : -1;  // Step in x direction
  const sy = y1 < y2 ? 1 : -1;  // Step in y direction
  
  // Initialize error term
  // This is the accumulated error that determines when to step in the minor axis
  let err = dx - dy;
  
  let x = x1;
  let y = y1;
  
  while (true) {
    // Plot the current point
    points.push({ x, y });
    
    // Check if we've reached the end point
    if (x === x2 && y === y2) break;
    
    // Calculate error * 2 to avoid floating point operations
    const e2 = 2 * err;
    
    // Decide whether to step in x direction
    // If e2 > -dy, we step in x and adjust error
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    
    // Decide whether to step in y direction
    // If e2 < dx, we step in y and adjust error
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return points;
}
