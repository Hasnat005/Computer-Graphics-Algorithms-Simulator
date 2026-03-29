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
export { translate2D, scale2D, rotate2D, shear2D, reflect2D, applyMatrix2D } from './transformations2D';
export { cohenSutherlandLineClip, sutherlandHodgmanPolygonClip } from './clipping';
export { projectOrthographic, projectPerspective } from './projection';
export { computeFaceNormal, backFaceCull, paintersAlgorithm, zBufferRender } from './hiddenSurface';
