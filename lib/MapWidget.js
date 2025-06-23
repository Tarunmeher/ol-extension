import Map from 'https://esm.sh/ol/Map';
import View from 'https://esm.sh/ol/View';
import TileLayer from 'https://esm.sh/ol/layer/Tile';
import {OSM, TileWMS} from 'https://esm.sh/ol/source';
import GeoJSON from 'https://esm.sh/ol/format/GeoJSON';

import VectorLayer from "https://esm.sh/ol/layer/Vector";
import VectorSource from "https://esm.sh/ol/source/Vector";

export class MapWidget {
	constructor() {
		this.map = null;
	}

	/**
		* Author : Tarun Meher
		* Method Name : createMap()
		* Definition : Initialize Map in the application with provided params (coordinates, zoom and visibility)
		* @param {*} coords Coordinates of the Map
		* @param {*} zoom Initial Zoom of the Map
		* @param {*} visibility Visibility Of the Map (default=true)
		* @returns Returns Map object
		*/
	createMap(coords, zoom, visibility=true) {
		this.map = new Map({
			target: 'map',
			layers: [
				new TileLayer({
					title:"BaseMap#OSM",
					source: new OSM(),
					visible:visibility
				})
			],
			view: new View({
				center: coords,
				zoom: zoom
			})
		});

		return this.map;
	}

	/**
		* Author : Tarun Meher
		* Method Name : addGroupLayers()
		* Definition : Add Grouplayers in the application, User Provides the array of group layers object,
			The method fetches each of the grouplayers information and create WMS Tile layer
		* @param {*} groupLayers Array of grouplayers object
		* @param {*} url url of the Geoserver
		* @param {*} workspace Workspace name of the Application and the layers are published in
		* @param {*} map Map Object
		*/
	addGroupLayers(groupLayers, url, workspace, map) {
		if (groupLayers.length > 0) {
			groupLayers.forEach(function(element, index) {
				if (element.type == "GroupLayer") {
					fetch( url + "rest/workspaces/" + workspace + "/layergroups/" + element.layer + ".json")
						.then((response) => response.json()) // Convert response to JSON
						.then((data) => {
							for (let i = 0; i < data.layerGroup.publishables.published.length; i++) {
								let layer = new TileLayer({
									title: element.layer +"#" +data.layerGroup.publishables.published[i].name.split(":")[1],
									source: new TileWMS({
										url: url + "wms",
										params: {
											LAYERS: data.layerGroup.publishables.published[i].name,
											TILED: true,
										},
									}),
								});
								map.addLayer(layer);
							}
						}) // Handle data
						.catch((error) => console.error("Error:", error)); // Handle errors
				}
			});
		}
	}

	/**
		* Author : Tarun Meher
		* Method Name : addWMSLayers()
		* Definition : Create WMS Layers by looping the wmslayers array object
		* @param {*} wmslayers Array of wmslayers object
		* @param {*} url url of the Geoserver
		* @param {*} workspace Workspace name of the Application and the layers are published in
		* @param {*} map Map Object
		*/
	addWMSLayers(wmslayers, url, workspace, map){
		if(wmslayers.length){
			for (let i = 0; i < wmslayers.length; i++) {
				let layer = new TileLayer({
					title: "WMS#"+wmslayers[i].displayname,
					source: new TileWMS({
						url: url + "wms",
						params: {
							LAYERS: `${workspace}:${wmslayers[i].layer}`,
							TILED: true,
						},
					}),
				});
				map.addLayer(layer);
			}
		}
	}


	/**
		* Author : Tarun Meher
		* Method Name : addWFSLayers()
		* Definition : Create WFS Layers by looping the wfslayers array object
		* @param {*} wfslayers Array of wfslayers object
		* @param {*} url url of the Geoserver
		* @param {*} workspace Workspace name of the Application and the layers are published in
		* @param {*} map Map Object
		*/
	addWFSLayers(wfslayers, url, workspace, map){
		if(wfslayers.length){
			for (let i = 0; i < wfslayers.length; i++) {
				let layer = new VectorLayer({
					title: "WFS#"+wfslayers[i].displayname,
					source: new VectorSource({
						url: url + `ows?service=WFS&version=1.1.0&request=GetFeature&typeName=${workspace}:${wfslayers[i].layer}&outputFormat=application/json`,
						format: new GeoJSON()
					})
				});
				map.addLayer(layer);
			}
		}
	}
}
