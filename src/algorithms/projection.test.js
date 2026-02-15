import { projectOrthographic, projectPerspective } from './projection';

describe('projection algorithms', () => {
  test('projectOrthographic returns centered 2D coords with depth', () => {
    const point = { x: 2, y: 1, z: 7 };
    const camera = {
      position: { x: 0, y: 0, z: 0 },
      viewportWidth: 100,
      viewportHeight: 80,
      scale: 10,
    };

    const projected = projectOrthographic(point, camera);

    expect(projected).toEqual({
      x: 70,
      y: 30,
      depth: 7,
      visible: true,
    });
  });

  test('projectPerspective applies perspective divide and depth', () => {
    const point = { x: 10, y: 0, z: 50 };
    const camera = {
      position: { x: 0, y: 0, z: 0 },
      viewportWidth: 200,
      viewportHeight: 100,
      scale: 1,
      focalLength: 100,
    };

    const projected = projectPerspective(point, camera);

    expect(projected.visible).toBe(true);
    expect(projected.depth).toBe(50);
    expect(projected.x).toBeCloseTo(106.666, 2);
    expect(projected.y).toBeCloseTo(50, 5);
  });

  test('projectPerspective marks points behind near plane as not visible', () => {
    const point = { x: 1, y: 1, z: -200 };
    const camera = {
      viewportWidth: 100,
      viewportHeight: 100,
      focalLength: 100,
    };

    const projected = projectPerspective(point, camera);

    expect(projected.visible).toBe(false);
    expect(projected.depth).toBe(-200);
  });
});
