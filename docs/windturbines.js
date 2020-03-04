var apiKey = '5IYearA3dYe1guQqqmZC9HNcAOqfpEdn';

var serviceUrl = 'https://osdatahubapi.os.uk/OSMapsAPI/wmts/v1';

// Define (WMTS) parameters object.
var wmtsParams = {
  key: apiKey,
  service: 'WMTS',
  request: 'GetTile',
  version: '2.0.0',
  height: 256,
  width: 256,
  outputFormat: 'image/png',
  style: 'default',
  layer: 'Light_3857',
  tileMatrixSet: 'EPSG:3857',
  tileMatrix: '{z}',
  tileRow: '{y}',
  tileCol: '{x}'
};

// Construct query string parameters from object.
var queryString = Object.keys(wmtsParams).map(function(key) {
  return key + '=' + wmtsParams[key];
}).join('&');

// Create a map style object using the OS Maps API WMTS.
var style = {
  'version': 8,
  'sources': {
    'raster-tiles': {
      'type': 'raster',
      'tiles': [serviceUrl + '?' + queryString],
      'tileSize': 256,
      'maxzoom': 20
    }
  },
  'layers': [{
    'id': 'os-maps-wmts',
    'type': 'raster',
    'source': 'raster-tiles'
  }]
}

// Initialize the map object.
var map = new mapboxgl.Map({
  container: 'map',
  minZoom: 7,
  maxZoom: 20,
  style: style,
  center: [-4.408240, 55.684409],
  zoom: 11
});

map.dragRotate.disable(); // Disable map rotation using right click + drag.
map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

// Add navigation control (excluding compass button) to the map.
map.addControl(new mapboxgl.NavigationControl({
  showCompass: false
}));

// Add attribution control to the map.
map.addControl(new mapboxgl.AttributionControl({
  customAttribution: '&copy; Crown copyright and database rights ' + new Date().getFullYear() + ' Ordnance Survey.'
}));

function addTurbineMarkersToMap(feature) {
  new mapboxgl.Marker({color: "red"})
              .setLngLat(turf.centroid(turf.polygon(feature.geometry.coordinates)).geometry.coordinates)
              .setPopup(new mapboxgl.Popup({ offset: 25 })
              .setHTML('<p>' + feature.properties.OBJECTID + '<p>'))
              .addTo(map)
  }
  
  function addWoodlandMarkersToMap(feature) {
    new mapboxgl.Marker({color: "#0c0"})
        .setLngLat(feature.geometry.coordinates[0][0])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
        .setHTML('<p>' + feature.properties.SHAPE_Area.toFixed(2) + '<p>'))
        .addTo(map)
    }


// Add event which waits for the map to be loaded.
map.on('load', async function() {

  // Get the visible map bounds (BBOX).
  let bounds = map.getBounds();

  //array for bounds1 features - this will be the arrays with all unique features when the map moves
  let uniqueTurbineArray = await getTurbineFeatures(bounds, map);
  let uniqueWoodlandArray = await getWoodlandFeatures(bounds, map);

  //create markers for turbines and woodland features when map loads
  uniqueTurbineArray.forEach(addTurbineMarkersToMap);
  uniqueWoodlandArray.forEach(addWoodlandMarkersToMap);
  
  // Add event which will be triggered when the map has finshed moving (pan + zoom).
  // Implements a simple strategy to only request data when the map viewport invalidates
  // certain bounds.
  map.on('moveend', async function() {
    bounds2 = map.getBounds();
    bounds = bounds2;

    //Create a new array for features when map is moved. Filter out features which are already in the map, 
    //based on the OBJECTID, giving the new features only in a new turbines/woodland array.
    let bounds2TurbineArray = await getTurbineFeatures(bounds2, map);
    let uniqueTurbineIDs = uniqueTurbineArray.map(x => x.properties.OBJECTID);
    let newTurbinesArray = bounds2TurbineArray.filter(feature => !uniqueTurbineIDs.includes(feature.properties.OBJECTID));
    

    let bounds2WoodlandArray = await getWoodlandFeatures(bounds2, map);
    let uniqueWoodlandIDs = uniqueWoodlandArray.map(x => x.properties.OBJECTID);
    let newWoodlandArray = bounds2WoodlandArray.filter(feature => !uniqueWoodlandIDs.includes(feature.properties.OBJECTID));

    //Create markers for the new features after the map moves, then update the unique features array 
    //so the features won't load again.
    newTurbinesArray.forEach(addTurbineMarkersToMap);
    uniqueTurbineArray = uniqueTurbineArray.concat(newTurbinesArray);

    newWoodlandArray.forEach(addWoodlandMarkersToMap);
    uniqueWoodlandArray = uniqueWoodlandArray.concat(newWoodlandArray);
  });
});




 /**
  * Add Wind Turbine and Zoomstack_Woodland features from the WFS to the map
  * 
  // * @param {*} bounds 
  * 
  * @returns 
  */
