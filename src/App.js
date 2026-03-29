import React, { useRef, useCallback } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import AlgorithmPanel from './components/AlgorithmPanel';
import SimulationPanel from './components/SimulationPanel';
import PolygonInputPanel from './components/PolygonInputPanel';
import TransformationsPanel from './components/TransformationsPanel';
import ClippingPanel from './components/ClippingPanel';
import HiddenSurfacePanel from './components/HiddenSurfacePanel';
import Canvas from './components/Canvas';
import { ddaLine, bresenhamLine, midpointCircle, scanLineFill, floodFill, boundaryFill } from './algorithms';
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
  polygon: '#f59e0b',
  transformations: '#0ea5e9',
  clipping: '#10b981',
  'hidden-surface': '#8b5cf6',
};

const uniquePoints = (points) => {
  const seen = new Set();
  const result = [];

  for (const point of points) {
    const key = `${point.x},${point.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(point);
    }
  }

  return result;
};

const buildPolygonBoundary = (vertices, isClosed) => {
  if (!Array.isArray(vertices) || vertices.length === 0) {
    return [];
  }

  if (vertices.length === 1) {
    return [{ x: vertices[0].x, y: vertices[0].y }];
  }

  const segments = [];
  for (let i = 0; i < vertices.length - 1; i++) {
    const start = vertices[i];
    const end = vertices[i + 1];
    segments.push(...bresenhamLine(start.x, start.y, end.x, end.y));
  }

  if (isClosed && vertices.length > 2) {
    const last = vertices[vertices.length - 1];
    const first = vertices[0];
    segments.push(...bresenhamLine(last.x, last.y, first.x, first.y));
  }

  return uniquePoints(segments);
};

const getPolygonSeed = (vertices) => {
  if (!vertices.length) return { x: 0, y: 0 };

  const sum = vertices.reduce(
    (accumulator, vertex) => ({
      x: accumulator.x + vertex.x,
      y: accumulator.y + vertex.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: Math.round(sum.x / vertices.length),
    y: Math.round(sum.y / vertices.length),
  };
};

/**
 * Main Application Content
 * Separated to access context within provider
 */
function AppContent() {
  const { state, actions } = useApp();
  const canvasRef = useRef(null);

  const updatePolygonLayer = useCallback((vertices, isClosed) => {
    const boundaryPoints = buildPolygonBoundary(vertices, isClosed);
    actions.setLayerPoints('polygon', boundaryPoints);
  }, [actions]);

  const handleCanvasClick = useCallback((point) => {
    if (state.activeView !== 'polygon' || state.isAnimating || state.polygon.isClosed) {
      return;
    }

    const nextVertex = { x: point.x, y: point.y };
    const nextVertices = [...state.polygon.vertices, nextVertex];

    actions.addPolygonVertex(nextVertex);
    updatePolygonLayer(nextVertices, false);
  }, [state.activeView, state.isAnimating, state.polygon, actions, updatePolygonLayer]);

  const handleClosePolygon = useCallback(() => {
    if (state.isAnimating || state.polygon.isClosed || state.polygon.vertices.length < 3) {
      return;
    }

    actions.closePolygon();
    updatePolygonLayer(state.polygon.vertices, true);
  }, [state.isAnimating, state.polygon, actions, updatePolygonLayer]);

  const handleClearPolygon = useCallback(() => {
    if (state.isAnimating) return;
    actions.clearPolygon();
  }, [state.isAnimating, actions]);

  const runPolygonAnimation = useCallback(async (algorithmName, points) => {
    if (!canvasRef.current || !points.length) return;

    actions.setAnimating(true, 'polygon');
    await canvasRef.current.animatePoints(points, LAYER_COLORS.polygon, state.simulation.animationSpeed);
    actions.setAnimating(false);

    actions.addHistoryEntry('polygon', {
      id: Date.now(),
      params: algorithmName,
      pointCount: points.length,
    });
  }, [actions, state.simulation.animationSpeed]);

  const handleRunScanLine = useCallback(async () => {
    if (state.isAnimating || !state.polygon.isClosed || state.polygon.vertices.length < 3) {
      return;
    }

    const boundaryPoints = buildPolygonBoundary(state.polygon.vertices, true);
    const fillPoints = scanLineFill(state.polygon.vertices);
    const nextLayerPoints = uniquePoints([...boundaryPoints, ...fillPoints]);

    actions.setLayerPoints('polygon', nextLayerPoints);
    await runPolygonAnimation('Scan-Line Fill', fillPoints);
  }, [state.isAnimating, state.polygon, actions, runPolygonAnimation]);

  const handleRunFloodFill = useCallback(async () => {
    if (state.isAnimating || !state.polygon.isClosed || state.polygon.vertices.length < 3) {
      return;
    }

    const boundaryPoints = buildPolygonBoundary(state.polygon.vertices, true);
    const boundarySet = new Set(boundaryPoints.map((point) => `${point.x},${point.y}`));
    const filledSet = new Set();
    const seed = getPolygonSeed(state.polygon.vertices);

    const changes = await floodFill(seed, 'empty', 'filled', {
      connectivity: 4,
      speed: state.simulation.animationSpeed,
      getPixelColor: (x, y) => {
        const key = `${x},${y}`;
        if (boundarySet.has(key)) return 'boundary';
        if (filledSet.has(key)) return 'filled';
        return 'empty';
      },
      setPixelColor: (x, y, color) => {
        if (color === 'filled') {
          filledSet.add(`${x},${y}`);
        }
      },
    });

    const fillPoints = changes.map((change) => ({ x: change.x, y: change.y }));
    const nextLayerPoints = uniquePoints([...boundaryPoints, ...fillPoints]);
    actions.setLayerPoints('polygon', nextLayerPoints);

    await runPolygonAnimation('Flood Fill', fillPoints);
  }, [state.isAnimating, state.polygon, state.simulation.animationSpeed, actions, runPolygonAnimation]);

  const handleRunBoundaryFill = useCallback(async () => {
    if (state.isAnimating || !state.polygon.isClosed || state.polygon.vertices.length < 3) {
      return;
    }

    const boundaryPoints = buildPolygonBoundary(state.polygon.vertices, true);
    const boundarySet = new Set(boundaryPoints.map((point) => `${point.x},${point.y}`));
    const filledSet = new Set();
    const seed = getPolygonSeed(state.polygon.vertices);

    const changes = boundaryFill(seed, 'boundary', 'filled', {
      connectivity: 4,
      getPixelColor: (x, y) => {
        const key = `${x},${y}`;
        if (boundarySet.has(key)) return 'boundary';
        if (filledSet.has(key)) return 'filled';
        return 'empty';
      },
      setPixelColor: (x, y, color) => {
        if (color === 'filled') {
          filledSet.add(`${x},${y}`);
        }
      },
    });

    const fillPoints = changes.map((change) => ({ x: change.x, y: change.y }));
    const nextLayerPoints = uniquePoints([...boundaryPoints, ...fillPoints]);
    actions.setLayerPoints('polygon', nextLayerPoints);

    await runPolygonAnimation('Boundary Fill', fillPoints);
  }, [state.isAnimating, state.polygon, actions, runPolygonAnimation]);

  const handleAnimateLayer = useCallback(async (layerName, points, paramsString) => {
    if (!canvasRef.current || state.isAnimating || !Array.isArray(points)) return;

    const normalizedPoints = points.map((point) => ({
      x: Math.round(point.x),
      y: Math.round(point.y),
    }));

    const color = LAYER_COLORS[layerName] || '#ffffff';

    actions.setLayerPoints(layerName, []);
    actions.setAnimating(true, layerName);

    try {
      await canvasRef.current.animatePoints(normalizedPoints, color, state.simulation.animationSpeed);
      actions.setLayerPoints(layerName, normalizedPoints);
      actions.addHistoryEntry(layerName, {
        id: Date.now(),
        params: paramsString,
        pointCount: normalizedPoints.length,
      });
    } finally {
      actions.setAnimating(false);
    }
  }, [state.isAnimating, state.simulation.animationSpeed, actions]);
  
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
      case 'polygon':
        return (
          <PolygonInputPanel
            onClosePolygon={handleClosePolygon}
            onClearPolygon={handleClearPolygon}
            onRunScanLine={handleRunScanLine}
            onFloodFill={handleRunFloodFill}
            onBoundaryFill={handleRunBoundaryFill}
          />
        );
      case 'transformations':
        return <TransformationsPanel onAnimateLayer={handleAnimateLayer} />;
      case 'clipping':
        return <ClippingPanel onAnimateLayer={handleAnimateLayer} />;
      case 'hidden-surface':
        return <HiddenSurfacePanel onAnimateLayer={handleAnimateLayer} />;
      case 'simulation':
        return <SimulationPanel />;
      default:
        return null;
    }
  };

  const viewTitles = {
    dda: 'DDA Algorithm',
    bresenham: 'Bresenham Algorithm',
    circle: 'Circle Algorithm',
    polygon: 'Polygon Fill Algorithms',
    transformations: '2D Transformations',
    clipping: 'Clipping Algorithms',
    'hidden-surface': 'Hidden Surface Detection',
    simulation: 'Simulation Settings',
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
              onCanvasClick={handleCanvasClick}
            />
          </div>
          
          <aside className="control-section">
            <div className="control-header">
              <h2>{viewTitles[state.activeView] || 'Algorithm'}</h2>
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
