import React, { useState } from 'react';
import Header from "./components/Header";
import Map from "./components/Map";
import Panel from "./components/Panel"
import products from './products.json';
import { MapViewContext, CurrentJSONContext, ChartSelectionContext, VitalSelectionContext, DataSelectionContext } from './contexts/AppContext';

export default function App() {
  const [mapView, setMapView] = useState(null); // replace 'null' with the initial value of your map variable
  const [currentJSON, setCurrentJSON] = useState(products[2]); // replace 'null' with the initial value of your map variable// replace 'null' with the initial value of your map variable
  const [chartSelection, setChartSelection] = useState(false); // replace 'null' with the initial value of your map variable
  const [vitalSelection, setVitalSelection] = useState(false); // replace 'null' with the initial value of your map variable
  const [dataSelection, setDataSelection] = useState([false, 0]); // replace 'null' with the initial value of your map variable
  console.log("dataSelection", dataSelection);
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