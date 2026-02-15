import React from 'react';
import { render, cleanup } from '@testing-library/react';
import {
  computeFaceNormal,
  backFaceCull,
  paintersAlgorithm,
  zBufferRender,
} from './hiddenSurface';

afterEach(() => {
  cleanup();
});

const ResultMapSnapshot = ({ map }) => (
  <pre data-testid="result-map">{map}</pre>
);

describe('hidden surface algorithms', () => {
  test('computeFaceNormal computes normalized face normal', () => {
    const face = {
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    };

    const normal = computeFaceNormal(face);

    expect(normal.x).toBeCloseTo(0, 5);
    expect(normal.y).toBeCloseTo(0, 5);
    expect(normal.z).toBeCloseTo(1, 5);
  });

  test('backFaceCull removes faces with dot(normal, viewDir) >= 0', () => {
    const frontFace = {
      id: 'front',
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 0, z: 0 },
      ],
    };

    const backFace = {
      id: 'back',
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    };

    const culled = backFaceCull([frontFace, backFace], { x: 0, y: 0, z: 1 });

    expect(culled).toHaveLength(1);
    expect(culled[0].id).toBe('front');

    const cullMap = [
      'Input: front, back',
      `Kept: ${culled.map((face) => face.id).join(', ')}`,
    ].join('\n');

    expect(cullMap).toBe('Input: front, back\nKept: front');

    const { container } = render(<ResultMapSnapshot map={cullMap} />);
    expect(container.firstChild).toMatchSnapshot('backFaceCull kept-face map');
  });

  test("paintersAlgorithm sorts faces by descending average Z", () => {
    const near = { id: 'near', vertices: [{ x: 0, y: 0, z: 9 }, { x: 1, y: 0, z: 9 }, { x: 0, y: 1, z: 9 }] };
    const mid = { id: 'mid', vertices: [{ x: 0, y: 0, z: 4 }, { x: 1, y: 0, z: 4 }, { x: 0, y: 1, z: 4 }] };
    const far = { id: 'far', vertices: [{ x: 0, y: 0, z: -2 }, { x: 1, y: 0, z: -2 }, { x: 0, y: 1, z: -2 }] };

    const sorted = paintersAlgorithm([mid, far, near]);

    expect(sorted.map((face) => face.id)).toEqual(['near', 'mid', 'far']);

    const depthMap = sorted
      .map((face, index) => `${index + 1}. ${face.id}`)
      .join('\n');

    expect(depthMap).toBe([
      '1. near',
      '2. mid',
      '3. far',
    ].join('\n'));

    const { container } = render(<ResultMapSnapshot map={depthMap} />);
    expect(container.firstChild).toMatchSnapshot('paintersAlgorithm depth-order map');
  });

  test('zBufferRender keeps closest pixel by depth', () => {
    const farFace = {
      color: '#00ff00',
      vertices: [
        { x: 2, y: 2, z: 1 },
        { x: 6, y: 2, z: 1 },
        { x: 2, y: 6, z: 1 },
      ],
    };

    const nearFace = {
      color: '#ff0000',
      vertices: [
        { x: 2, y: 2, z: 5 },
        { x: 6, y: 2, z: 5 },
        { x: 2, y: 6, z: 5 },
      ],
    };

    const { pixels, zBuffer } = zBufferRender([farFace, nearFace], 10, 10);

    expect(pixels.length).toBeGreaterThan(0);

    const overlappingPixel = pixels.find((pixel) => pixel.x === 3 && pixel.y === 3);
    expect(overlappingPixel).toBeDefined();
    expect(overlappingPixel.color).toBe('#ff0000');
    expect(overlappingPixel.depth).toBeCloseTo(5, 5);
    expect(zBuffer[3][3]).toBeCloseTo(5, 5);
  });
});
