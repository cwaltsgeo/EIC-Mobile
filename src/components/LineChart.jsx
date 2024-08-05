import { useContext, useState, useEffect, useRef } from "react";

import ImageIdentifyParameters from "@arcgis/core/rest/support/ImageIdentifyParameters";
import * as imageService from "@arcgis/core/rest/imageService.js";

import Chart from 'chart.js/auto';
import crosshairPlugin from 'chartjs-plugin-crosshair';

import { MapViewContext, ChartSelectionContext, VitalSelectionContext, CurrentJSONContext } from '../contexts/AppContext';

export default function Panel() {

    const { mapView } = useContext(MapViewContext);
    const { chartSelection } = useContext(ChartSelectionContext);
    const { vitalSelection } = useContext(VitalSelectionContext);
    const { currentJSON } = useContext(CurrentJSONContext);

    const [clickHandle, setClickHandle] = useState(false)

    const chartRef = useRef(null);
    const [chartInstance, setChartInstance] = useState(null);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (chartRef.current && chartData.length > 0) {
            const ctx = chartRef.current.getContext('2d');

            // If there's an existing chart instance, update its data
            if (chartInstance) {
                chartInstance.data.labels = chartData.map(data => data.x);
                chartInstance.data.datasets[0].data = chartData.map(data => data.y);
                chartInstance.data.datasets[0].label = currentJSON.unit;
                chartInstance.update();
            } else {
                // Create a new chart
                const newChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map(data => data.x),
                        datasets: [{
                            label: currentJSON.unit,
                            data: chartData.map(data => data.y),
                            borderColor: 'steelblue',
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        interaction: {
                            intersect: false,
                            mode: 'index',
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        },
                        plugins: {
                            crosshair: {
                                line: {
                                    color: '#F66',
                                    width: 1
                                },
                                snap: true,
                                sync: {
                                    enabled: true,   
                                    group: 1,
                                    suppressTooltips: false
                                },
                                callbacks: {
                                    beforeZoom: function (start, end) {
                                        return true;
                                    },
                                    afterZoom: function (start, end) {
                                    }
                                }
                            }
                        }
                    },
                    plugins: [crosshairPlugin]
                });

                // Save the new chart instance
                setChartInstance(newChartInstance);
            }
        }
    }, [chartData, chartInstance, currentJSON]);

    // Feed the chart with pixel values
    const queryPixels = (event) => {
        console.log("Querying Pixels");

        const params = new ImageIdentifyParameters({
            geometry: event.mapPoint,
            processAsMultidimensional: true,
            returnPixelValues: true,
            returnCatalogItems: false,
            returnGeometry: false,
        });

        imageService.identify(currentJSON.service, params).then((results) => {
            var pixelValues = []
            var timeStamps = []

            if (results.value) {
                results.value.split('; ').map(Number).map(i => pixelValues.push(i));
                results.properties.Attributes.map(i => timeStamps.push(i.StdTime));
                //timeStamps = timeStamps.map(i => new Date(i).toLocaleDateString('en-us', { year: "numeric", month: "numeric", day: "numeric" }));
                timeStamps = timeStamps.map(i => new Date(i).toLocaleDateString('en-us', { month: "numeric", day: "numeric", hour: "numeric" }));
                setChartData(pixelValues.map((y, i) => ({ x: timeStamps[i], y })));
            }
        });
    };

    // Add onClick event listener to the map view when the chart panel is selected
    if (!vitalSelection && chartSelection) {
        if (!clickHandle) {
            console.log("Adding handles");
            mapView.addHandles(mapView.on("click", queryPixels));
            setClickHandle(true);
        };
    // Remove the onClick event listener when the chart panel is deselecteds
    } else if ((vitalSelection && !chartSelection) || (!chartSelection)) {
        if (clickHandle) {
            console.log("Removing handles");
            mapView?.removeHandles(mapView.queryPixels);
            setClickHandle(false);
        }
    }


    return (
        <div style={{ width: '100%', height: '25vh' }}>
            <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
        </div>
    );
}