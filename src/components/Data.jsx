import { useContext } from 'react';
import { DataSelectionContext, CurrentJSONContext } from '../contexts/AppContext';

export default function Data() {
    const { currentJSON } = useContext(CurrentJSONContext);
    const { dataSelection } = useContext(DataSelectionContext);

    if (!currentJSON) {
        return <div>Loading...</div>;
    }

    return (
        <div class="flex flex-col gap-4">
            <h2 class="font-bold text-[20px] leading-[27.32px] text-left sm:text-[16px] sm:leading-[21.86px]">
              {currentJSON.name || 'No name'}
            </h2>
            <h4 class="font-manrope font-normal text-[12px] leading-[18px] hidden sm:block">
              {currentJSON.description || 'No description'}
            </h4>
            <p class="font-manrope font-normal text-[12px] leading-[18px] hidden sm:block">
              {currentJSON.tour[dataSelection[1]].text || 'No text'}
            </p>
        </div>
    );
}
