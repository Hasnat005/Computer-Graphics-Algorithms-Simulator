import React from 'react';
import { useApp } from '../../context/AppContext';
import './Sidebar.css';

/**
 * Sidebar Navigation Component
 * 
 * Fixed vertical sidebar for enterprise-style navigation.
 * Contains algorithm selection and simulation controls access.
 */

const NAV_ITEMS = [
  { 
    id: 'dda', 
    group: 'core',
    label: 'DDA Line', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="20" x2="20" y2="4" />
        <circle cx="4" cy="20" r="2" fill="currentColor" />
        <circle cx="20" cy="4" r="2" fill="currentColor" />
      </svg>
    ),
    description: 'Digital Differential Analyzer'
  },
  { 
    id: 'bresenham', 
    group: 'core',
    label: 'Bresenham Line', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="3" y1="21" x2="21" y2="3" />
        <rect x="3" y="17" width="4" height="4" fill="currentColor" opacity="0.5" />
        <rect x="17" y="3" width="4" height="4" fill="currentColor" opacity="0.5" />
      </svg>
    ),
    description: 'Integer-only line drawing'
  },
  { 
    id: 'circle', 
    group: 'core',
    label: 'Midpoint Circle', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
    description: '8-way symmetry algorithm'
  },
  {
    id: 'polygon',
    group: 'core',
    label: 'Polygon Fill',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="5,18 12,5 19,18" />
        <circle cx="5" cy="18" r="1.5" fill="currentColor" />
        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
        <circle cx="19" cy="18" r="1.5" fill="currentColor" />
      </svg>
    ),
    description: 'Scan-line, flood fill, boundary fill'
  },
  {
    id: 'transformations',
    group: 'advanced',
    label: '2D Transformations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 8h8v8H4z" />
        <path d="M12 12l8-8" />
        <path d="M16 4h4v4" />
      </svg>
    ),
    description: 'Translation, scaling, rotation, shearing, reflection'
  },
  {
    id: 'clipping',
    group: 'advanced',
    label: 'Clipping',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="10" height="10" />
        <path d="M9 9l12 12" />
        <path d="M16 18h5v3" />
      </svg>
    ),
    description: 'Cohen-Sutherland and Sutherland-Hodgman clipping'
  },
  {
    id: 'hidden-surface',
    group: 'advanced',
    label: 'Hidden Surface',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l8 4v8l-8 4-8-4V6z" />
        <path d="M12 2v8l8 4" />
      </svg>
    ),
    description: 'Back-face culling, Z-buffer, Painter\'s algorithm'
  },
  { 
    id: 'simulation', 
    group: 'settings',
    label: 'Simulation', 
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
    description: 'Animation & playback controls'
  },
];

function Sidebar() {
  const { state, actions } = useApp();
  const { activeView, isAnimating, layers } = state;
  const coreItems = NAV_ITEMS.filter((item) => item.group === 'core');
  const advancedItems = NAV_ITEMS.filter((item) => item.group === 'advanced');
  const settingItems = NAV_ITEMS.filter((item) => item.group === 'settings');
  
  const handleNavClick = (itemId) => {
    if (isAnimating) return;
    actions.setActiveView(itemId);
  };
  
  // Calculate total points for status indicator
  const getTotalPoints = (layerId) => {
    if (layerId === 'simulation') return null;
    return layers[layerId]?.length || 0;
  };
  
  return (
    <aside className="sidebar">
      {/* Brand / Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-title">CG Simulator</span>
          <span className="sidebar-subtitle">Graphics Algorithms</span>
        </div>
      </div>
      
      {/* Navigation Items */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Core</div>
        {coreItems.map((item) => {
          const pointCount = getTotalPoints(item.id);
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              disabled={isAnimating}
              title={item.description}
            >
              <span className="sidebar-nav-indicator" />
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-content">
                <span className="sidebar-nav-label-text">{item.label}</span>
                {pointCount > 0 && (
                  <span className="sidebar-nav-badge">{pointCount} pts</span>
                )}
              </span>
            </button>
          );
        })}

        <div className="sidebar-nav-label">Advanced</div>
        {advancedItems.map((item) => {
          const pointCount = getTotalPoints(item.id);
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              disabled={isAnimating}
              title={item.description}
            >
              <span className="sidebar-nav-indicator" />
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-content">
                <span className="sidebar-nav-label-text">{item.label}</span>
                {pointCount > 0 && (
                  <span className="sidebar-nav-badge">{pointCount} pts</span>
                )}
              </span>
            </button>
          );
        })}
        
        <div className="sidebar-nav-divider" />
        
        <div className="sidebar-nav-label">Settings</div>
        {settingItems.map((item) => {
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              disabled={isAnimating}
              title={item.description}
            >
              <span className="sidebar-nav-indicator" />
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-content">
                <span className="sidebar-nav-label-text">{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>
      
      {/* Status Footer */}
      <div className="sidebar-footer">
        {isAnimating ? (
          <div className="sidebar-status sidebar-status--active">
            <span className="status-indicator" />
            <span>Drawing...</span>
          </div>
        ) : (
          <div className="sidebar-status">
            <span className="status-indicator status-indicator--idle" />
            <span>Ready</span>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
