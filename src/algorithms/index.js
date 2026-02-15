/**
 * Computer Graphics Algorithms
 * 
 * This module exports all drawing algorithms used in the simulator.
 */

export { ddaLine, bresenhamLine } from './lineAlgorithms';
export { midpointCircle } from './circleAlgorithms';
export { scanLineFill } from './polygonFill';
export { floodFill } from './polygonFill';
export { boundaryFill } from './polygonFill';
export { projectOrthographic, projectPerspective } from './projection';
export { computeFaceNormal, backFaceCull, paintersAlgorithm, zBufferRender } from './hiddenSurface';
