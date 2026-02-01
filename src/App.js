import React, { useRef, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import AlgorithmPanel from './components/AlgorithmPanel';
import SimulationPanel from './components/SimulationPanel';
import Canvas from './components/Canvas';
import { ddaLine, bresenhamLine, midpointCircle } from './algorithms';
import './App.css';

/**
 * Computer Graphics Algorithms Simulator
 * 
 * A production-grade React application demonstrating classic computer graphics
 * algorithms with sidebar navigation, layered canvas, and centralized state.
 * 
 * Architecture:
 * - AppContext: Centralized state management
 * - Sidebar: Fixed vertical navigation
 * - AlgorithmPanel: Algorithm-specific inputs and controls
 * - SimulationPanel: Global simulation settings
 * - Canvas: Layered rendering with per-algorithm layers
 */

// Layer colors matching the Canvas component
const LAYER_COLORS = {
  dda: '#3b82f6',
  bresenham: '#22c55e',
  circle: '#a855f7',
};

/**
 * Main Application Content
 * Separated to access context within provider
 */
function AppContent() {
  const { state, actions } = useApp();
  const canvasRef = useRef(null);
  
  /**
   * Handle draw action for any algorithm
   * Generates points and animates drawing
   */
  const handleDraw = useCallback(async (algorithm, params) => {
    if (!canvasRef.current || state.isAnimating) return;
    
    let points = [];
    let paramsString = '';
    
    // Generate points based on algorithm
    switch (algorithm) {
      case 'dda':
        points = ddaLine(params.x1, params.y1, params.x2, params.y2);
        paramsString = `(${params.x1},${params.y1}) → (${params.x2},${params.y2})`;
        break;
      case 'bresenham':
        points = bresenhamLine(params.x1, params.y1, params.x2, params.y2);
        paramsString = `(${params.x1},${params.y1}) → (${params.x2},${params.y2})`;
        break;
      case 'circle':
        points = midpointCircle(params.cx, params.cy, params.r);
        paramsString = `center(${params.cx},${params.cy}) r=${params.r}`;
        break;
      default:
        return;
    }
    
    // Set animating state
    actions.setAnimating(true, algorithm);
    
    // Get color for this algorithm
    const color = LAYER_COLORS[algorithm];
    
    // Animate drawing
    await canvasRef.current.animatePoints(points, color, state.simulation.animationSpeed);
    
    // Update layer with new points (append to existing)
    const existingPoints = state.layers[algorithm];
    actions.setLayerPoints(algorithm, [...existingPoints, ...points]);
    
    // Add to history
    actions.addHistoryEntry(algorithm, {
      id: Date.now(),
      params: paramsString,
      pointCount: points.length,
    });
    
    // Clear animating state
    actions.setAnimating(false);
  }, [state.isAnimating, state.simulation.animationSpeed, state.layers, actions]);
  
  /**
   * Render the active view based on navigation
   */
  const renderActiveView = () => {
    switch (state.activeView) {
      case 'dda':
        return <AlgorithmPanel algorithm="dda" onDraw={handleDraw} />;
      case 'bresenham':
        return <AlgorithmPanel algorithm="bresenham" onDraw={handleDraw} />;
      case 'circle':
        return <AlgorithmPanel algorithm="circle" onDraw={handleDraw} />;
      case 'simulation':
        return <SimulationPanel />;
      default:
        return null;
    }
  };
  
  return (
    <div className="app">
      <Sidebar />
      
      <div className="app-layout">
        <header className="app-header">
          <div className="header-title">
            <h1>Computer Graphics Simulator</h1>
            <span className="header-subtitle">Algorithm Visualization Tool</span>
          </div>
          <div className="header-status">
            {state.isAnimating && (
              <span className="status-badge animating">
                <span className="status-dot"></span>
                Animating
              </span>
            )}
          </div>
        </header>

        <main className="app-main">
          <div className="canvas-section">
            <div className="canvas-header">
              <h2>Canvas</h2>
              <div className="canvas-info">
                <span className="info-item">60×60 grid</span>
                <span className="info-item">10px scale</span>
              </div>
            </div>
            <Canvas
              ref={canvasRef}
              width={600}
              height={600}
              pixelScale={10}
              showGrid={true}
              layers={state.layers}
            />
          </div>
          
          <aside className="control-section">
            <div className="control-header">
              <h2>{state.activeView === 'simulation' ? 'Simulation Settings' : `${state.activeView.toUpperCase()} Algorithm`}</h2>
            </div>
            {renderActiveView()}
          </aside>
        </main>
      </div>
    </div>
  );
}

/**
 * App Root Component
 * Wraps the application with the state provider
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
