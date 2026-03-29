import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  bresenhamLine,
  cohenSutherlandLineClip,
  sutherlandHodgmanPolygonClip,
} from '../../algorithms';
import './ClippingPanel.css';

const DEFAULT_POLYGON = '-15,-5; -5,10; 10,12; 16,-4; 2,-12';

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

function unique(points) {
  const map = new Map();
  points.forEach((p) => map.set(`${p.x},${p.y}`, p));
  return [...map.values()];
}

function polylineToPoints(vertices, closed = true) {
  if (vertices.length < 2) return [];
  const points = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    points.push(...bresenhamLine(Math.round(vertices[i].x), Math.round(vertices[i].y), Math.round(vertices[i + 1].x), Math.round(vertices[i + 1].y)));
  }
  if (closed) {
    const last = vertices[vertices.length - 1];
    const first = vertices[0];
    points.push(...bresenhamLine(Math.round(last.x), Math.round(last.y), Math.round(first.x), Math.round(first.y)));
  }
  return unique(points);
}

function rectanglePoints(window) {
  const rect = [
    { x: window.xmin, y: window.ymin },
    { x: window.xmax, y: window.ymin },
    { x: window.xmax, y: window.ymax },
    { x: window.xmin, y: window.ymax },
  ];
  return polylineToPoints(rect, true);
}

function ClippingPanel({ onAnimateLayer }) {
  const { state, actions } = useApp();
  const [mode, setMode] = useState('line');
  const [window, setWindow] = useState({ xmin: -10, ymin: -10, xmax: 10, ymax: 10 });
  const [line, setLine] = useState({ x1: -20, y1: 8, x2: 22, y2: -6 });
  const [polygonText, setPolygonText] = useState(DEFAULT_POLYGON);

  const isBusy = state.isAnimating;
  const polygon = useMemo(() => parsePoints(polygonText), [polygonText]);

  const setWin = (key, value) => setWindow((prev) => ({ ...prev, [key]: Number(value) }));
  const setLn = (key, value) => setLine((prev) => ({ ...prev, [key]: Number(value) }));

  const runClipping = async () => {
    if (isBusy) return;

    const base = rectanglePoints(window);
    let resultPoints = [...base];

    if (mode === 'line') {
      const clipped = cohenSutherlandLineClip(line, window);
      if (clipped.accepted && clipped.line) {
        resultPoints = resultPoints.concat(
          bresenhamLine(
            Math.round(clipped.line.x1),
            Math.round(clipped.line.y1),
            Math.round(clipped.line.x2),
            Math.round(clipped.line.y2)
          )
        );
      }
    } else {
      const clippedPolygon = sutherlandHodgmanPolygonClip(polygon, window);
      resultPoints = resultPoints.concat(polylineToPoints(clippedPolygon, true));
    }

    const points = unique(resultPoints);
    const paramsLabel = mode === 'line' ? 'Cohen-Sutherland' : 'Sutherland-Hodgman';

    if (typeof onAnimateLayer === 'function') {
      await onAnimateLayer('clipping', points, paramsLabel);
      return;
    }

    actions.setLayerPoints('clipping', points);
    actions.addHistoryEntry('clipping', {
      id: Date.now(),
      params: paramsLabel,
      pointCount: points.length,
    });
  };

  return (
    <div className="clip-panel">
      <h3>Clipping Algorithms</h3>
      <p className="panel-subtitle">Run Cohen-Sutherland or Sutherland-Hodgman against a clipping window.</p>

      <label className="panel-label">Mode</label>
      <select className="panel-input" value={mode} onChange={(e) => setMode(e.target.value)} disabled={isBusy}>
        <option value="line">Cohen-Sutherland (Line)</option>
        <option value="polygon">Sutherland-Hodgman (Polygon)</option>
      </select>

      <label className="panel-label">Clip Window</label>
      <div className="panel-grid two">
        <input className="panel-input" type="number" value={window.xmin} onChange={(e) => setWin('xmin', e.target.value)} disabled={isBusy} placeholder="xmin" />
        <input className="panel-input" type="number" value={window.xmax} onChange={(e) => setWin('xmax', e.target.value)} disabled={isBusy} placeholder="xmax" />
        <input className="panel-input" type="number" value={window.ymin} onChange={(e) => setWin('ymin', e.target.value)} disabled={isBusy} placeholder="ymin" />
        <input className="panel-input" type="number" value={window.ymax} onChange={(e) => setWin('ymax', e.target.value)} disabled={isBusy} placeholder="ymax" />
      </div>

      {mode === 'line' ? (
        <>
          <label className="panel-label">Line</label>
          <div className="panel-grid two">
            <input className="panel-input" type="number" value={line.x1} onChange={(e) => setLn('x1', e.target.value)} disabled={isBusy} placeholder="x1" />
            <input className="panel-input" type="number" value={line.y1} onChange={(e) => setLn('y1', e.target.value)} disabled={isBusy} placeholder="y1" />
            <input className="panel-input" type="number" value={line.x2} onChange={(e) => setLn('x2', e.target.value)} disabled={isBusy} placeholder="x2" />
            <input className="panel-input" type="number" value={line.y2} onChange={(e) => setLn('y2', e.target.value)} disabled={isBusy} placeholder="y2" />
          </div>
        </>
      ) : (
        <>
          <label className="panel-label">Polygon Vertices</label>
          <textarea className="panel-textarea" value={polygonText} onChange={(e) => setPolygonText(e.target.value)} disabled={isBusy} />
        </>
      )}

      <div className="panel-actions">
        <button className="panel-btn primary" onClick={runClipping} disabled={isBusy}>Run</button>
        <button className="panel-btn" onClick={() => actions.clearLayer('clipping')} disabled={isBusy}>Clear</button>
      </div>

      <div className="panel-meta">Layer points: {state.layers.clipping?.length || 0}</div>
    </div>
  );
}

export default ClippingPanel;
