import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import './Canvas.css';

/**
 * Canvas Component
 * 
 * A React component that wraps an HTML5 Canvas for pixel-based rendering.
 * Supports layered drawing where each algorithm has its own layer.
 * Uses forwardRef to expose drawing methods to parent components.
 * 
 * Features:
 * - Scaled pixel rendering for better visibility
 * - Grid overlay for reference
 * - Layered drawing (each algorithm on separate layer)
 * - Animated drawing with configurable delay
 * - Coordinate system with origin at center
 */

// Layer colors for each algorithm
const LAYER_COLORS = {
  dda: '#3b82f6',       // Blue
  bresenham: '#22c55e', // Green
  circle: '#a855f7',    // Purple
  polygon: '#f59e0b',   // Amber
};

const Canvas = forwardRef(({ 
  width = 600, 
  height = 600, 
  pixelScale = 10,
  showGrid = true,
  layers = { dda: [], bresenham: [], circle: [], polygon: [] },
  onCanvasClick,
}, ref) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Calculate logical dimensions (the coordinate space for algorithms)
  const logicalWidth = Math.floor(width / pixelScale);
  const logicalHeight = Math.floor(height / pixelScale);
  
  /**
   * Draw the grid and axes on the canvas
   */
  const drawGrid = (ctx) => {
    if (!showGrid) return;
    
    // Minor grid lines - very subtle
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let x = 0; x <= width; x += pixelScale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += pixelScale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw axes through center - more prominent
    const centerX = Math.floor(logicalWidth / 2) * pixelScale;
    const centerY = Math.floor(logicalHeight / 2) * pixelScale;
    
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Draw small tick marks at intervals of 10 pixels
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    const tickSize = 4;
    
    for (let i = -Math.floor(logicalWidth / 2); i <= Math.floor(logicalWidth / 2); i += 10) {
      if (i === 0) continue;
      const x = centerX + i * pixelScale;
      ctx.beginPath();
      ctx.moveTo(x, centerY - tickSize);
      ctx.lineTo(x, centerY + tickSize);
      ctx.stroke();
    }
    
    for (let i = -Math.floor(logicalHeight / 2); i <= Math.floor(logicalHeight / 2); i += 10) {
      if (i === 0) continue;
      const y = centerY - i * pixelScale;
      ctx.beginPath();
      ctx.moveTo(centerX - tickSize, y);
      ctx.lineTo(centerX + tickSize, y);
      ctx.stroke();
    }
  };
  
  /**
   * Plot a single pixel at logical coordinates (internal)
   */
  const plotPixelInternal = (ctx, x, y, color) => {
    const offsetX = Math.floor(logicalWidth / 2);
    const offsetY = Math.floor(logicalHeight / 2);
    
    const canvasX = (x + offsetX) * pixelScale;
    const canvasY = (offsetY - y) * pixelScale;
    
    if (canvasX < 0 || canvasX >= width || canvasY < 0 || canvasY >= height) {
      return;
    }
    
    ctx.fillStyle = color;
    ctx.fillRect(canvasX + 1, canvasY + 1, pixelScale - 2, pixelScale - 2);
  };
  
  /**
   * Redraw the entire canvas with all layers
   */
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear and fill with white background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx);
    
    // Draw all layers
    Object.entries(layers).forEach(([layerName, points]) => {
      const color = LAYER_COLORS[layerName] || '#000000';
      points.forEach(point => {
        plotPixelInternal(ctx, point.x, point.y, color);
      });
    });
  };
  
  /**
   * Plot a single pixel (exposed method)
   */
  const plotPixel = (x, y, color = '#000000') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    plotPixelInternal(ctx, x, y, color);
  };
  
  /**
   * Animate drawing of points with delay between each pixel
   * 
   * @param {Array<{x: number, y: number}>} points - Array of points to draw
   * @param {string} color - CSS color string
   * @param {number} delay - Delay in milliseconds between pixels
   * @returns {Promise} Resolves when animation is complete
   */
  const animatePoints = async (points, color = '#000000', delay = 20) => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      animationRef.current.cancelled = true;
    }
    
    const controller = { cancelled: false };
    animationRef.current = controller;
    
    for (let i = 0; i < points.length; i++) {
      if (controller.cancelled) break;
      
      const point = points[i];
      plotPixel(point.x, point.y, color);
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    animationRef.current = null;
  };
  
  /**
   * Draw all points immediately without animation
   * 
   * @param {Array<{x: number, y: number}>} points - Array of points to draw
   * @param {string} color - CSS color string
   */
  const drawPoints = (points, color = '#000000') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    points.forEach(point => {
      plotPixelInternal(ctx, point.x, point.y, color);
    });
  };
  
  /**
   * Clear and redraw canvas with current layers
   */
  const clear = () => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      animationRef.current.cancelled = true;
      animationRef.current = null;
    }
    
    redrawCanvas();
  };

  /**
   * Convert mouse click position to logical coordinates and emit callback
   */
  const handleCanvasClick = (event) => {
    if (typeof onCanvasClick !== 'function') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const offsetX = Math.floor(logicalWidth / 2);
    const offsetY = Math.floor(logicalHeight / 2);

    const gridX = Math.floor(mouseX / pixelScale);
    const gridY = Math.floor(mouseY / pixelScale);

    const x = gridX - offsetX;
    const y = offsetY - gridY;

    onCanvasClick({ x, y });
  };
  
  // Redraw canvas when layers change
  useEffect(() => {
    redrawCanvas();
  }, [layers, width, height, pixelScale, showGrid]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancelled = true;
      }
    };
  }, []);
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    plotPixel,
    animatePoints,
    drawPoints,
    clear,
    redraw: redrawCanvas,
    getLogicalDimensions: () => ({ width: logicalWidth, height: logicalHeight })
  }));
  
  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="drawing-canvas"
        onClick={handleCanvasClick}
      />
      <div className="canvas-info">
        <span>Grid: {logicalWidth} × {logicalHeight}</span>
        <span>Origin: (0, 0)</span>
        <span>Scale: {pixelScale}x</span>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
