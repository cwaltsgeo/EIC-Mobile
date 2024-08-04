import React, { useContext } from 'react';
import { DataSelectionContext, CurrentJSONContext } from '../contexts/AppContext';

export default function Data() {

    const { currentJSON } = useContext(CurrentJSONContext);
    const { dataSelection } = useContext(DataSelectionContext);

    console.log("Data", dataSelection[1]);
    if (!currentJSON) {
        return <div>Loading...</div>;
    }

    return (
        <section className="h-full w-full overflow-auto flex items-center justify-center">
            <div className="p-4">
                <h1 className="text-4xl font-bold mb-2">{currentJSON.name || 'No name'}</h1>
                <h2 className="text-sm text-gray-600 mb-4">{currentJSON.description || 'No description'}</h2>
                <p className="text-base">{currentJSON.tour[dataSelection[1]].text || 'No text'}</p>
            </div>
        </section>
    );
}