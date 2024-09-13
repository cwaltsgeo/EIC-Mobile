
import Point from '@arcgis/core/geometry/Point';
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
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { VideoContext } from '../contexts/VideoContext';
import { ChartDataContext, CurrentJSONContext, MapViewContext } from '../contexts/AppContext';
import { VitalsDataContext } from '../contexts/AppContext';
import * as geometryEngineAsync from '@arcgis/core/geometry/geometryEngineAsync';
import { handleImageServiceRequest } from '../utils/utils';

export default function Home() {
  const { videoElementRef } = useContext(VideoContext);
  const mapDiv = useRef(null);
  const { mapView } = useContext(MapViewContext);
  const { currentJSON } = useContext(CurrentJSONContext);
  const { setChartData } = useContext(ChartDataContext);
  const { setMapView } = useContext(MapViewContext);
  const { setVitalsData} = useContext(VitalsDataContext);

  const currentJSONRef = useRef(currentJSON);

  useEffect(() => {
    currentJSONRef.current = currentJSON;
  }, [currentJSON]);

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

      videoElementRef.current = element;

      const mediaLayer = new MediaLayer({
        source: [element],
        title: layer.name,
        copyright: "NASA's Goddard Space Flight Center",
      });

      layerList.push(mediaLayer);

      // Add the vector layer
      const vectorLayer = new FeatureLayer({
        url: 'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Countries_(Generalized)/FeatureServer',
        title: 'Country Boundaries',
        popupEnabled: false,
        renderer: {
          type: 'simple',
          symbol: {
            type: 'simple-fill',
            color: 'rgba(0,76,115,0.04)',
            outline: {
              color: 'rgba(0,76,115,1)',
              width: 1
            }
          }
        },
        labelingInfo: [
          {
            labelExpressionInfo: { expression: "$feature.COUNTRY" },
            symbol: {
              type: "text",
              color: "black",
              haloColor: "white",
              haloSize: "1px",
              font: {
                size: "12px",
                family: "Arial",
                weight: "bold"
              }
            }
          }
        ]
      });

      layerList.push(vectorLayer);

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
      const pointLayer = new GraphicsLayer({ title: 'Geodesic-Point' });
      const bufferLayer = new GraphicsLayer({ title: 'Geodesic-Buffer' });
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

    view.when(async () => {

      // Adding a default point for Washington, DC. We'll try
      // to make this more dynamic and to depend on the user location,
      // but for now it's hardcoded.
      const initialCenterPoint = new Point({
        longitude: -77.0369,
        latitude: 38.9072,
        spatialReference: { wkid: 4326 }
      });

      await view.goTo({
        center: [initialCenterPoint.longitude, initialCenterPoint.latitude],
        zoom: 1,
      });

      await createBuffer(initialCenterPoint);

      await handleMapClick({ mapPoint: initialCenterPoint });

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
    if (!currentJSON.wcs) {
      await handleImageServiceRequest(event, currentJSONRef.current, setChartData, setVitalsData);
    }
  };

  return (
    <div>
      <div ref={mapDiv} style={{ height: '100vh' }}></div>
    </div>
  );
}