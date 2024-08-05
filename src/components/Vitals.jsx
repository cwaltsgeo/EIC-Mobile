import { useRef, useContext, useEffect, useState } from 'react';

import Sketch from '@arcgis/core/widgets/Sketch';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import TimeExtent from '@arcgis/core/TimeExtent';
import ImageHistogramParameters from '@arcgis/core/rest/support/ImageHistogramParameters';
import * as imageService from '@arcgis/core/rest/imageService.js';

import { MapViewContext, VitalSelectionContext, CurrentJSONContext } from '../contexts/AppContext';

// Vitals component to display the selected layer's summary statistics
export default function Vitals() {

    const { mapView } = useContext(MapViewContext);
    const { currentJSON } = useContext(CurrentJSONContext);
    const { vitalSelection } = useContext(VitalSelectionContext);
    const [vitals, setVitals] = useState({ globalMin: null, globalMax: null, globalAverage: null, globalTrend: null });
    const [layerName, setLayerName] = useState({ layerName: null, layerUnit: null });
    const sketchRef = useRef(null);
    const debounceRef = useRef(null);

    const addSketchLayer = () => {
        const graphicsLayer = new GraphicsLayer();
        mapView.map.add(graphicsLayer);

        const sketch = new Sketch({
            layer: graphicsLayer,
            view: mapView,
            creationMode: 'update',
            container: sketchRef.current,
            availableCreateTools: ['polygon', 'rectangle', 'circle'],
            visibleElements: {
                createTools: {
                    point: true,
                    polyline: false,
                    polygon: true,
                    rectangle: true,
                    circle: true
                },
                selectionTools: {
                    'rectangle-selection': false,
                    'lasso-selection': false
                },
                undoRedoMenu: false,
                settingsMenu: false
            }
        });

        // Time extent for the statistics
        const timeExtent = new TimeExtent({
            start: new Date(Date.UTC(2020, 1, 1)),
            end: new Date(Date.UTC(2030, 1, 1))
        });

        // Update summary statistics when user moves the sketch, 10ms debounce
        sketch.on('update', event => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(() => {
                if (event.state === 'active' && event.graphics.length > 0) {
                    const graphic = event.graphics[0];
                    const extent = graphic.geometry.extent;

                    const params = new ImageHistogramParameters({
                        geometry: extent,
                        timeExtent: timeExtent
                    });

                    // request for histograms and statistics for the specified parameters
                    imageService.computeStatisticsHistograms(currentJSON.service, params).then(function (results) {
                        if (results.statistics && results.statistics[0]) {
                            const prediction = (results.statistics[0].mean - results.statistics[0].median) * 0.5 + results.statistics[0].mean;
                            const newVitals = {
                                globalMin: results.statistics[0].min.toFixed(2),
                                globalMax: results.statistics[0].max.toFixed(2),
                                globalAverage: results.statistics[0].mean.toFixed(2),
                                globalTrend: prediction.toFixed(2)
                            }
                            setVitals(newVitals);
                        } else {
                            setVitals({ globalMin: '-', globalMax: '-', globalAverage: '-', globalTrend: '-' });
                        }
                    })
                        .catch(function (err) {
                            console.log('err', err)
                        });
                }
            }, 10); // 10ms debounce, increase if needed

        });
    };

    const removeSketchLayer = (globalVitals) => {
        if (!mapView) {
            return;
        }

        setVitals(globalVitals)

        mapView.map.layers.items.forEach(layer => {
            if (layer instanceof GraphicsLayer) {
                mapView.map.remove(layer);
            }
        });

        mapView.ui.components.forEach(sketch => {
            if (sketch instanceof Sketch) {
                sketch.destroy();
            }
        });

        sketchRef.current.innerHTML = '';
    };

    useEffect(() => {
        if (vitalSelection) {
            setVitals(currentJSON.vitals);
            setLayerName({ layerName: currentJSON.name, layerUnit: currentJSON.unit });
            addSketchLayer();
        } else {
            removeSketchLayer(currentJSON.vitals);
        }
    }, [mapView, vitalSelection, currentJSON]);

    return (
        <div className='px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20'>
            <div ref={sketchRef} className='absolute top-0 right-0 left-0 mx-auto content-center text-white'></div>
            <div className='absolute top-2 right-50 left-2 mx-auto content-center text-white'>{layerName.layerName} ({layerName.layerUnit})</div>
            <div className='grid grid-cols-2 gap-8 md:grid-cols-4 mt-4'>
                <div className='text-center md:border-r'>
                    <h6 className='text-4xl font-bold lg:text-5xl xl:text-6xl'>{vitals.globalAverage}</h6>
                    <p className='text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base'>
                        Average
                    </p>
                </div>
                <div className='text-center md:border-r'>
                    <h6 className='text-4xl font-bold lg:text-5xl xl:text-6xl'>{vitals.globalTrend}</h6>
                    <p className='text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base'>
                        Trend
                    </p>
                </div>
                <div className='text-center md:border-r'>
                    <h6 className='text-4xl font-bold lg:text-5xl xl:text-6xl'>{vitals.globalMax}</h6>
                    <p className='text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base'>
                        Maximum
                    </p>
                </div>
                <div className='text-center'>
                    <h6 className='text-4xl font-bold lg:text-5xl xl:text-6xl'>{vitals.globalMin}</h6>
                    <p className='text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base'>
                        Minimum
                    </p>
                </div>
            </div>
        </div>
    );
}