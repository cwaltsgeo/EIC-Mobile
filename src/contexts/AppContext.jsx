import React from 'react';

// Create the context with default values
export const MapViewContext = React.createContext({
  mapView: null,
  setMapView: () => {},
});

// Create the context with default values
export const VitalSelectionContext = React.createContext({
  vitalSelection: null,
  setVitalSelection: () => {},
});

// Create the context with default values
export const ChartSelectionContext = React.createContext({
  chartSelection: null,
  setChartSelection: () => {},
});

// Create the context with default values
export const DataSelectionContext = React.createContext({
  dataSelection: null,
  setDataSelection: () => {},
});

// Create the context with default values
export const CurrentJSONContext = React.createContext({
  currentJSON: null,
  setCurrentJSON: () => {},
});