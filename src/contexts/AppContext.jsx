import React from 'react';

export const MapViewContext = React.createContext({
  mapView: null,
  setMapView: () => {},
});

export const DataSelectionContext = React.createContext({
  dataSelection: null,
  setDataSelection: () => {},
});

export const CurrentJSONContext = React.createContext({
  currentJSON: null,
  setCurrentJSON: () => {},
});

export const ChartDataContext = React.createContext({
  chartData: null,
  setChartData: () => {},
});

export const VitalsDataContext = React.createContext({
  vitalsData: { globalAverage: 'N/A', globalMax: 'N/A' },
  setVitalsData: () => {},
});