import React from 'react';
import { useApp, useAlgorithm, useSimulation } from '../../context/AppContext';
import './AlgorithmPanel.css';

/**
 * Algorithm Panel Component
 * 
 * Renders algorithm-specific input fields and controls.
 * Each algorithm has isolated state and controls.
 */

// Algorithm metadata
const ALGORITHM_CONFIG = {
  dda: {
    title: 'DDA Line Algorithm',
    description: 'Digital Differential Analyzer uses floating-point arithmetic to calculate intermediate points.',
    color: 'primary',
    fields: [
      { group: 'start', label: 'Start Point', fields: ['x1', 'y1'] },
      { group: 'end', label: 'End Point', fields: ['x2', 'y2'] },
    ],
  },
  bresenham: {
    title: "Bresenham's Line Algorithm",
    description: 'Uses only integer arithmetic for efficient line rasterization.',
    color: 'green',
    fields: [
      { group: 'start', label: 'Start Point', fields: ['x1', 'y1'] },
      { group: 'end', label: 'End Point', fields: ['x2', 'y2'] },
    ],
  },
  circle: {
    title: 'Midpoint Circle Algorithm',
    description: 'Utilizes 8-way symmetry and integer arithmetic for efficient circle drawing.',
    color: 'purple',
    fields: [
      { group: 'center', label: 'Center Point', fields: ['cx', 'cy'] },
      { group: 'radius', label: 'Radius', fields: ['r'] },
    ],
  },
};

// Field labels for display
const FIELD_LABELS = {
  x1: 'X₁',
  y1: 'Y₁',
  x2: 'X₂',
  y2: 'Y₂',
  cx: 'Cx',
  cy: 'Cy',
  r: 'R',
};

function AlgorithmPanel({ algorithm, onDraw }) {
  const { state } = useApp();
  const { params, history, isAnimating, setParams, clear } = useAlgorithm(algorithm);
  const { isAnimating: globalAnimating } = useSimulation();
  
  const config = ALGORITHM_CONFIG[algorithm];
  
  // Handle input change
  const handleInputChange = (field, value) => {
    const numValue = parseInt(value, 10);
    setParams({ [field]: isNaN(numValue) ? 0 : numValue });
  };
  
  // Handle draw action
  const handleDraw = () => {
    if (!globalAnimating && onDraw) {
      onDraw(algorithm, params);
    }
  };
  
  // Handle clear action
  const handleClear = () => {
    clear();
  };
  
  return (
    <div className={`algorithm-panel algorithm-panel--${config.color}`}>
      {/* Header */}
      <header className="algorithm-panel-header">
        <h2 className="algorithm-panel-title">{config.title}</h2>
        <p className="algorithm-panel-description">{config.description}</p>
      </header>
      
      {/* Input Fields */}
      <section className="algorithm-panel-inputs">
        {config.fields.map((group) => (
          <div key={group.group} className="input-field-group">
            <label className="input-field-label">{group.label}</label>
            <div className="input-field-row">
              {group.fields.map((field) => (
                <div key={field} className="input-field">
                  <span className="input-field-prefix">{FIELD_LABELS[field]}</span>
                  <input
                    type="number"
                    value={params[field]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    disabled={globalAnimating}
                    className="input-field-input"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
      
      {/* Action Buttons */}
      <section className="algorithm-panel-actions">
        <button
          className={`btn btn-draw btn-draw--${config.color}`}
          onClick={handleDraw}
          disabled={globalAnimating}
        >
          {isAnimating ? 'Drawing...' : 'Draw'}
        </button>
        <button
          className="btn btn-clear"
          onClick={handleClear}
          disabled={globalAnimating}
        >
          Clear
        </button>
      </section>
      
      {/* History */}
      {history.length > 0 && (
        <section className="algorithm-panel-history">
          <h3 className="history-title">Recent Drawings</h3>
          <ul className="history-list">
            {history.map((entry) => (
              <li key={entry.id} className="history-item">
                <span className="history-params">{entry.params}</span>
                <span className="history-points">{entry.pointCount} px</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      
      {/* Algorithm Info */}
      <section className="algorithm-panel-info">
        <div className="info-stat">
          <span className="info-stat-label">Layer Points</span>
          <span className="info-stat-value">{state.layers[algorithm].length}</span>
        </div>
      </section>
    </div>
  );
}

export default AlgorithmPanel;
