import React from 'react';
import { useApp } from '../../context/AppContext';
import './PolygonInputPanel.css';

function PolygonInputPanel({
  onClosePolygon,
  onClearPolygon,
  onRunScanLine,
  onFloodFill,
  onBoundaryFill,
}) {
  const { state } = useApp();
  const { polygon, isAnimating } = state;
  const { vertices, isClosed } = polygon;

  return (
    <div className="polygon-input-panel">
      <header className="polygon-input-panel-header">
        <h2 className="polygon-input-panel-title">Polygon Fill Algorithms</h2>
        <p className="polygon-input-panel-description">
          Click on canvas to add polygon vertices, then run filling algorithms.
        </p>
      </header>

      <section className="polygon-input-panel-status">
        <div className="status-item">
          <span className="status-label">Vertices</span>
          <span className="status-value">{vertices.length}</span>
        </div>
        <div className="status-item">
          <span className="status-label">State</span>
          <span className={`status-value ${isClosed ? 'closed' : 'open'}`}>
            {isClosed ? 'Closed' : 'Open'}
          </span>
        </div>
      </section>

      <section className="polygon-input-panel-list-section">
        <h3 className="list-title">Vertices</h3>
        {vertices.length === 0 ? (
          <div className="empty-vertices">No vertices yet. Click on canvas to begin.</div>
        ) : (
          <ol className="vertices-list">
            {vertices.map((vertex, index) => (
              <li key={`${vertex.x},${vertex.y},${index}`} className="vertex-item">
                <span className="vertex-index">V{index + 1}</span>
                <span className="vertex-coords">({vertex.x}, {vertex.y})</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="polygon-input-panel-actions">
        <button
          className="polygon-btn polygon-btn-primary"
          onClick={onClosePolygon}
          disabled={isAnimating || isClosed || vertices.length < 3}
        >
          Close Polygon
        </button>

        <button
          className="polygon-btn polygon-btn-ghost"
          onClick={onClearPolygon}
          disabled={isAnimating || vertices.length === 0}
        >
          Clear
        </button>

        <button
          className="polygon-btn polygon-btn-primary"
          onClick={onRunScanLine}
          disabled={isAnimating || !isClosed}
        >
          Run Scan-Line
        </button>

        <button
          className="polygon-btn polygon-btn-primary"
          onClick={onFloodFill}
          disabled={isAnimating || !isClosed}
        >
          Flood Fill
        </button>

        <button
          className="polygon-btn polygon-btn-primary"
          onClick={onBoundaryFill}
          disabled={isAnimating || !isClosed}
        >
          Boundary Fill
        </button>
      </section>
    </div>
  );
}

export default PolygonInputPanel;
