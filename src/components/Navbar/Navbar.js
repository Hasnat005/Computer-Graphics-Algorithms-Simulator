import React from 'react';
import { useApp } from '../../context/AppContext';
import './Navbar.css';

/**
 * Navigation Bar Component
 * 
 * Top-level navigation with 4 primary views:
 * - DDA Line Algorithm
 * - Bresenham Line Algorithm  
 * - Midpoint Circle Algorithm
 * - Simulation Controls
 */

const NAV_ITEMS = [
  { id: 'dda', label: 'DDA Line', icon: '📐' },
  { id: 'bresenham', label: 'Bresenham Line', icon: '📏' },
  { id: 'circle', label: 'Midpoint Circle', icon: '⭕' },
  { id: 'simulation', label: 'Simulation Controls', icon: '⚙️' },
];

function Navbar() {
  const { state, actions } = useApp();
  const { activeView, isAnimating } = state;
  
  const handleNavClick = (viewId) => {
    // Prevent navigation during animation for smoother UX
    if (isAnimating) return;
    actions.setActiveView(viewId);
  };
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🎨</span>
        <span className="navbar-title">CG Simulator</span>
      </div>
      
      <div className="navbar-tabs">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`navbar-tab ${activeView === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item.id)}
            disabled={isAnimating}
            aria-current={activeView === item.id ? 'page' : undefined}
          >
            <span className="navbar-tab-icon">{item.icon}</span>
            <span className="navbar-tab-label">{item.label}</span>
            {activeView === item.id && <span className="navbar-tab-indicator" />}
          </button>
        ))}
      </div>
      
      <div className="navbar-status">
        {isAnimating && (
          <div className="navbar-status-badge animating">
            <span className="status-dot" />
            <span>Drawing...</span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
