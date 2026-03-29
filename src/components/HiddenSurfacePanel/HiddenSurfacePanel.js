import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  backFaceCull,
  paintersAlgorithm,
  zBufferRender,
  bresenhamLine,
} from '../../algorithms';
import './HiddenSurfacePanel.css';

function rotateY(point, angleDeg) {
  const r = (angleDeg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return {
    x: point.x * c + point.z * s,
    y: point.y,
    z: -point.x * s + point.z * c,
  };
}

function unique(points) {
  const map = new Map();
  points.forEach((p) => map.set(`${p.x},${p.y}`, p));
  return [...map.values()];
}

function getCubeFaces(angle) {
  const vertices = [
    { x: -8, y: -8, z: -8 },
    { x: 8, y: -8, z: -8 },
    { x: 8, y: 8, z: -8 },
    { x: -8, y: 8, z: -8 },
    { x: -8, y: -8, z: 8 },
    { x: 8, y: -8, z: 8 },
    { x: 8, y: 8, z: 8 },
    { x: -8, y: 8, z: 8 },
  ].map((v) => rotateY(v, angle));

  return [
    { vertices: [vertices[0], vertices[1], vertices[2], vertices[3]], color: '#ef4444' },
    { vertices: [vertices[4], vertices[5], vertices[6], vertices[7]], color: '#22c55e' },
    { vertices: [vertices[0], vertices[4], vertices[7], vertices[3]], color: '#3b82f6' },
    { vertices: [vertices[1], vertices[5], vertices[6], vertices[2]], color: '#f59e0b' },
    { vertices: [vertices[3], vertices[2], vertices[6], vertices[7]], color: '#a855f7' },
    { vertices: [vertices[0], vertices[1], vertices[5], vertices[4]], color: '#14b8a6' },
  ];
}

function projectToLogical(vertex) {
  return {
    x: Math.round(vertex.x + vertex.z * 0.4),
    y: Math.round(vertex.y + vertex.z * 0.25),
    z: vertex.z,
  };
}

function faceEdgesToPoints(faces) {
  const points = [];
  for (const face of faces) {
    const p = face.vertices.map(projectToLogical);
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      points.push(...bresenhamLine(a.x, a.y, b.x, b.y));
    }
  }
  return unique(points);
}

function HiddenSurfacePanel({ onAnimateLayer }) {
  const { state, actions } = useApp();
  const [method, setMethod] = useState('backface');
  const [angle, setAngle] = useState(25);

  const isBusy = state.isAnimating;
  const faces = useMemo(() => getCubeFaces(angle), [angle]);

  const runMethod = async () => {
    if (isBusy) return;

    let points = [];

    if (method === 'backface') {
      const visible = backFaceCull(faces, { x: 0, y: 0, z: -1 });
      points = faceEdgesToPoints(visible);
    } else if (method === 'painter') {
      const ordered = paintersAlgorithm(faces);
      points = faceEdgesToPoints(ordered);
    } else {
      const projected = faces.map((face) => ({
        ...face,
        vertices: face.vertices.map((v) => {
          const p = projectToLogical(v);
          return { x: p.x + 30, y: 30 - p.y, z: p.z + 20 };
        }),
      }));

      const zResult = zBufferRender(projected, 60, 60);
      points = zResult.pixels.map((px) => ({ x: px.x - 30, y: 30 - px.y }));
    }

    const finalPoints = unique(points);
    const paramsLabel = method === 'backface'
      ? 'Back-Face Culling'
      : method === 'zbuffer'
        ? 'Z-Buffer'
        : 'Painter\'s Algorithm';

    if (typeof onAnimateLayer === 'function') {
      await onAnimateLayer('hidden-surface', finalPoints, paramsLabel);
      return;
    }

    actions.setLayerPoints('hidden-surface', finalPoints);
    actions.addHistoryEntry('hidden-surface', {
      id: Date.now(),
      params: paramsLabel,
      pointCount: finalPoints.length,
    });
  };

  return (
    <div className="hidden-panel">
      <h3>Hidden Surface Detection</h3>
      <p className="panel-subtitle">Run visibility algorithms on a rotatable cube scene.</p>

      <label className="panel-label">Method</label>
      <select className="panel-input" value={method} onChange={(e) => setMethod(e.target.value)} disabled={isBusy}>
        <option value="backface">Back-Face Culling</option>
        <option value="zbuffer">Z-Buffer</option>
        <option value="painter">Painter's Algorithm</option>
      </select>

      <label className="panel-label">Rotation (Y-axis degrees)</label>
      <input className="panel-input" type="number" value={angle} onChange={(e) => setAngle(Number(e.target.value))} disabled={isBusy} />

      <div className="panel-actions">
        <button className="panel-btn primary" onClick={runMethod} disabled={isBusy}>Run</button>
        <button className="panel-btn" onClick={() => actions.clearLayer('hidden-surface')} disabled={isBusy}>Clear</button>
      </div>

      <div className="panel-meta">Layer points: {state.layers['hidden-surface']?.length || 0}</div>
    </div>
  );
}

export default HiddenSurfacePanel;
