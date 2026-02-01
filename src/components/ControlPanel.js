import React from 'react';
import './ControlPanel.css';

/**
 * ControlPanel Component
 * 
 * Provides input fields and buttons for controlling the graphics simulator.
 * Manages line and circle parameters along with algorithm selection.
 */
const ControlPanel = ({
  lineParams,
  setLineParams,
  circleParams,
  setCircleParams,
  onDrawDDA,
  onDrawBresenham,
  onDrawMidpointCircle,
  onClear,
  isAnimating,
  animationSpeed,
  setAnimationSpeed
}) => {
  /**
   * Handle line parameter changes
   */
  const handleLineChange = (field, value) => {
    const numValue = parseInt(value, 10);
    setLineParams(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };
  
  /**
   * Handle circle parameter changes
   */
  const handleCircleChange = (field, value) => {
    const numValue = parseInt(value, 10);
    setCircleParams(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue
    }));
  };
  
  return (
    <div className="control-panel">
      <h2>Control Panel</h2>
      
      {/* Line Parameters Section */}
      <section className="param-section">
        <h3>📏 Line Parameters</h3>
        <div className="input-group">
          <div className="input-row">
            <label>
              Start Point (x₁, y₁):
              <div className="coord-inputs">
                <input
                  type="number"
                  value={lineParams.x1}
                  onChange={(e) => handleLineChange('x1', e.target.value)}
                  placeholder="x₁"
                  disabled={isAnimating}
                />
                <input
                  type="number"
                  value={lineParams.y1}
                  onChange={(e) => handleLineChange('y1', e.target.value)}
                  placeholder="y₁"
                  disabled={isAnimating}
                />
              </div>
            </label>
          </div>
          <div className="input-row">
            <label>
              End Point (x₂, y₂):
              <div className="coord-inputs">
                <input
                  type="number"
                  value={lineParams.x2}
                  onChange={(e) => handleLineChange('x2', e.target.value)}
                  placeholder="x₂"
                  disabled={isAnimating}
                />
                <input
                  type="number"
                  value={lineParams.y2}
                  onChange={(e) => handleLineChange('y2', e.target.value)}
                  placeholder="y₂"
                  disabled={isAnimating}
                />
              </div>
            </label>
          </div>
        </div>
        <div className="button-group">
          <button
            className="btn btn-dda"
            onClick={onDrawDDA}
            disabled={isAnimating}
          >
            🔵 Draw DDA Line
          </button>
          <button
            className="btn btn-bresenham"
            onClick={onDrawBresenham}
            disabled={isAnimating}
          >
            🟢 Draw Bresenham Line
          </button>
        </div>
      </section>
      
      {/* Circle Parameters Section */}
      <section className="param-section">
        <h3>⭕ Circle Parameters</h3>
        <div className="input-group">
          <div className="input-row">
            <label>
              Center (cx, cy):
              <div className="coord-inputs">
                <input
                  type="number"
                  value={circleParams.cx}
                  onChange={(e) => handleCircleChange('cx', e.target.value)}
                  placeholder="cx"
                  disabled={isAnimating}
                />
                <input
                  type="number"
                  value={circleParams.cy}
                  onChange={(e) => handleCircleChange('cy', e.target.value)}
                  placeholder="cy"
                  disabled={isAnimating}
                />
              </div>
            </label>
          </div>
          <div className="input-row">
            <label>
              Radius (r):
              <input
                type="number"
                value={circleParams.r}
                onChange={(e) => handleCircleChange('r', e.target.value)}
                placeholder="r"
                min="1"
                disabled={isAnimating}
                className="single-input"
              />
            </label>
          </div>
        </div>
        <div className="button-group">
          <button
            className="btn btn-circle"
            onClick={onDrawMidpointCircle}
            disabled={isAnimating}
          >
            🟣 Draw Midpoint Circle
          </button>
        </div>
      </section>
      
      {/* Animation Speed Control */}
      <section className="param-section">
        <h3>⚡ Animation Speed</h3>
        <div className="speed-control">
          <input
            type="range"
            min="1"
            max="100"
            value={101 - animationSpeed}
            onChange={(e) => setAnimationSpeed(101 - parseInt(e.target.value))}
            disabled={isAnimating}
          />
          <span>{animationSpeed}ms delay</span>
        </div>
      </section>
      
      {/* Clear Button */}
      <section className="param-section">
        <button
          className="btn btn-clear"
          onClick={onClear}
        >
          🗑️ Clear Canvas
        </button>
      </section>
      
      {/* Algorithm Info */}
      <section className="param-section info-section">
        <h3>📚 Algorithm Info</h3>
        <div className="info-cards">
          <div className="info-card dda">
            <h4>DDA Algorithm</h4>
            <p>Uses floating-point increments. Simple but slower due to floating-point operations.</p>
          </div>
          <div className="info-card bresenham">
            <h4>Bresenham's Algorithm</h4>
            <p>Uses only integer arithmetic. More efficient for line drawing.</p>
          </div>
          <div className="info-card circle">
            <h4>Midpoint Circle</h4>
            <p>Uses 8-way symmetry and integer arithmetic. Efficient circle rasterization.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ControlPanel;
