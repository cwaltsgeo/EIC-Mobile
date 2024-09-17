import { useState } from 'react';
import Map from './components/Map';
import Panel from './components/Panel';
import EICLogo from './components/Logo';
import {
    VitalsDataContext,
    MapViewContext,
    ChartDataContext,
    DataSelectionContext
} from './contexts/AppContext';
import { VideoProvider } from './contexts/VideoContext';
import config from './config.json';

export default function App() {
    const defaultDataset = config.datasets[0];
    const defaultVariable = defaultDataset.variables[0];
    const [dataSelection, setDataSelection] = useState([
        defaultDataset,
        defaultVariable
    ]);
    const [mapView, setMapView] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [vitalsData, setVitalsData] = useState({
        globalAverage: 'N/A',
        globalMax: 'N/A'
    });

    return (
        <VideoProvider>
            <MapViewContext.Provider value={{ mapView, setMapView }}>
                <DataSelectionContext.Provider
                    value={{ dataSelection, setDataSelection }}
                >
                    <VitalsDataContext.Provider
                        value={{ vitalsData, setVitalsData }}
                    >
                        <ChartDataContext.Provider
                            value={{ chartData, setChartData }}
                        >
                            <EICLogo />
                            <Panel />
                            <Map />
                        </ChartDataContext.Provider>
                    </VitalsDataContext.Provider>
                </DataSelectionContext.Provider>
            </MapViewContext.Provider>
        </VideoProvider>
    );
}
