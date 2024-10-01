import React, { useState } from 'react';
import Joyride from 'react-joyride';
import TourButton from './TourButton';
import TourTooltip from './TourTooltip';
import useLocalStorage from '../hooks/useLocalStorage';

export default function Tour() {
    const [tourComplete, setTourComplete] = useLocalStorage(
        'tourComplete',
        false
    );
    const [helpers, setHelpers] = useState({});
    const [run, setRun] = useState(!tourComplete);

    const steps = [
        {
            target: 'body',
            title: 'Welcome to the',
            name: 'Mobile Climate Mapper!',
            content:
                'The Mobile Climate Mapper is an extension of NASA’s Earth Information Center exhibit at the Smithsonian National Museum of Natural History. Use this tool to explore how climate change may affect temperatures at any location in the world.',
            placement: 'center',
            disableBeacon: true
        },
        {
            target: '.map',
            content:
                'Tap anywhere on the map to view how temperatures are projected to change at that location',
            placement: 'bottom',
            disableBeacon: true
        },
        {
            target: '.esri-expand__toggle',
            content: 'Or search by location',
            disableBeacon: true
        },
        {
            target: '.dataset-choice',
            content:
                'Select from four greenhouse gas (GHG) emissions scenarios and learn how each impacts our future climate',
            placement: 'top',
            disableBeacon: true
        },
        {
            target: '.chart',
            content:
                'View past and projected temperature changes from 1950-2100 based on the selected emissions scenario',
            disableBeacon: true
        }
    ];

    const handleJoyrideCallback = (data) => {
        if (
            data.status === 'finished' ||
            data.status === 'skipped' ||
            data.action === 'close'
        ) {
            setTourComplete(true);
            setRun(false);
            helpers.reset();
        }
    };

    const handleGetHelpers = (helpers) => {
        setHelpers(helpers);
    };

    const handleClick = () => {
        setRun(!run);
    };

    return (
        <div>
            <TourButton onClick={handleClick} />
            <Joyride
                steps={steps}
                callback={handleJoyrideCallback}
                continuous={true}
                showProgress={true}
                showSkipButton={false}
                disableOverlay={true}
                getHelpers={handleGetHelpers}
                run={run}
                tooltipComponent={TourTooltip}
            />
        </div>
    );
}
