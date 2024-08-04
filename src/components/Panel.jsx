import React, { useState, useContext } from 'react';
import Vitals from './Vitals';
import Data from './Data';
import LineChart from './LineChart';
import { ChartSelectionContext, VitalSelectionContext, DataSelectionContext } from '../contexts/AppContext';

export default function Panel() {
    const { chartSelection } = useContext(ChartSelectionContext);
    const { vitalSelection } = useContext(VitalSelectionContext);
    const { dataSelection } = useContext(DataSelectionContext);

    return (
        <>
            <div className={`fixed bottom-0 left-0 right-0 z-10 w-full p-4 overflow-y-auto transition-transform bg-white transform-none ${chartSelection ? 'visible' : 'hidden'}`}>
                <LineChart />
            </div>
            <div className={`fixed bottom-0 left-0 right-0 z-10 w-full p-4 overflow-y-auto transition-transform bg-white transform-none ${vitalSelection ? 'visible' : 'hidden'}`}>
                <Vitals />
            </div>
            <div className={`fixed bottom-0 left-0 right-0 z-10 w-full p-4 overflow-y-auto transition-transform bg-white transform-none ${dataSelection[0] ? 'visible' : 'hidden'}`}>
                <Data />
            </div>
        </>

    );
}