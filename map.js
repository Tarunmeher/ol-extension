import { MapWidget } from './lib/MapWidget.js';
import {MAP_CONFIG} from './lib/config/MapConfig.js';
import { OlExtension } from "./lib/olExtension.js";

const mapWidget = new MapWidget();
const map = mapWidget.createMap(MAP_CONFIG.COORDINATES, MAP_CONFIG.ZOOM, true);
mapWidget.addGroupLayers(
	MAP_CONFIG.GROUP_LAYERS, 
	MAP_CONFIG.GEOSERVER_URL, 
	MAP_CONFIG.WORKSPACE, 
	map);
mapWidget.addWMSLayers(
	MAP_CONFIG.WMS_LAYERS, 
	MAP_CONFIG.GEOSERVER_URL, 
	MAP_CONFIG.WORKSPACE, 
	map);
mapWidget.addWFSLayers(
	MAP_CONFIG.WFS_LAYERS, 
	MAP_CONFIG.GEOSERVER_URL, 
	MAP_CONFIG.WORKSPACE, 
	map);
    
const olExt = new OlExtension();
setTimeout( () => {
	olExt.ZoomWidget(map, 'widgets-container');
	olExt.DragZoomIn(map, 'widgets-container');
	olExt.DragZoomOut(map, 'widgets-container');
	olExt.GotoExtentWidget(map, 'widgets-container');
	olExt.TOCWidget(map, 'widgets-container');
	olExt.MeasurementToolWidget(map, 'widgets-container');
	olExt.IdentifyFeatureToolWidget(map, 'widgets-container');
	olExt.createBufferWidget(map, 'widgets-container');
}, 1500);
