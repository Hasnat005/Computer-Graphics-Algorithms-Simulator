/**
 * Hidden Surface Detection Algorithms
 */

function subtract(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function magnitude(vector) {
  return Math.sqrt(vector.x ** 2 + vector.y ** 2 + vector.z ** 2);
}

function normalize(vector) {
  const length = magnitude(vector);
  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

/**
 * Compute a face normal from the first three vertices.
 * @param {{vertices:Array<{x:number,y:number,z:number}>}} face
 * @returns {{x:number,y:number,z:number}}
 */
export function computeFaceNormal(face) {
  if (!face || !Array.isArray(face.vertices) || face.vertices.length < 3) {
    return { x: 0, y: 0, z: 0 };
  }

  const v0 = face.vertices[0];
  const v1 = face.vertices[1];
  const v2 = face.vertices[2];

  const edge1 = subtract(v1, v0);
  const edge2 = subtract(v2, v0);

  return normalize(cross(edge1, edge2));
}

/**
 * Back-face culling by view direction.
 * Removes faces where dot(normal, viewDir) >= 0.
 *
 * @param {Array<{vertices:Array<{x:number,y:number,z:number}>, normal?:{x:number,y:number,z:number}, color?:string}>} faces
 * @param {{x:number,y:number,z:number}} viewDir
 * @returns {Array<{vertices:Array<{x:number,y:number,z:number}>, normal:{x:number,y:number,z:number}, color?:string}>}
 */
export function backFaceCull(faces, viewDir) {
  if (!Array.isArray(faces) || !viewDir) {
    return [];
  }

  const normalizedViewDir = normalize(viewDir);

  return faces
    .map((face) => {
      const normal = computeFaceNormal(face);
      return {
        ...face,
        normal,
      };
    })
    .filter((face) => dot(face.normal, normalizedViewDir) < 0);
}

/**
 * Painter's algorithm sorting (descending average Z depth).
 *
 * @param {Array<{vertices:Array<{x:number,y:number,z:number}>, normal?:{x:number,y:number,z:number}, color?:string}>} faces
 * @returns {Array<{vertices:Array<{x:number,y:number,z:number}>, normal?:{x:number,y:number,z:number}, color?:string}>}
 */
export function paintersAlgorithm(faces) {
  if (!Array.isArray(faces)) {
    return [];
  }

  const averageDepth = (face) => {
    if (!face.vertices || face.vertices.length === 0) {
      return -Infinity;
    }

    const total = face.vertices.reduce((sum, vertex) => sum + vertex.z, 0);
    return total / face.vertices.length;
  };

  return [...faces].sort((left, right) => averageDepth(right) - averageDepth(left));
}

function rasterizeTriangle(v0, v1, v2, width, height, color, zBuffer, pixelMap) {
  const minX = Math.max(0, Math.floor(Math.min(v0.x, v1.x, v2.x)));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(v0.x, v1.x, v2.x)));
  const minY = Math.max(0, Math.floor(Math.min(v0.y, v1.y, v2.y)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(v0.y, v1.y, v2.y)));

  const area =
    (v1.y - v2.y) * (v0.x - v2.x) +
    (v2.x - v1.x) * (v0.y - v2.y);

  if (area === 0) {
    return;
  }

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const sampleX = x + 0.5;
      const sampleY = y + 0.5;

      const w0 =
        ((v1.y - v2.y) * (sampleX - v2.x) +
          (v2.x - v1.x) * (sampleY - v2.y)) /
        area;
      const w1 =
        ((v2.y - v0.y) * (sampleX - v2.x) +
          (v0.x - v2.x) * (sampleY - v2.y)) /
        area;
      const w2 = 1 - w0 - w1;

      const inside =
        (w0 >= 0 && w1 >= 0 && w2 >= 0) ||
        (w0 <= 0 && w1 <= 0 && w2 <= 0);

      if (!inside) {
        continue;
      }

      const depth = w0 * v0.z + w1 * v1.z + w2 * v2.z;

      if (depth > zBuffer[y][x]) {
        zBuffer[y][x] = depth;
        pixelMap.set(`${x},${y}`, { x, y, color, depth });
      }
    }
  }
}

/**
 * Z-buffer rendering for polygon faces in screen space.
 *
 * Expects each face vertex to already be in screen coordinates:
 * - x, y: pixel space positions
 * - z: depth value (larger means closer)
 *
 * @param {Array<{vertices:Array<{x:number,y:number,z:number}>, color?:string}>} polygonFaces
 * @param {number} width
 * @param {number} height
 * @returns {{pixels:Array<{x:number,y:number,color:string,depth:number}>, zBuffer:number[][]}}
 */
export function zBufferRender(polygonFaces, width, height) {
  if (!Array.isArray(polygonFaces) || width <= 0 || height <= 0) {
    return { pixels: [], zBuffer: [] };
  }

  const zBuffer = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => -Infinity)
  );

  const pixelMap = new Map();

  for (let i = 0; i < polygonFaces.length; i++) {
    const face = polygonFaces[i];
    if (!face || !Array.isArray(face.vertices) || face.vertices.length < 3) {
      continue;
    }

    const color = face.color || '#ffffff';
    const anchor = face.vertices[0];

    for (let triangleIndex = 1; triangleIndex < face.vertices.length - 1; triangleIndex++) {
      const v1 = face.vertices[triangleIndex];
      const v2 = face.vertices[triangleIndex + 1];
      rasterizeTriangle(anchor, v1, v2, width, height, color, zBuffer, pixelMap);
    }
  }

  return {
    pixels: [...pixelMap.values()].sort((left, right) => {
      if (left.y !== right.y) {
        return left.y - right.y;
      }
      return left.x - right.x;
    }),
    zBuffer,
  };
}
