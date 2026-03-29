import {
  translate2D,
  scale2D,
  rotate2D,
  shear2D,
  reflect2D,
} from './transformations2D';

describe('2D Transformations', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
  ];

  test('translate2D shifts points by tx, ty', () => {
    const result = translate2D(square, 3, -1);
    expect(result).toEqual([
      { x: 3, y: -1 },
      { x: 5, y: -1 },
      { x: 5, y: 1 },
      { x: 3, y: 1 },
    ]);
  });

  test('scale2D scales points around origin', () => {
    const result = scale2D(square, 2, 0.5);
    expect(result).toEqual([
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
      { x: 0, y: 1 },
    ]);
  });

  test('scale2D scales points around pivot', () => {
    const result = scale2D([{ x: 2, y: 1 }], 2, 2, { x: 1, y: 1 });
    expect(result).toEqual([{ x: 3, y: 1 }]);
  });

  test('rotate2D rotates point by 90 degrees around origin', () => {
    const result = rotate2D([{ x: 1, y: 0 }], 90);
    expect(result[0].x).toBeCloseTo(0, 6);
    expect(result[0].y).toBeCloseTo(1, 6);
  });

  test('shear2D shears x axis with shx', () => {
    const result = shear2D([{ x: 2, y: 3 }], 1, 0);
    expect(result).toEqual([{ x: 5, y: 3 }]);
  });

  test('reflect2D reflects across x-axis', () => {
    const result = reflect2D([{ x: 2, y: 3 }], 'x');
    expect(result).toEqual([{ x: 2, y: -3 }]);
  });

  test('reflect2D reflects across y=x', () => {
    const result = reflect2D([{ x: 2, y: 5 }], 'y=x');
    expect(result).toEqual([{ x: 5, y: 2 }]);
  });
});
