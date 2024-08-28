import { useContext, useEffect, useRef } from 'react';
import Graphic from '@arcgis/core/Graphic';
import config from '../config.json';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Map from '@arcgis/core/Map.js';
import Extent from '@arcgis/core/geometry/Extent';
import MediaLayer from '@arcgis/core/layers/MediaLayer';
import ExtentAndRotationGeoreference from '@arcgis/core/layers/support/ExtentAndRotationGeoreference';
import VideoElement from '@arcgis/core/layers/support/VideoElement';
import SceneView from '@arcgis/core/views/SceneView';
import Search from '@arcgis/core/widgets/Search';
import Popup from '@arcgis/core/widgets/Popup';
import TimeExtent from '@arcgis/core/TimeExtent';
import ImageIdentifyParameters from '@arcgis/core/rest/support/ImageIdentifyParameters';
import ImageHistogramParameters from '@arcgis/core/rest/support/ImageHistogramParameters';
import MosaicRule from '@arcgis/core/layers/support/MosaicRule';
import * as imageService from "@arcgis/core/rest/imageService.js";
import { ChartDataContext, CurrentJSONContext, MapViewContext } from '../contexts/AppContext';
import { VitalsDataContext } from '../contexts/AppContext';
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync';

export default function Home() {
  const mapDiv = useRef(null);
  const { mapView } = useContext(MapViewContext);
  const { currentJSON } = useContext(CurrentJSONContext);
  const { setChartData } = useContext(ChartDataContext);
  const { setMapView } = useContext(MapViewContext);
  const { setVitalsData} = useContext(VitalsDataContext);

  useEffect(() => {
    let layerList = [];
    config.forEach(layer => {
      const element = new VideoElement({
        video: layer.video,
        georeference: new ExtentAndRotationGeoreference({
          extent: new Extent({
            xmin: -180,
            ymin: -90,
            xmax: 180,
            ymax: 90,
            spatialReference: {
              wkid: 4326
            }
          })
        })
      });

      const mediaLayer = new MediaLayer({
        source: [element],
        title: layer.name,
        copyright: "NASA's Goddard Space Flight Center",
      });

      layerList.push(mediaLayer);
    });

    const map = new Map({
      layers: layerList
    });

    const view = new SceneView({
      container: mapDiv?.current,
      map: map,
      center: [-80, 40],
      popupEnabled: true,
      popup: new Popup({
        defaultPopupTemplateEnabled: true,
        dockEnabled: true,
        dockOptions: {
          buttonEnabled: false,
          breakpoint: false
        }
      }),
      constraints: {
        snapToZoom: false,
        altitude: {
          min: 2000000
        }
      }
    });

    let draggingInsideBuffer = false;
    let initialCamera;

    const bufferSymbol = {
      type: "simple-fill",
      color: [5, 80, 216, 0.5],
      outline: {
        color: [2, 28, 75, 1],
        width: 2,
        style: 'dot'
      }
    };

    const pointSymbol = {
      type: "simple-marker",
      color: [5, 80, 216, 0.5],
      outline: {
        color: [2, 28, 75, 1],
        width: 1
      },
      size: 7
    };

    const initializeLayers = () => {
      const pointLayer = new GraphicsLayer();
      const bufferLayer = new GraphicsLayer();
      map.addMany([pointLayer, bufferLayer]);

      return { bufferLayer, pointLayer };
    };


    const { bufferLayer, pointLayer } = initializeLayers();

    const createBuffer = async (point) => {
      point.hasZ = false;
      point.z = undefined;

      const buffer = await geometryEngineAsync.geodesicBuffer(point, 560, 'kilometers');

      if (pointLayer.graphics.length === 0) {
        pointLayer.add(new Graphic({ geometry: point, symbol: pointSymbol, attributes: { name: 'Geodesic-Buffer' }   }));
        bufferLayer.add(new Graphic({ geometry: buffer, symbol: bufferSymbol, attributes: { name: 'Geodesic-Buffer' }   }));
      } else {
        const pointGraphic = pointLayer.graphics.getItemAt(0);
        pointGraphic.geometry = point;

        const bufferGraphic = bufferLayer.graphics.getItemAt(0);
        bufferGraphic.geometry = buffer;
        bufferGraphic.attributes = { name: 'Geodesic-Buffer' };
      }

      console.log('Buffer updated at point:', point, 'with buffer:', buffer);
    };

    let lastKnownPoint;

    const handleDragStart = async (event) => {
      const startPoint = view.toMap({ x: event.x, y: event.y });
      const bufferGraphic = bufferLayer.graphics.getItemAt(0);

      if (startPoint && bufferGraphic) {
        const isWithinBuffer = await geometryEngineAsync.contains(bufferGraphic.geometry, startPoint);
        draggingInsideBuffer = isWithinBuffer;

        if (isWithinBuffer) {
          event.stopPropagation();
          initialCamera = view.camera.clone();
        }
      }
    };

    const handleDragMove = async (event) => {
      if (draggingInsideBuffer) {
        const updatedPoint = view.toMap({ x: event.x, y: event.y });

        if (updatedPoint) {
          event.stopPropagation();

          await createBuffer(updatedPoint);

          lastKnownPoint = updatedPoint;
        }
      }
    };

    const handleDragEnd = async () => {
      if (draggingInsideBuffer) {
        view.goTo(initialCamera, { animate: false });

        if (lastKnownPoint) {
          await handleMapClick({ mapPoint: lastKnownPoint });
        }

        draggingInsideBuffer = false;
      }
    };

    view.when(() => {
      const initialCenterPoint = view.center.clone();
      createBuffer(initialCenterPoint);

      view.on("drag", (event) => {
        if (event.action === "start") {
          handleDragStart(event);
        } else if (event.action === "update") {
          handleDragMove(event);
        } else if (event.action === "end") {
          handleDragEnd();
        }
      });
    });

    const searchWidget = new Search({
      view: view
    });

    view.when(() => {
      view.ui.move("zoom", "top-right");
      view.ui.move("compass", "top-right");
      view.ui.move("navigation-toggle", "top-right");
      view.ui.move("attribution", "bottom-right");
    });

    view.ui.add(searchWidget, {
      position: 'top-right'
    });

    setMapView(view);

    return () => {
      if (view) {
        view.destroy();
      }
    }
  }, [setMapView]);

  const handleMapClick = async (event) => {
    const timeExtent = new TimeExtent({
        start: new Date(currentJSON.datetimeRange?.[0] || Date.UTC(2020, 1, 1)),
        end: new Date(currentJSON.datetimeRange?.[1] || Date.UTC(2030, 1, 1))
    });

    if (!currentJSON.wcs) {
        console.log('...from image service');
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

        imageService.identify(currentJSON.service, imageIdentifyParams).then((results) => {
            var pixelValues = []
            var timeStamps = []

            if (results.value) {
                results.value.split('; ').map(Number).map(i => pixelValues.push(i));
                results.properties.Attributes.map(i => timeStamps.push(i.StdTime));
                timeStamps = timeStamps.map(i => new Date(i).toLocaleDateString('en-us', { month: 'numeric', day: 'numeric', hour: 'numeric' }));

                setChartData(pixelValues.map((y, i) => ({ x: timeStamps[i], y })));
            }
        });

        const imageHistogramParams = new ImageHistogramParameters({
            ...params,
            geometry: event.mapPoint.extent,
            timeExtent: timeExtent
        });

        imageService.computeStatisticsHistograms(currentJSON.service, imageHistogramParams)
        .then((results) => {
          if (results.statistics && results.statistics[0]) {
            const newVitals = {
              globalMax: results.statistics[0].max.toFixed(2),
              globalAverage: results.statistics[0].mean.toFixed(2),
            };
            setVitalsData(newVitals);
          } else {
            setVitalsData({ globalMax: '-', globalAverage: '-' });
          }
        })
        .catch((err) => {
          console.log('Error fetching image service statistics:', err);
        });
    } else {
        console.log('...from WCS');
        const point = mapView.toMap({ x: event.x, y: event.y });
        console.log("Clicked at:", point.latitude, point.longitude);

        const wcsTimestamps = ["2001-01-01T00:00:00.000Z", "2001-02-01T00:00:00.000Z", "2001-03-01T00:00:00.000Z", "2001-04-01T00:00:00.000Z", "2001-05-01T00:00:00.000Z", "2001-06-01T00:00:00.000Z", "2001-07-01T00:00:00.000Z", "2001-08-01T00:00:00.000Z", "2001-09-01T00:00:00.000Z", "2001-10-01T00:00:00.000Z", "2001-11-01T00:00:00.000Z", "2001-12-01T00:00:00.000Z", "2002-01-01T00:00:00.000Z"] // TODO: hard coded for now

        const request = currentJSON.wcsParams.request;
        const version = currentJSON.wcsParams.version;
        const coverage = currentJSON.wcsParams.coverageId;
        const format = currentJSON.wcsParams.format;
        const xySubset = `SUBSET=Lat(${event.mapPoint.extent.ymin},${event.mapPoint.extent.ymax})&SUBSET=Lon(${event.mapPoint.extent.xmin},${event.mapPoint.extent.xmax})`;
        const timeSubset = `SUBSET=ansi("2001-01-01T00:00:00.000Z","2002-01-01T00:00:00.000Z")`; // TODO: hard coded for now

        const wcsUrl = `https://ows.rasdaman.org/rasdaman/ows?&SERVICE=WCS&VERSION=${version}&REQUEST=${request}&COVERAGEID=${coverage}&${timeSubset}&${xySubset}&FORMAT=${format}`;

        fetch(wcsUrl)
          .then(response => response.json())
          .then(wcsJSON => {
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
          })
          .catch(error => {
            console.error('Error fetching WCS Coverage:', error);
          });
    }
  };

  return (
    <div>
      <div ref={mapDiv} style={{ height: '100vh' }}></div>
    </div>
  );
}