import Draw from "https://esm.sh/ol/interaction/Draw";
import VectorLayer from "https://esm.sh/ol/layer/Vector";
import VectorSource from "https://esm.sh/ol/source/Vector";
import { getCenter } from 'https://esm.sh/ol/extent';
import LineString from 'https://esm.sh/ol/geom/LineString.js';
import LinearRing from 'https://esm.sh/ol/geom/LinearRing.js';
import MultiLineString from 'https://esm.sh/ol/geom/MultiLineString.js';
import MultiPoint from 'https://esm.sh/ol/geom/MultiPoint.js';
import MultiPolygon from 'https://esm.sh/ol/geom/MultiPolygon.js';
import Point from 'https://esm.sh/ol/geom/Point.js';
import Polygon from 'https://esm.sh/ol/geom/Polygon.js';
import GeoJSON from 'https://esm.sh/ol/format/GeoJSON.js';
import Feature from 'https://esm.sh/ol/Feature.js';
import {Style, Fill, Stroke} from 'https://esm.sh/ol/style';
import DragZoom from 'https://esm.sh/ol/interaction/DragZoom.js';
import {
  always,
  altKeyOnly
} from 'https://esm.sh/ol/events/condition.js';

import {
    getArea,
    getLength
} from 'https://esm.sh/ol/sphere';
import TileLayer from 'https://esm.sh/ol/layer/Tile';

import {
    MAP_CONFIG
} from './config/MapConfig.js';
import {
    CommonJS
} from "./common.js";

const WIDGET_COLOR = MAP_CONFIG.WIDGET.THEME_COLOR;
const cmjs = new CommonJS(WIDGET_COLOR);

export class OlExtension {
    constructor() {
        this.widgetPopup = this.createPopupForWidget();
        document.body.appendChild(this.widgetPopup);


        /*Buffer Analysis Variables*/
        this.geometryTypeBuffer = "Point";
        this.selectedBufferLayer = "";
    }

    TOCWidget(map, containerID) {
        const container = cmjs.createPopupContainer();
        const popupContent = cmjs.createPopupContent();
        const grouped = {};
        map.getLayers().getArray().forEach((layer, index) => {
            let title = layer.get('title') || '';
            title = title && title.split("#")[0]
            if (!grouped[title]) {
                grouped[title] = [];
            }
            grouped[title].push(layer);
        });
        for (let group in grouped) {
            const groupContainer = document.createElement('div');
            groupContainer.classList.add = "ol-extension-layer-group-container";
            Object.assign(groupContainer.style, {
                padding: "4px",
                display: "block"
            })
            const heading = document.createElement('h4');
            heading.innerHTML = group;
            heading.classList.add = "ol-extension-layer-group-class-name";
            Object.assign(heading.style, {
                cursor: "pointer",
                margin: "0",
                fontWeight: "500"
            });
            popupContent.appendChild(heading);
            grouped[group].forEach((layer, index) => {
                if (layer.get('title')) {
                    const label = document.createElement('label');
                    label.style.display = 'block';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = layer.getVisible();
                    checkbox.onchange = () => layer.setVisible(checkbox.checked);

                    if (layer.get('title') && !layer.get('title').toLowerCase().includes('base')) {
                        const zoomToBtn = document.createElement('button');
                        zoomToBtn.classList.add = "ol-extension-zoom-to-layer-button";
                        Object.assign(zoomToBtn.style, {
                            padding: "0px",
                            backgroundColor: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            color: "#005fa3"
                        });
                        zoomToBtn.title = "Zoom To Layer";
                        zoomToBtn.innerHTML = `<i class="fa fa-search-plus" aria-hidden="true"></i>`;
                        zoomToBtn.onclick = () => {
                            const source = layer.getSource();
                            if (source && source.getFeatures && source.getFeatures().length > 0) {
                                const extent = source.getExtent(); // This is valid only *after* features are loaded
                                if (extent) {
                                    map.getView().fit(extent, {
                                        padding: [20, 20, 20, 20],
                                        duration: 1000
                                    });
                                }
                            }
                        }
                        label.appendChild(zoomToBtn);
                    }

                    label.appendChild(checkbox);
                    let layerName = layer.get('title');
                    if (layerName.includes('#')) {
                        layerName = layerName.split('#')[1];
                    }

                    label.appendChild(document.createTextNode(MAP_CONFIG.TOC_DISPLAY_NAME[layerName] || layerName));
                    groupContainer.appendChild(label);
                }
            });

            heading.onclick = () => {
                if (groupContainer.style.display == "block") {
                    groupContainer.style.display = "none";
                } else {
                    groupContainer.style.display = "block";
                }
            }
            popupContent.appendChild(groupContainer);
        }


        const {
            popupHead,
            closeBtn
        } = cmjs.createPopupHeader('Layer TOC');
        container.appendChild(popupHead);
        container.appendChild(popupContent);

        closeBtn.onclick = () => this.widgetPopup.removeChild(container);

        setTimeout(() => {
            let tocContainer = container;
            var {
                toolBtnContainer,
                toolBtn
            } = cmjs.createToolBtn('<i class="fa fa-bars" aria-hidden="true"></i>', 'TOC');
            document.getElementById(containerID).appendChild(toolBtnContainer);
            toolBtn.onclick = () => this.widgetPopup.appendChild(tocContainer);
        }, 2000);
    }

