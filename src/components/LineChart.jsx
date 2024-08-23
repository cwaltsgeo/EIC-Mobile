import { useContext, useState, useEffect, useRef } from 'react';

import ImageIdentifyParameters from '@arcgis/core/rest/support/ImageIdentifyParameters';
import MosaicRule from "@arcgis/core/layers/support/MosaicRule.js";
import TimeExtent from "@arcgis/core/TimeExtent.js";
import * as imageService from '@arcgis/core/rest/imageService.js';

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
        console.log('Querying Pixels');

        if (!currentJSON.wcs) {
            console.log('...from Image Service');
            const point = mapView.toMap({ x: event.x, y: event.y });
            console.log("Clicked at:", point.latitude, point.longitude);
            let params = {
                geometry: event.mapPoint,
                processAsMultidimensional: true,
                returnFirstValueOnly: false,
                timeExtent: new TimeExtent({
                    start: new Date(currentJSON.datetimeRange?.[0] || Date.UTC(2020, 1, 1)),
                    end: new Date(currentJSON.datetimeRange?.[1] || Date.UTC(2030, 1, 1))
                }),
                returnPixelValues: true,
                returnCatalogItems: false,
                returnGeometry: false,
            };

            if (currentJSON.variable) {
                params = {
                    ...params,
                    mosaicRule: new MosaicRule({
                        multidimensionalDefinition: [{variableName: currentJSON.variable}]
                    }),
                }
            }

            const imageIdentifyParams = new ImageIdentifyParameters(params);

            console.log("querying statistics")
            imageService.identify(currentJSON.service, imageIdentifyParams).then((results) => {
                console.log(results)
                var pixelValues = []
                var timeStamps = []

                if (results.value) {
                    results.value.split('; ').map(Number).map(i => pixelValues.push(i));
                    results.properties.Attributes.map(i => timeStamps.push(i.StdTime));
                    //timeStamps = timeStamps.map(i => new Date(i).toLocaleDateString('en-us', { year: 'numeric', month: 'numeric', day: 'numeric' }));
                    timeStamps = timeStamps.map(i => new Date(i).toLocaleDateString('en-us', { month: 'numeric', day: 'numeric', hour: 'numeric' }));

                    setChartData(pixelValues.map((y, i) => ({ x: timeStamps[i], y })));
                }
            });
        } else {
            console.log('...from WCS');
            const point = mapView.toMap({ x: event.x, y: event.y });
            console.log("Clicked at:", point.latitude, point.longitude);
            
            var timeStamps = []

            // build WCS URL
            const request = currentJSON.wcsParams.request;
            const version = currentJSON.wcsParams.version;
            const coverage = currentJSON.wcsParams.coverageId;
            const format = currentJSON.wcsParams.format;
            const xySubset = `SUBSET=Lat(${point.latitude},${point.latitude})&SUBSET=Lon(${point.longitude},${point.longitude})`
            const timeSubset = `SUBSET=ansi("2001-01-01T00:00:00.000Z","2002-01-01T00:00:00.000Z")` // TODO: hard coded for now
            const wcsTimestamps = ["2001-01-01T00:00:00.000Z", "2001-02-01T00:00:00.000Z", "2001-03-01T00:00:00.000Z", "2001-04-01T00:00:00.000Z", "2001-05-01T00:00:00.000Z", "2001-06-01T00:00:00.000Z", "2001-07-01T00:00:00.000Z", "2001-08-01T00:00:00.000Z", "2001-09-01T00:00:00.000Z", "2001-10-01T00:00:00.000Z", "2001-11-01T00:00:00.000Z", "2001-12-01T00:00:00.000Z", "2002-01-01T00:00:00.000Z"] // TODO: hard coded for now
            
            const wcsUrl = `https://ows.rasdaman.org/rasdaman/ows?&SERVICE=WCS&VERSION=${version}&REQUEST=${request}&COVERAGEID=${coverage}&${timeSubset}&${xySubset}&FORMAT=${format}`;
            
            // submit WCS Request
            console.log("Fetching WCS Coverage:", wcsUrl);
            var xhr = new XMLHttpRequest();
            xhr.open('GET', wcsUrl, true);
            xhr.responseType = 'json';
    
            xhr.onload = function (e) {
              var wcsJSON = this.response;
              // handle WCS response
              if (wcsJSON) {
                // Format time stamps
                timeStamps = wcsTimestamps.map(i => new Date(i).toLocaleDateString('en-us', { month: 'numeric', day: 'numeric' }));

                // double-flatten the array
                const pixelValues = wcsJSON.flat().flat();

                setChartData(pixelValues.map((y, i) => ({ x: timeStamps[i], y })));
              }
            };
            xhr.send();
    
        }

    };

    // Add onClick event listener to the map view when the chart panel is selected
    if (!vitalSelection && chartSelection) {
        if (!clickHandle) {
            console.log('Adding handles');
            mapView.addHandles(mapView.on('click', queryPixels));
            setClickHandle(true);
        };
        // Remove the onClick event listener when the chart panel is deselecteds
    } else if ((vitalSelection && !chartSelection) || (!chartSelection)) {
        if (clickHandle) {
            console.log('Removing handles');
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