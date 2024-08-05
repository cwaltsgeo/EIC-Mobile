import React, { useState } from 'react';
import config from './config.json';
import Header from './components/Header';
import Map from './components/Map';
import Panel from './components/Panel'
import { MapViewContext, CurrentJSONContext, ChartSelectionContext, VitalSelectionContext, DataSelectionContext } from './contexts/AppContext';

export default function App() {
  const [mapView, setMapView] = useState(null); 
  const [currentJSON, setCurrentJSON] = useState(config[2]);
  const [chartSelection, setChartSelection] = useState(false); 
  const [vitalSelection, setVitalSelection] = useState(false); 
  const [dataSelection, setDataSelection] = useState([false, 0]);

  return (
    <MapViewContext.Provider value={{ mapView, setMapView }}>
      <CurrentJSONContext.Provider value={{ currentJSON, setCurrentJSON }}>
        <DataSelectionContext.Provider value={{ dataSelection, setDataSelection }}>
          <VitalSelectionContext.Provider value={{ vitalSelection, setVitalSelection }}>
            <ChartSelectionContext.Provider value={{ chartSelection, setChartSelection }}>
              <div>
                <Header />
                <Panel />
                <Map />
              </div>
            </ChartSelectionContext.Provider>
          </VitalSelectionContext.Provider>
        </DataSelectionContext.Provider>
      </CurrentJSONContext.Provider>
    </MapViewContext.Provider>
  );
}