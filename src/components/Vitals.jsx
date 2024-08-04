import Sketch from "@arcgis/core/widgets/Sketch";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import TimeExtent from "@arcgis/core/TimeExtent";
import ImageHistogramParameters from "@arcgis/core/rest/support/ImageHistogramParameters";
import * as imageService from "@arcgis/core/rest/imageService.js";

import { useRef, useContext, useEffect, useState } from 'react';
import { MapViewContext, VitalSelectionContext, CurrentJSONContext } from '../contexts/AppContext';

export default function Vitals() {
    const { mapView } = useContext(MapViewContext);
    const { currentJSON } = useContext(CurrentJSONContext);
    const { vitalSelection } = useContext(VitalSelectionContext);
    const [vitals, setVitals] = useState({ globalMin: null, globalMax: null, globalAverage: null, globalTrend: null });
    const [layerName, setLayerName] = useState({ layerName: null, layerUnit: null });
    const sketchRef = useRef(null);
    const debounceRef = useRef(null);

    // Function to add sketchLayer to mapView
    const addSketchLayer = () => {
        const graphicsLayer = new GraphicsLayer();
        mapView.map.add(graphicsLayer);

        const sketch = new Sketch({
            layer: graphicsLayer,
            view: mapView,
            creationMode: "update",
            container: sketchRef.current,
            availableCreateTools: ["polygon", "rectangle", "circle"], // Only allow polygon creation
            visibleElements: {
                createTools: {
                    point: true,
                    polyline: false,
                    polygon: true, // Enable polygon tool
                    rectangle: true,
                    circle: true
                },
                selectionTools: {
                    "rectangle-selection": false, // Enable rectangle selection tool
                    "lasso-selection": false
                },
                undoRedoMenu: false,
                settingsMenu: false
            }
        });

        const timeExtent = new TimeExtent({
            start: new Date(Date.UTC(2021, 9, 1)),
            end: new Date(Date.UTC(2024, 3, 31))
        });

        // Listen for the update event
        sketch.on('update', event => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current); // Clear the existing timeout
            }
            debounceRef.current = setTimeout(() => {
                if (event.state === 'active' && event.graphics.length > 0) {
                    const graphic = event.graphics[0];
                    const extent = graphic.geometry.extent;

                    // set the histogram parameters to request
                    // data for the current view extent and resolution
                    const params = new ImageHistogramParameters({
                        geometry: extent,
                        timeExtent: timeExtent
                    });

                    // request for histograms and statistics for the specified parameters
                    imageService.computeStatisticsHistograms(currentJSON.service, params).then(function (results) {
                        if (results.statistics && results.statistics[0]) {
                            console.log(results.statistics[0]); // Log the statistics of the sketch polygon
                            const prediction = (results.statistics[0].mean - results.statistics[0].median) * 0.5 + results.statistics[0].mean;
                            const newVitals = {
                                globalMin: results.statistics[0].min.toFixed(2),
                                globalMax: results.statistics[0].max.toFixed(2),
                                globalAverage: results.statistics[0].mean.toFixed(2),
                                globalTrend: prediction.toFixed(2)
                            }
                            setVitals(newVitals);
                        } else {
                            setVitals({ globalMin: "-", globalMax: "-", globalAverage: "-", globalTrend: "-" }); // Set globalVitals to null if results.statistics[0] is undefined
                        }
                    })
                        .catch(function (err) {
                            console.log("err", err)
                        });
                }
            }, 10);

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

        sketchRef.current.innerHTML = "";
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
        <div className="px-4 py-16 mx-auto sm:max-w-xl md:max-w-full lg:max-w-screen-xl md:px-24 lg:px-8 lg:py-20">
            <div ref={sketchRef} className="absolute top-0 right-0 left-0 mx-auto content-center text-white"></div>
            <div className="absolute top-2 right-50 left-2 mx-auto content-center text-white">{layerName.layerName} ({layerName.layerUnit})</div>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mt-4">
                <div className="text-center md:border-r">
                    <h6 className="text-4xl font-bold lg:text-5xl xl:text-6xl">{vitals.globalAverage}</h6>
                    <p className="text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base">
                        Average
                    </p>
                </div>
                <div className="text-center md:border-r">
                    <h6 className="text-4xl font-bold lg:text-5xl xl:text-6xl">{vitals.globalTrend}</h6>
                    <p className="text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base">
                        Trend
                    </p>
                </div>
                <div className="text-center md:border-r">
                    <h6 className="text-4xl font-bold lg:text-5xl xl:text-6xl">{vitals.globalMax}</h6>
                    <p className="text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base">
                        Maximum
                    </p>
                </div>
                <div className="text-center">
                    <h6 className="text-4xl font-bold lg:text-5xl xl:text-6xl">{vitals.globalMin}</h6>
                    <p className="text-sm font-medium tracking-widest text-gray-800 uppercase lg:text-base">
                        Minimum
                    </p>
                </div>
            </div>
        </div>

        // <section className="h-full overflow-auto">
        //     <div ref={sketchRef} className="absolute top-0 right-0 left-0 mx-auto content-center rounded"></div>
        //     <div className="absolute top-2 right-0 left-2 mx-auto content-center text-white">{layerName.layerName} ({layerName.layerUnit})</div>
        //     <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full content-center">
        //         <div className="flex flex-col flex-1 gap-10 lg:gap-0 lg:flex-row lg:justify-between mt-12">
        //             <div className="w-full lg:w-1/4 border-b pb-10 lg:border-b-0 lg:pb-0 lg:border-r border-black">
        //                 <div
        //                     className="font-manrope font-bold text-5xl text-gray-900 mb-5 text-center">
        //                     {vitals.globalAverage}
        //                 </div>
        //                 <span className="text-xl text-black text-center block ">Average
        //                 </span>
        //             </div>
        //             <div className="w-full lg:w-1/4 border-b pb-10 lg:border-b-0 lg:pb-0 lg:border-r border-black">
        //                 <div
        //                     className="font-manrope font-bold text-5xl text-gray-900 mb-5 text-center ">
        //                     {vitals.globalMin}
        //                 </div>
        //                 <span className="text-xl text-black text-center block ">Minimum
        //                 </span>
        //             </div>
        //             <div className="w-full lg:w-1/4 border-b pb-10 lg:border-b-0 lg:pb-0 lg:border-r border-black">
        //                 <div
        //                     className="font-manrope font-bold text-5xl text-gray-900 mb-5 text-center ">
        //                     {vitals.globalMax}
        //                 </div>
        //                 <span className="text-xl text-black text-center block ">Maximum
        //                 </span>
        //             </div>
        //             <div className="w-full lg:w-1/4  ">
        //                 <div
        //                     className="font-manrope font-bold text-5xl text-gray-900 mb-5 text-center ">
        //                     {vitals.globalTrend}
        //                 </div>
        //                 <span className="text-xl text-black text-center block ">Trend
        //                 </span>
        //             </div>
        //         </div>
        //     </div>
        // </section>

    );
}