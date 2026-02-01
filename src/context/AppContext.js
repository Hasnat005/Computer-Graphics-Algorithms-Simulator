import React, { createContext, useContext, useReducer, useCallback } from 'react';

/**
 * Application State Management
 * 
 * Centralized state management following a Redux-like pattern.
 * Manages navigation, algorithm parameters, layers, and simulation controls.
 */

// Initial state structure
const initialState = {
  // Navigation
  activeView: 'dda', // 'dda' | 'bresenham' | 'circle' | 'simulation'
  
  // Simulation controls (global)
  simulation: {
    animationSpeed: 20,
    isPlaying: true,
    stepMode: false,
  },
  
  // Algorithm-specific parameters
  algorithms: {
    dda: {
      x1: -20,
      y1: -15,
      x2: 20,
      y2: 15,
    },
    bresenham: {
      x1: -15,
      y1: 10,
      x2: 15,
      y2: -10,
    },
    circle: {
      cx: 0,
      cy: 0,
      r: 15,
    },
  },
  
  // Drawing layers - each algorithm has its own layer
  layers: {
    dda: [],      // Array of {x, y} points
    bresenham: [],
    circle: [],
  },
  
  // Animation state
  isAnimating: false,
  currentAnimation: null, // Which algorithm is currently animating
  
  // Drawing history per algorithm
  history: {
    dda: [],
    bresenham: [],
    circle: [],
  },
};

// Action types
const ActionTypes = {
  SET_ACTIVE_VIEW: 'SET_ACTIVE_VIEW',
  SET_ALGORITHM_PARAMS: 'SET_ALGORITHM_PARAMS',
  SET_SIMULATION_SETTING: 'SET_SIMULATION_SETTING',
  SET_LAYER_POINTS: 'SET_LAYER_POINTS',
  CLEAR_LAYER: 'CLEAR_LAYER',
  SET_ANIMATING: 'SET_ANIMATING',
  ADD_HISTORY_ENTRY: 'ADD_HISTORY_ENTRY',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_ACTIVE_VIEW:
      return {
        ...state,
        activeView: action.payload,
      };
      
    case ActionTypes.SET_ALGORITHM_PARAMS:
      return {
        ...state,
        algorithms: {
          ...state.algorithms,
          [action.payload.algorithm]: {
            ...state.algorithms[action.payload.algorithm],
            ...action.payload.params,
          },
        },
      };
      
    case ActionTypes.SET_SIMULATION_SETTING:
      return {
        ...state,
        simulation: {
          ...state.simulation,
          ...action.payload,
        },
      };
      
    case ActionTypes.SET_LAYER_POINTS:
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.payload.layer]: action.payload.points,
        },
      };
      
    case ActionTypes.CLEAR_LAYER:
      return {
        ...state,
        layers: {
          ...state.layers,
          [action.payload]: [],
        },
      };
      
    case ActionTypes.SET_ANIMATING:
      return {
        ...state,
        isAnimating: action.payload.isAnimating,
        currentAnimation: action.payload.algorithm || null,
      };
      
    case ActionTypes.ADD_HISTORY_ENTRY:
      return {
        ...state,
        history: {
          ...state.history,
          [action.payload.algorithm]: [
            ...state.history[action.payload.algorithm],
            action.payload.entry,
          ].slice(-5), // Keep last 5 entries per algorithm
        },
      };
      
    case ActionTypes.CLEAR_HISTORY:
      return {
        ...state,
        history: {
          ...state.history,
          [action.payload]: [],
        },
      };
      
    default:
      return state;
  }
}

// Create context
const AppContext = createContext(null);

/**
 * App Provider Component
 * Wraps the application and provides state management
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Action creators
  const actions = {
    setActiveView: useCallback((view) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_VIEW, payload: view });
    }, []),
    
    setAlgorithmParams: useCallback((algorithm, params) => {
      dispatch({
        type: ActionTypes.SET_ALGORITHM_PARAMS,
        payload: { algorithm, params },
      });
    }, []),
    
    setSimulationSetting: useCallback((settings) => {
      dispatch({ type: ActionTypes.SET_SIMULATION_SETTING, payload: settings });
    }, []),
    
    setLayerPoints: useCallback((layer, points) => {
      dispatch({
        type: ActionTypes.SET_LAYER_POINTS,
        payload: { layer, points },
      });
    }, []),
    
    clearLayer: useCallback((layer) => {
      dispatch({ type: ActionTypes.CLEAR_LAYER, payload: layer });
      dispatch({ type: ActionTypes.CLEAR_HISTORY, payload: layer });
    }, []),
    
    setAnimating: useCallback((isAnimating, algorithm = null) => {
      dispatch({
        type: ActionTypes.SET_ANIMATING,
        payload: { isAnimating, algorithm },
      });
    }, []),
    
    addHistoryEntry: useCallback((algorithm, entry) => {
      dispatch({
        type: ActionTypes.ADD_HISTORY_ENTRY,
        payload: { algorithm, entry },
      });
    }, []),
  };
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook for accessing app state and actions
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

/**
 * Custom hook for accessing specific algorithm state
 */
export function useAlgorithm(algorithm) {
  const { state, actions } = useApp();
  
  return {
    params: state.algorithms[algorithm],
    layer: state.layers[algorithm],
    history: state.history[algorithm],
    isAnimating: state.isAnimating && state.currentAnimation === algorithm,
    setParams: (params) => actions.setAlgorithmParams(algorithm, params),
    setLayer: (points) => actions.setLayerPoints(algorithm, points),
    clear: () => actions.clearLayer(algorithm),
  };
}

/**
 * Custom hook for simulation controls
 */
export function useSimulation() {
  const { state, actions } = useApp();
  
  return {
    ...state.simulation,
    isAnimating: state.isAnimating,
    setSetting: actions.setSimulationSetting,
  };
}
