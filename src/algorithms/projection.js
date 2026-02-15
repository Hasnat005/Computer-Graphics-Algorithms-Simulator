/**
 * 3D Projection Algorithms
 */

const DEFAULT_CAMERA = {
  position: { x: 0, y: 0, z: 0 },
  viewportWidth: 600,
  viewportHeight: 600,
  scale: 10,
  focalLength: 300,
};

function resolveCamera(camera = {}) {
  return {
    ...DEFAULT_CAMERA,
    ...camera,
    position: {
      ...DEFAULT_CAMERA.position,
      ...(camera.position || {}),
    },
  };
}

/**
 * Orthographic projection from 3D world point to 2D canvas coordinates.
 *
 * @param {{x:number,y:number,z:number}} point
 * @param {{position?:{x:number,y:number,z:number}, viewportWidth?:number, viewportHeight?:number, scale?:number}} camera
 * @returns {{x:number,y:number,depth:number,visible:boolean}}
 */
export function projectOrthographic(point, camera = {}) {
  const resolvedCamera = resolveCamera(camera);
  const relativeX = point.x - resolvedCamera.position.x;
  const relativeY = point.y - resolvedCamera.position.y;
  const relativeZ = point.z - resolvedCamera.position.z;

  return {
    x: resolvedCamera.viewportWidth / 2 + relativeX * resolvedCamera.scale,
    y: resolvedCamera.viewportHeight / 2 - relativeY * resolvedCamera.scale,
    depth: relativeZ,
    visible: true,
  };
}

/**
 * Perspective projection from 3D world point to 2D canvas coordinates.
 *
 * Uses camera-relative coordinates and a focal-length perspective divide.
 *
 * @param {{x:number,y:number,z:number}} point
 * @param {{position?:{x:number,y:number,z:number}, viewportWidth?:number, viewportHeight?:number, scale?:number, focalLength?:number}} camera
 * @returns {{x:number,y:number,depth:number,visible:boolean}}
 */
export function projectPerspective(point, camera = {}) {
  const resolvedCamera = resolveCamera(camera);
  const relativeX = point.x - resolvedCamera.position.x;
  const relativeY = point.y - resolvedCamera.position.y;
  const relativeZ = point.z - resolvedCamera.position.z;

  const denominator = resolvedCamera.focalLength + relativeZ;
  const visible = denominator > 0;

  if (!visible) {
    return {
      x: resolvedCamera.viewportWidth / 2,
      y: resolvedCamera.viewportHeight / 2,
      depth: relativeZ,
      visible: false,
    };
  }

  const perspectiveScale = (resolvedCamera.focalLength / denominator) * resolvedCamera.scale;

  return {
    x: resolvedCamera.viewportWidth / 2 + relativeX * perspectiveScale,
    y: resolvedCamera.viewportHeight / 2 - relativeY * perspectiveScale,
    depth: relativeZ,
    visible: true,
  };
}
