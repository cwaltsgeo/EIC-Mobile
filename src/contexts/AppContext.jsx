import React from 'react';

export const MapViewContext = React.createContext({
  mapView: null,
  setMapView: () => {},
});

export const VitalSelectionContext = React.createContext({
  vitalSelection: null,
  setVitalSelection: () => {},
});

export const ChartSelectionContext = React.createContext({
  chartSelection: null,
  setChartSelection: () => {},
});

export const DataSelectionContext = React.createContext({
  dataSelection: null,
  setDataSelection: () => {},
});

export const CurrentJSONContext = React.createContext({
  currentJSON: null,
  setCurrentJSON: () => {},
});