    MeasurementToolWidget(map, containerID) {
        const container = cmjs.createPopupContainer();

        const options = [{
                v: 'LineString',
                t: 'Distance'
            },
            {
                v: 'Polygon',
                t: 'Area'
            }
        ];
        const measurementTypeDropdown = cmjs.createDropdown('Measure Type', options)

        const submitBtn = cmjs.createButton('submit', 'Measure');
        const resetBtn = cmjs.createButton('reset', 'Reset');
		submitBtn.style.display='none';

        const resultDiv = document.createElement('div');

        const vector = new VectorLayer({
            source: new VectorSource()
        });



        let draw = null;
        let sketch;
        let tooltipElement;
        let tooltipOverlay;
        submitBtn.onclick = () => {
            vector.setSource(new VectorSource());
            map.addLayer(vector);
            draw = new Draw({
                source: vector.getSource(),
                type: measurementTypeDropdown.children[1].value
            });


            // Tooltip setup
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'tooltip tooltip-measure';
            tooltipOverlay = new ol.Overlay({
                element: tooltipElement,
                offset: [0, -15],
                positioning: 'bottom-center'
            });
            map.addOverlay(tooltipOverlay);

            draw.on('drawstart', (evt) => {
                sketch = evt.feature;

                sketch.getGeometry().on('change', (e) => {
                    const geom = e.target;
                    let output, coord;

                    if (geom instanceof ol.geom.Polygon) {
                        output = getArea(geom).toFixed(2) + ' m²';
                        coord = geom.getInteriorPoint().getCoordinates();
                    } else {
                        output = getLength(geom).toFixed(2) + ' m';
                        coord = geom.getLastCoordinate();
                    }

                    tooltipElement.innerHTML = output;
                    tooltipOverlay.setPosition(coord);
                });
            });

            draw.on('drawend', (e) => {
                const geom = e.feature.getGeometry();
                let coord;
                if (measurementTypeDropdown.children[1].value === 'Polygon') {
                    // resultDiv.innerText = `Area: ${getArea(geom).toFixed(2)} m²`;
                    coord = getCenter(geom.extent_)
					
                } else {
                    // resultDiv.innerText = `Length: ${getLength(geom).toFixed(2)} m`;
                    coord = geom.getFlatMidpoint ? geom.getFlatMidpoint() : geom.getLastCoordinate();
                }
                

                tooltipOverlay.setPosition(coord);
                tooltipElement.className = 'tooltip tooltip-static';
            });

            map.addInteraction(draw);
        };

        resetBtn.onclick = () => {
            vector.setSource(null);
            map.removeLayer(vector);
			tooltipOverlay.setPosition(null);
			if (draw) {
                map.removeInteraction(draw);
            }
			submitBtn.click();
        }

		measurementTypeDropdown.onchange = () => {
			if (draw) {
				map.removeInteraction(draw);
                draw = new Draw({
            	    source: vector.getSource(),
            	    type: measurementTypeDropdown.children[1].value
            	});
				map.addInteraction(draw);
            }
		}

        const popupContent = cmjs.createPopupContent();

        popupContent.appendChild(measurementTypeDropdown);
        popupContent.appendChild(submitBtn);
        popupContent.appendChild(resetBtn);
        popupContent.appendChild(resultDiv);


        const {
            popupHead,
            closeBtn
        } = cmjs.createPopupHeader('Measurement');
        container.appendChild(popupHead);
        container.appendChild(popupContent);

        closeBtn.onclick = () => {
            this.widgetPopup.removeChild(container);
            if (draw) {
                map.removeInteraction(draw);
            }

			vector.setSource(null);
            map.removeLayer(vector);
			tooltipElement = null;
            sketch = null;
			tooltipOverlay.setPosition(null);
        }

        let measureContainer = container;
        var {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-line-chart" aria-hidden="true"></i>', 'Measurement');
        document.getElementById(containerID).appendChild(toolBtnContainer);
        toolBtn.onclick = () => {
			this.widgetPopup.appendChild(measureContainer);
			submitBtn.click();
		};
    }

    createBufferWidget(map, containerID){

        const handleClickBuffer = function(event) {
            console.log(event.coordinate_);
            const olPoint = new Point(event.coordinate_);
            // const pointFeature = new Feature(olPoint);
            const geojson = new GeoJSON().writeGeometryObject(olPoint);
            const buffer = turf.buffer(geojson, 0.5, { units: 'kilometers' });

            // const bufferedGeom = new GeoJSON().readGeometry(buffer, {
            //     dataProjection: 'EPSG:4326',
            //     featureProjection: 'EPSG:3857',
            // });

            const bufferFeature = new Feature(buffer.geometry);
            bufferFeature.setStyle(
                new Style({
                  fill: new Fill({ color: 'rgba(255, 0, 0, 0.2)' }),
                  stroke: new Stroke({ color: 'red', width: 2 }),
                })
            );

            const vectorLayer = new VectorLayer({
                source: new VectorSource({
                  features: [bufferFeature],
                }),
            });
            map.addLayer(vectorLayer);
        }

        const container = cmjs.createPopupContainer();
        const popupContent = cmjs.createPopupContent();
        const {
            popupHead,
            closeBtn
        } = cmjs.createPopupHeader('Buffer Analysis');
        
        closeBtn.onclick = () => {
            this.widgetPopup.removeChild(container);            
            map.un('singleclick', handleClickBuffer);
        }
        container.appendChild(popupHead);


        /**Dropdown to select geometry */
        const options = [{
                v: 'Point',
                t: 'Point'
            },
            {
                v: 'LineString',
                t: 'Line'
            },
            {
                v: 'Polygon',
                t: 'Polygom'
            }
        ];
        const geometryTypeDropdown = cmjs.createDropdown('Select Geometry', options);
        geometryTypeDropdown.onchange = (evt) =>{
            this.geometryTypeBuffer = evt.target.value;
        }
        /**Dropdown to select geometry */


        /**Dropdown to select Layer */
        const layers = [];
        map.getLayers().getArray().forEach((layer, index) => {
            let title = layer.get('title') || '';
            if(title && !title.includes("OSM")){
                layers.push({
                v:title,
                t:title.split("#")[1]
            })
            }
        });

        const bufferLayerDropdown = cmjs.createDropdown('Select Layer', layers);
        bufferLayerDropdown.onchange = (evt) =>{
            this.selectedBufferLayer = evt.target.value;
        }
        /**Dropdown to select Layer */

        
        /**Appending Dropdowns in the content body */
        popupContent.appendChild(geometryTypeDropdown);
        popupContent.appendChild(bufferLayerDropdown);
        
        
        

        /**Submit & Reset Button for buffer */
        const submitBtn = cmjs.createButton('submit', 'Buffer');
        const resetBtn = cmjs.createButton('reset', 'Reset');

        popupContent.appendChild(submitBtn);
        popupContent.appendChild(resetBtn);


        /**Appending Content in the containerbody */
        container.appendChild(popupContent);
        
        

        var {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-map-pin" aria-hidden="true"></i>', 'Buffer');
        document.getElementById(containerID).appendChild(toolBtnContainer);
        toolBtn.onclick = () => {
			this.widgetPopup.appendChild(container);
            map.on('singleclick', handleClickBuffer);
		};
    }

    IdentifyFeatureToolWidget(map, containerID) {
        const identifyDefaultMessage = '<div style="padding:5px;">Select layer feature to get the information</div>';
        const container = cmjs.createPopupContainer();
        container.id = 'ol-extension-widget-identify-popup';

        const popupContent = cmjs.createPopupContent();

        popupContent.innerHTML = identifyDefaultMessage;


        const handleClick = function(event) {
            let viewResolution = map.getView().getResolution();
            let layers = map.getLayers().getArray();
            let allRequests = [];

            layers.forEach((layer) => {
                if (layer instanceof TileLayer) {
                    if (layer.get("title") && layer.get("title") != "BaseMap#OSM") {
                        let wmsSource = layer.getSource();
                        if (wmsSource.key_) {
                            let url = wmsSource.getFeatureInfoUrl(
                                event.coordinate,
                                viewResolution,
                                "EPSG:3857", {
                                    INFO_FORMAT: "application/json"
                                },
                            );

                            if (url) {
                                allRequests.push(
                                    fetch(url).then((response) => response.json()),
                                );
                            }
                        }
                    }
                }
            });

            Promise.all(allRequests)
                .then((responses) => {
                    let allFeatures = responses.flatMap(
                        (response) => response.features || [],
                    );

                    if (allFeatures && allFeatures.length) {
                        const resultTable = cmjs.createResultTable(allFeatures[0].properties);
                        popupContent.innerHTML = '';
                        popupContent.appendChild(resultTable);
                    } else {
                        popupContent.innerHTML = identifyDefaultMessage;
                    }
                })
                .catch((error) => console.error("Error fetching feature info:", error));
        };
        // map.on('singleclick', handleClick);

        const {
            popupHead,
            closeBtn
        } = cmjs.createPopupHeader('Identify Feature');
        container.appendChild(popupHead);
        container.appendChild(popupContent);

        closeBtn.onclick = () => {
            this.widgetPopup.removeChild(container);
            popupContent.innerHTML = identifyDefaultMessage;
            map.un('singleclick', handleClick);
        }

        let identifyContainer = container;
        var {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-info" aria-hidden="true"></i>', 'Info');
        document.getElementById(containerID).appendChild(toolBtnContainer);
        toolBtn.onclick = () => {
            this.widgetPopup.appendChild(identifyContainer);
            map.on('singleclick', handleClick);
        };
    }

    ZoomWidget(map, containerID) {
        var {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-plus" aria-hidden="true"></i>', 'Zoom In');
        toolBtn.onclick = () => map.getView().setZoom(map.getView().getZoom() + 1);
        document.getElementById(containerID).appendChild(toolBtnContainer);

        var {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-minus" aria-hidden="true"></i>', 'Zoom Out');
        toolBtn.onclick = () => map.getView().setZoom(map.getView().getZoom() - 1);
        document.getElementById(containerID).appendChild(toolBtnContainer);
    }

    GotoExtentWidget(map, containerID) {
        const {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-arrows-alt" aria-hidden="true"></i>', 'Goto Extent');
        toolBtn.onclick = () => {
            map.getView().setCenter(MAP_CONFIG.COORDINATES);
            map.getView().setZoom(MAP_CONFIG.ZOOM);
        }
        document.getElementById(containerID).appendChild(toolBtnContainer);
    }

    DragZoomIn(map, containerID){
        const container = cmjs.createPopupContainer();
        var {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-search-plus" aria-hidden="true"></i>', 'Drag Zoom In');
        toolBtn.onclick = () => {
            const zoomIn = new DragZoom({
                condition: always, // no modifier key
                out: false,        // zoom in
            });
            map.addInteraction(zoomIn);
        };
        document.getElementById(containerID).appendChild(toolBtnContainer);
    }

    DragZoomOut(map, containerID){
        var {
            toolBtnContainer,
            toolBtn
        } = cmjs.createToolBtn('<i class="fa fa-search-minus" aria-hidden="true"></i>', 'Drag Zoom Out');
        toolBtn.onclick = () => {
            const zoomIn = new DragZoom({
                condition: always, // no modifier key
                out: true,        // zoom in
            });
            map.addInteraction(zoomIn);
        };
        document.getElementById(containerID).appendChild(toolBtnContainer);
    }

    createPopupForWidget() {
        const widgetPopup = document.createElement('div');
        widgetPopup.className = 'ol-extension-widget-popup';
        widgetPopup.id = 'ol-extension-widget-popup';
        Object.assign(widgetPopup.style, {
            position: "absolute",
            top: "70px",
            right: "10px",
            padding: "10px",
            marginBottom: "10px",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            width: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
        });

        return widgetPopup;
    }

    


}