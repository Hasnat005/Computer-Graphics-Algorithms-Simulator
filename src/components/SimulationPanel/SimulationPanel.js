import React from 'react';
import { useSimulation, useApp } from '../../context/AppContext';
import './SimulationPanel.css';

/**
 * Simulation Panel Component
 * 
 * Centralized controls for animation and simulation settings.
 * These settings affect all algorithms globally.
 */

function SimulationPanel() {
  const simulation = useSimulation();
  const { state, actions } = useApp();
  
  // Calculate total points across all layers
  const totalPoints = Object.values(state.layers).reduce(
    (sum, layer) => sum + layer.length,
    0
  );
  
  // Handle speed change
  const handleSpeedChange = (value) => {
    simulation.setSetting({ animationSpeed: parseInt(value, 10) });
  };
  
  // Handle play/pause toggle
  const handlePlayPauseToggle = () => {
    simulation.setSetting({ isPlaying: !simulation.isPlaying });
  };
  
  // Handle step mode toggle
  const handleStepModeToggle = () => {
    simulation.setSetting({ stepMode: !simulation.stepMode });
  };
  
  // Clear all layers
  const handleClearAll = () => {
    if (!simulation.isAnimating) {
      actions.clearLayer('dda');
      actions.clearLayer('bresenham');
      actions.clearLayer('circle');
    }
  };
  
  return (
    <div className="simulation-panel">
      {/* Header */}
      <header className="simulation-panel-header">
        <h2 className="simulation-panel-title">Simulation Controls</h2>
        <p className="simulation-panel-description">
          Global settings that affect all drawing algorithms.
        </p>
      </header>
      
      {/* Animation Speed */}
      <section className="control-section">
        <h3 className="control-section-title">Animation Speed</h3>
        <div className="speed-control">
          <div className="speed-slider-container">
            <input
              type="range"
              min="1"
              max="100"
              value={101 - simulation.animationSpeed}
              onChange={(e) => handleSpeedChange(101 - parseInt(e.target.value, 10))}
              disabled={simulation.isAnimating}
              className="speed-slider"
            />
            <div className="speed-labels">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>
          <div className="speed-value">
            <span className="speed-value-number">{simulation.animationSpeed}</span>
            <span className="speed-value-unit">ms/pixel</span>
          </div>
        </div>
      </section>
      
      {/* Playback Controls */}
      <section className="control-section">
        <h3 className="control-section-title">Playback Mode</h3>
        <div className="toggle-controls">
          <button
            className={`toggle-btn ${simulation.isPlaying ? 'active' : ''}`}
            onClick={handlePlayPauseToggle}
            disabled={simulation.isAnimating}
          >
            <span className="toggle-icon">{simulation.isPlaying ? '▶️' : '⏸️'}</span>
            <span className="toggle-label">{simulation.isPlaying ? 'Auto Play' : 'Paused'}</span>
          </button>
          
          <button
            className={`toggle-btn ${simulation.stepMode ? 'active' : ''}`}
            onClick={handleStepModeToggle}
            disabled={simulation.isAnimating}
          >
            <span className="toggle-icon">⏭️</span>
            <span className="toggle-label">Step Mode</span>
          </button>
        </div>
      </section>
      
      {/* Layer Status */}
      <section className="control-section">
        <h3 className="control-section-title">Layer Status</h3>
        <div className="layer-status">
          <div className="layer-item layer-item--primary">
            <span className="layer-indicator" />
            <span className="layer-name">DDA Line</span>
            <span className="layer-count">{state.layers.dda.length} pts</span>
          </div>
          <div className="layer-item layer-item--green">
            <span className="layer-indicator" />
            <span className="layer-name">Bresenham Line</span>
            <span className="layer-count">{state.layers.bresenham.length} pts</span>
          </div>
          <div className="layer-item layer-item--purple">
            <span className="layer-indicator" />
            <span className="layer-name">Midpoint Circle</span>
            <span className="layer-count">{state.layers.circle.length} pts</span>
          </div>
        </div>
      </section>
      
      {/* Global Stats */}
      <section className="control-section stats-section">
        <div className="stat-card">
          <span className="stat-value">{totalPoints}</span>
          <span className="stat-label">Total Points</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{Object.values(state.layers).filter(l => l.length > 0).length}</span>
          <span className="stat-label">Active Layers</span>
        </div>
      </section>
      
      {/* Clear All */}
      <section className="control-section">
        <button
          className="btn-clear-all"
          onClick={handleClearAll}
          disabled={simulation.isAnimating || totalPoints === 0}
        >
          🗑️ Clear All Layers
        </button>
      </section>
      
      {/* Help Info */}
      <section className="control-section help-section">
        <h3 className="control-section-title">Quick Tips</h3>
        <ul className="help-list">
          <li>Each algorithm draws on its own layer</li>
          <li>Clearing an algorithm only removes its layer</li>
          <li>Use step mode for detailed visualization</li>
          <li>Lower speed values = faster animation</li>
        </ul>
      </section>
    </div>
  );
}

export default SimulationPanel;