async function getTurbineFeatures(bounds, map) {
  // Convert the bounds to a formatted string.
  var sw = bounds.getSouthWest().lng + ',' + bounds.getSouthWest().lat,
    ne = bounds.getNorthEast().lng + ',' + bounds.getNorthEast().lat;

  var coords = sw + ' ' + ne;
  // Create an OGC XML filter parameter value which will select the Wind Turbines
  // features (site function) intersecting the BBOX coordinates.
  var turbinexml = '<ogc:Filter>';
  turbinexml += '<ogc:And>';
  turbinexml += '<ogc:BBOX>';
  turbinexml += '<ogc:PropertyName>SHAPE</ogc:PropertyName>';
  turbinexml += '<gml:Box srsName="urn:ogc:def:crs:EPSG::4326">';
  turbinexml += '<gml:coordinates>' + coords + '</gml:coordinates>';
  turbinexml += '</gml:Box>';
  turbinexml += '</ogc:BBOX>';
  turbinexml += '<ogc:PropertyIsEqualTo>';
  turbinexml += '<ogc:PropertyName>DescriptiveTerm</ogc:PropertyName>';
  turbinexml += '<ogc:Literal>Wind Turbine</ogc:Literal>';
  turbinexml += '</ogc:PropertyIsEqualTo>';
  turbinexml += '</ogc:And>';
  turbinexml += '</ogc:Filter>';

  // Create an array of turbine features when more than 100 are on the map
  let startIndex = 0;
  let turbineLength = 0;
  let totalTurbineFeatures = [];
  do {
    let turbineParams = {
      key: apiKey,
      service: 'WFS',
      request: 'GetFeature',
      version: '2.0.0',
      typeNames: 'Topography_TopographicArea',
      outputFormat: 'GEOJSON',
      srsName: 'urn:ogc:def:crs:EPSG::4326',
      filter: turbinexml,
      startIndex: startIndex.toString(), 
      count: 100
    };
  
    let turbineUrl = getUrl(turbineParams);
    let response = await fetch(turbineUrl);
    let json = await response.json();
    let featureArray = json.features;
    turbineLength = featureArray.length;

    //push max 100 unique array entries at a time into a total turbine features array
    totalTurbineFeatures.push(featureArray)
    startIndex += turbineLength;     
  }
  
  while (turbineLength >= 100)
  return [].concat(...totalTurbineFeatures);
}

async function getWoodlandFeatures(bounds, map) {
  // Convert the bounds to a formatted string.
  var sw = bounds.getSouthWest().lng + ',' + bounds.getSouthWest().lat,
    ne = bounds.getNorthEast().lng + ',' + bounds.getNorthEast().lat;

  var coords = sw + ' ' + ne;
  // Create an OGC XML filter parameter value which will select the Woodland Features
  // features (site function) intersecting the BBOX coordinates.
  var woodlandxml = '<ogc:Filter>';
  woodlandxml += '<ogc:And>';
  woodlandxml += '<ogc:BBOX>';
  woodlandxml += '<ogc:PropertyName>SHAPE</ogc:PropertyName>';
  woodlandxml += '<gml:Box srsName="urn:ogc:def:crs:EPSG::4326">';
  woodlandxml += '<gml:coordinates>' + coords + '</gml:coordinates>';
  woodlandxml += '</gml:Box>';
  woodlandxml += '</ogc:BBOX>';
  woodlandxml += '<ogc:PropertyIsGreaterThanOrEqualTo>';
  woodlandxml += '<ogc:PropertyName>SHAPE_Area</ogc:PropertyName>';
  woodlandxml += '<ogc:Literal>2500000</ogc:Literal>';
  woodlandxml += '</ogc:PropertyIsGreaterThanOrEqualTo>';
  woodlandxml += '</ogc:And>';
  woodlandxml += '</ogc:Filter>';

  // Create an array of woodland features when more than 100 are on the map
  let startIndex = 0;
  let woodlandLength = 0;
  let totalWoodlandFeatures = [];
  do {
    let woodlandParams = {
      key: apiKey,
      service: 'WFS',
      request: 'GetFeature',
      version: '2.0.0',
      typeNames: 'Zoomstack_Woodland',
      outputFormat: 'GEOJSON',
      srsName: 'urn:ogc:def:crs:EPSG::4326',
      filter: woodlandxml,
      startIndex: startIndex.toString(), 
      count: 100
    };
  
    let woodlandUrl = getUrl(woodlandParams);
    let response = await fetch(woodlandUrl);
    let json = await response.json();
    let woodFeatureArray = json.features;
    woodlandLength = woodFeatureArray.length;

    //push max 100 unique array entries at a time into a total woodland features array
    totalWoodlandFeatures.push(woodFeatureArray)
    startIndex += woodlandLength;     
  }
  
  while (woodlandLength >= 100)
  return [].concat(...totalWoodlandFeatures);
}






/**
 * Return URL with encoded parameters.
 * @param {object} params - The parameters object to be encoded.
 */
function getUrl(params) {
  var encodedParameters = Object.keys(params)
    .map(paramName => paramName + '=' + encodeURI(params[paramName]))
    .join('&');

  return 'https://osdatahubapi.os.uk/OSFeaturesAPI/wfs/v1?' + encodedParameters;
}