import styled from 'styled-components';
import Vitals from './Vitals';
import Data from './Data';
import LineChart from './LineChart';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';
import { useContext, useState, useEffect } from 'react';
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
            if (layer.title !== item.name && layer.title !== 'Geodesic-Buffer' && layer.title !== 'Geodesic-Point') {
                layer.visible = false;
            } else if (layer.title === item.name) {
                layer.visible = true;
            }
        });

        const layer = mapView.map.layers.find(layer => layer.title === item.name);

        if (layer) {
            layer.visible = true;

            const currentProduct = config.find(product => product.name === layer.title);
            setCurrentJSON(currentProduct);
        }

        setSelectedIndex(index);
    };

    useEffect(() => {
        if (mapView) {
            const initialLayer = config[0];
            changeLayer(initialLayer, 0);
        }
    }, [mapView]);

    return (
        <div className='fixed bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg backdrop-blur-lg z-10 flex
                        w-full gap-[20px] lg:w-[762px] lg:left-1/2 lg:-translate-x-1/2 lg:gap-[60px]'>
            <TabGroup style={{ width: '100%', height: '100%'}} defaultIndex={selectedIndex} onChange={setSelectedIndex}>
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

                <TabPanels style={{ height: '100%'}}>
                    {config.map((dataset, index) => (
                        <TabPanel style={{ height: '100%'}} key={index}>
                            <div className="flex flex-col justify-between md:flex-row w-full h-full rounded-t-xl bg-black bg-opacity-70 shadow-lg backdrop-blur-lg p-6 gap-[20px] lg:gap-[60px]">
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
