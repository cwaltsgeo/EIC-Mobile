import styled from 'styled-components';
import Vitals from './Vitals';
import Data from './Data';
import LineChart from './LineChart';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';
import { useContext, useState } from 'react';
import config from '../config.json';
import { DataSelectionContext, MapViewContext, CurrentJSONContext } from '../contexts/AppContext';

const StyledTabList = styled(TabList)`
  @media (max-width: 768px) {
    overflow-y: visible;
    overflow-x: auto;
    width: 100%;

    &::-webkit-scrollbar {
      display: none;
    }

    scrollbar-width: none;

    -ms-overflow-style: none;
  }
`;

export default function Panel() {
    const { mapView } = useContext(MapViewContext);
    const { setDataSelection } = useContext(DataSelectionContext);
    const { setCurrentJSON } = useContext(CurrentJSONContext);

    const [selectedIndex, setSelectedIndex] = useState(0);

    const changeLayer = (item, index) => {
        setDataSelection([false, 0]);

        mapView.map.layers.forEach(layer => {
          if (layer.title !== item.name && layer.title !== null && layer.title !== 'Geodesic-Buffer') {
            layer.visible = false;
          }
        });

        const layer = mapView.map.layers.find(layer => layer.title === item.name);

        if (layer) {
          layer.visible = !layer.visible;
          const currentProduct = config.find(product => product.name === layer.title);
          setCurrentJSON(currentProduct);
        }

        setSelectedIndex(index);
    };

    return (
        <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 h-[400px] w-full max-w-6xl bg-opacity-90 rounded-xl shadow-lg backdrop-blur-lg flex-col z-10 p-6'>
            <TabGroup defaultIndex={selectedIndex} onChange={setSelectedIndex}>
                <StyledTabList className="absolute left-1/2 transform -translate-x-1/2 -top-16 text-white p-2 flex space-x-4 overflow-x-auto whitespace-nowrap">
                    {config.map((dataset, index) => (
                        <Tab
                            key={dataset.name}
                            className={({ selected }) =>
                                `px-4 py-2 text-xs rounded-sm focus:outline-none ${
                                    selected ? 'bg-blue-600 text-white' : 'bg-black bg-opacity-90 text-white'
                                }`
                            }
                            onClick={() => changeLayer(dataset, index)}
                        >
                            {dataset.name}
                        </Tab>
                    ))}
                </StyledTabList>

                <TabPanels>
                    {config.map((dataset, index) => (
                        <TabPanel key={index}>
                            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 h-[400px] bg-black w-full max-w-6xl bg-opacity-70 rounded-xl shadow-lg backdrop-blur-lg flex z-10 p-6
                            flex-col md:flex-row">
                                {/* Data on the left */}
                                <div className="w-full md:w-1/2 pr-4 overflow-y-auto text-white">
                                    <Data />
                                </div>

                                {/* Vitals and Chart on the right */}
                                <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4 md:space-y-0">
                                    <div className="w-full overflow-y-auto text-white">
                                        <Vitals />
                                    </div>
                                    <div className="w-full overflow-y-auto">
                                        <LineChart />
                                    </div>
                                </div>
                            </div>
                        </TabPanel>
                    ))}
                </TabPanels>
            </TabGroup>
        </div>
    );
}
