import ImageIdentifyParameters from '@arcgis/core/rest/support/ImageIdentifyParameters';
import ImageHistogramParameters from '@arcgis/core/rest/support/ImageHistogramParameters';
import * as imageService from "@arcgis/core/rest/imageService.js";
import TimeExtent from '@arcgis/core/TimeExtent';
import MosaicRule from '@arcgis/core/layers/support/MosaicRule';
import Extent from '@arcgis/core/geometry/Extent';

export const handleImageServiceRequest = async (event, currentJSON, setChartData, setVitalsData) => {
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

  try {
    let timeStamps = [];
    let pixelValues = [];
    const results = await imageService.identify(currentJSON.service, imageIdentifyParams);

    if (results.value) {
        pixelValues = results.value.split(';').map(value => parseFloat(value.trim()));
        results.properties.Attributes.forEach(attribute => {
            const timestamp = attribute.StdTime;

            const date = new Date(timestamp);

            if (!isNaN(date.getTime())) {
              timeStamps.push(date.toLocaleString('en-us', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }));
            }
          });

        setChartData(pixelValues.map((y, i) => ({ x: timeStamps[i], y })));
    }

    const point = event.mapPoint;
    const buffer = 0.1;

    const extent = new Extent({
        xmin: point.x - buffer,
        ymin: point.y - buffer,
        xmax: point.x + buffer,
        ymax: point.y + buffer,
        spatialReference: { wkid: 4326 }
    });

    const imageHistogramParams = new ImageHistogramParameters({
        ...params,
        geometry: extent,
        geometryType: 'esriGeometryEnvelope',
        timeExtent: new TimeExtent({
            start: new Date(currentJSON.datetimeRange?.[0] || Date.UTC(2020, 1, 1)),
            end: new Date(currentJSON.datetimeRange?.[1] || Date.UTC(2030, 1, 1))
        }),
    });

    const histogramResults = await imageService.computeStatisticsHistograms(currentJSON.service, imageHistogramParams);

    if (histogramResults.statistics && histogramResults.statistics[0]) {
      const newVitals = {
        globalMax: histogramResults.statistics[0].max.toFixed(2),
        globalAverage: histogramResults.statistics[0].mean.toFixed(2),
      };
      setVitalsData(newVitals);
    } else {
      setVitalsData({ globalMax: '-', globalAverage: '-' });
    }
  } catch (err) {
    console.error('Error fetching image service statistics:', err);
  }
};

export const handleWCSRequest = async (event, mapView, currentJSON, setChartData, setVitalsData) => {
  const point = mapView.toMap({ x: event.x, y: event.y });
  console.log("Clicked at:", point.latitude, point.longitude);

  const wcsTimestamps = ["2001-01-01T00:00:00.000Z", "2001-02-01T00:00:00.000Z", "2001-03-01T00:00:00.000Z", "2001-04-01T00:00:00.000Z", "2001-05-01T00:00:00.000Z", "2001-06-01T00:00:00.000Z", "2001-07-01T00:00:00.000Z", "2001-08-01T00:00:00.000Z", "2001-09-01T00:00:00.000Z", "2001-10-01T00:00:00.000Z", "2001-11-01T00:00:00.000Z", "2001-12-01T00:00:00.000Z", "2002-01-01T00:00:00.000Z"]

  const xySubset = `SUBSET=Lat(${event.mapPoint.extent.ymin},${event.mapPoint.extent.ymax})&SUBSET=Lon(${event.mapPoint.extent.xmin},${event.mapPoint.extent.xmax})`;
  const timeSubset = `SUBSET=ansi("2001-01-01T00:00:00.000Z","2002-01-01T00:00:00.000Z")`;

  const wcsUrl = `https://ows.rasdaman.org/rasdaman/ows?&SERVICE=WCS&VERSION=${currentJSON.wcsParams.version}&REQUEST=${currentJSON.wcsParams.request}&COVERAGEID=${currentJSON.wcsParams.coverageId}&${timeSubset}&${xySubset}&FORMAT=${currentJSON.wcsParams.format}`;

  try {
    const response = await fetch(wcsUrl);
    const wcsJSON = await response.json();

    if (wcsJSON) {
      const timeStamps = wcsTimestamps.map(i => new Date(i).toLocaleDateString('en-us', { month: 'numeric', day: 'numeric' }));
      const pixelValues = wcsJSON.flat().flat();
      setChartData(pixelValues.map((y, i) => ({ x: timeStamps[i], y })));

      const maxValue = Math.max(...pixelValues);
      const meanValue = pixelValues.reduce((acc, val) => acc + val, 0) / pixelValues.length;
      const newVitals = {
        globalMax: maxValue.toFixed(2),
        globalAverage: meanValue.toFixed(2),
      };
      setVitalsData(newVitals);
    }
  } catch (error) {
    console.error('Error fetching WCS Coverage:', error);
  }
};
