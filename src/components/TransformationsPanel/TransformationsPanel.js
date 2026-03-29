import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  translate2D,
  scale2D,
  rotate2D,
  shear2D,
  reflect2D,
  bresenhamLine,
} from '../../algorithms';
import './TransformationsPanel.css';

const DEFAULT_POINTS = '-12,-8; 12,-8; 12,8; -12,8';

function parsePoints(value) {
  return value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.split(',').map((v) => Number(v.trim()));
      return { x, y };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

function toEdgePoints(vertices, closed = true) {
  if (vertices.length < 2) return [];
  const points = [];

  for (let i = 0; i < vertices.length - 1; i++) {
    points.push(...bresenhamLine(Math.round(vertices[i].x), Math.round(vertices[i].y), Math.round(vertices[i + 1].x), Math.round(vertices[i + 1].y)));
  }

  if (closed) {
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    points.push(...bresenhamLine(Math.round(last.x), Math.round(last.y), Math.round(first.x), Math.round(first.y)));
  }

  const unique = new Map();
  points.forEach((p) => unique.set(`${p.x},${p.y}`, p));
  return [...unique.values()];
}

function TransformationsPanel({ onAnimateLayer }) {
  const { state, actions } = useApp();
  const [pointsText, setPointsText] = useState(DEFAULT_POINTS);
  const [operation, setOperation] = useState('translation');
  const [params, setParams] = useState({
    tx: 5,
    ty: 4,
    sx: 1.5,
    sy: 1.5,
    angle: 30,
    shx: 0.5,
    shy: 0,
    axis: 'x',
    px: 0,
    py: 0,
  });

  const isBusy = state.isAnimating;
  const currentLayerCount = state.layers.transformations?.length || 0;

  const parsedPoints = useMemo(() => parsePoints(pointsText), [pointsText]);

  const handleParam = (key, value) => {
    setParams((prev) => ({
      ...prev,
      [key]: ['axis'].includes(key) ? value : Number(value),
    }));
  };

  const runTransformation = async () => {
    if (parsedPoints.length < 2 || isBusy) return;

    let transformed = parsedPoints;

    switch (operation) {
      case 'translation':
        transformed = translate2D(parsedPoints, params.tx, params.ty);
        break;
      case 'scaling':
        transformed = scale2D(parsedPoints, params.sx, params.sy, { x: params.px, y: params.py });
        break;
      case 'rotation':
        transformed = rotate2D(parsedPoints, params.angle, { x: params.px, y: params.py });
        break;
      case 'shearing':
        transformed = shear2D(parsedPoints, params.shx, params.shy, { x: params.px, y: params.py });
        break;
      case 'reflection':
        transformed = reflect2D(parsedPoints, params.axis);
        break;
      default:
        break;
    }

    const points = toEdgePoints(transformed, true);
    const paramsLabel = `${operation} (${parsedPoints.length} vertices)`;

    if (typeof onAnimateLayer === 'function') {
      await onAnimateLayer('transformations', points, paramsLabel);
      return;
    }

    actions.setLayerPoints('transformations', points);
    actions.addHistoryEntry('transformations', {
      id: Date.now(),
      params: paramsLabel,
      pointCount: points.length,
    });
  };

  const clearLayer = () => actions.clearLayer('transformations');

  return (
    <div className="transform-panel">
      <h3>Basic 2D Transformations</h3>
      <p className="panel-subtitle">Enter polygon points as x,y; x,y; ... then apply a transform.</p>

      <label className="panel-label">Object Vertices</label>
      <textarea
        className="panel-textarea"
        value={pointsText}
        onChange={(e) => setPointsText(e.target.value)}
        disabled={isBusy}
      />

      <div className="panel-row">
        <label className="panel-label">Operation</label>
        <select
          className="panel-input"
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          disabled={isBusy}
        >
          <option value="translation">Translation</option>
          <option value="scaling">Scaling</option>
          <option value="rotation">Rotation</option>
          <option value="shearing">Shearing</option>
          <option value="reflection">Reflection</option>
        </select>
      </div>

      {operation === 'translation' && (
        <div className="panel-grid two">
          <input className="panel-input" type="number" value={params.tx} onChange={(e) => handleParam('tx', e.target.value)} disabled={isBusy} placeholder="tx" />
          <input className="panel-input" type="number" value={params.ty} onChange={(e) => handleParam('ty', e.target.value)} disabled={isBusy} placeholder="ty" />
        </div>
      )}

      {operation === 'scaling' && (
        <>
          <div className="panel-grid two">
            <input className="panel-input" type="number" step="0.1" value={params.sx} onChange={(e) => handleParam('sx', e.target.value)} disabled={isBusy} placeholder="sx" />
            <input className="panel-input" type="number" step="0.1" value={params.sy} onChange={(e) => handleParam('sy', e.target.value)} disabled={isBusy} placeholder="sy" />
          </div>
          <div className="panel-grid two">
            <input className="panel-input" type="number" value={params.px} onChange={(e) => handleParam('px', e.target.value)} disabled={isBusy} placeholder="pivot x" />
            <input className="panel-input" type="number" value={params.py} onChange={(e) => handleParam('py', e.target.value)} disabled={isBusy} placeholder="pivot y" />
          </div>
        </>
      )}

      {operation === 'rotation' && (
        <>
          <input className="panel-input" type="number" value={params.angle} onChange={(e) => handleParam('angle', e.target.value)} disabled={isBusy} placeholder="angle" />
          <div className="panel-grid two">
            <input className="panel-input" type="number" value={params.px} onChange={(e) => handleParam('px', e.target.value)} disabled={isBusy} placeholder="pivot x" />
            <input className="panel-input" type="number" value={params.py} onChange={(e) => handleParam('py', e.target.value)} disabled={isBusy} placeholder="pivot y" />
          </div>
        </>
      )}

      {operation === 'shearing' && (
        <>
          <div className="panel-grid two">
            <input className="panel-input" type="number" step="0.1" value={params.shx} onChange={(e) => handleParam('shx', e.target.value)} disabled={isBusy} placeholder="shx" />
            <input className="panel-input" type="number" step="0.1" value={params.shy} onChange={(e) => handleParam('shy', e.target.value)} disabled={isBusy} placeholder="shy" />
          </div>
          <div className="panel-grid two">
            <input className="panel-input" type="number" value={params.px} onChange={(e) => handleParam('px', e.target.value)} disabled={isBusy} placeholder="pivot x" />
            <input className="panel-input" type="number" value={params.py} onChange={(e) => handleParam('py', e.target.value)} disabled={isBusy} placeholder="pivot y" />
          </div>
        </>
      )}

      {operation === 'reflection' && (
        <select className="panel-input" value={params.axis} onChange={(e) => handleParam('axis', e.target.value)} disabled={isBusy}>
          <option value="x">X-axis</option>
          <option value="y">Y-axis</option>
          <option value="origin">Origin</option>
          <option value="y=x">y = x</option>
          <option value="y=-x">y = -x</option>
        </select>
      )}

      <div className="panel-actions">
        <button className="panel-btn primary" onClick={runTransformation} disabled={isBusy || parsedPoints.length < 2}>Run</button>
        <button className="panel-btn" onClick={clearLayer} disabled={isBusy}>Clear</button>
      </div>

      <div className="panel-meta">Layer points: {currentLayerCount}</div>
    </div>
  );
}

export default TransformationsPanel;
