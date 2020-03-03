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

// Add event which waits for the map to be loaded.
map.on('load', async function() {
  
  // Get the visible map bounds (BBOX).
  let bounds = map.getBounds();

  //array for bounds1 turbine features - this will be the arrays with all unique turbines when the map moves
  let uniqueTurbineArray = await getTurbineFeatures(bounds, map);
  //create markers for turbines when map loads
  uniqueTurbineArray.forEach(function(feature) {
    new mapboxgl.Marker({color: "red"})
        .setLngLat(feature.geometry.coordinates[0][0])
        .setPopup(new mapboxgl.Popup({ offset: 25 })
        .setHTML('<p>' + feature.properties.OBJECTID + '<p>'))
        .addTo(map)
    });
  

  
  // Add event which will be triggered when the map has finshed moving (pan + zoom).
  // Implements a simple strategy to only request data when the map viewport invalidates
  // certain bounds.
  map.on('moveend', async function() {
    bounds2 = map.getBounds();
    bounds = bounds2;

    //Create a new array for features when map is moved. Filter out features which are already in the map, 
    //based on the OBJECTID, giving the new features only in a new turbines array.
    let bounds2TurbineArray = await getTurbineFeatures(bounds2, map);
    let uniqueTurbineIDs = uniqueTurbineArray.map(x => x.properties.OBJECTID);
    let newTurbinesArray = bounds2TurbineArray.filter(feature => !uniqueTurbineIDs.includes(feature.properties.OBJECTID));
    
    //Create markers for the new features after the map moves, then update the unique turbine array 
    //so the features won't load again.
    newTurbinesArray.forEach(function(feature) {
      new mapboxgl.Marker({color: "#0c0"})
          .setLngLat(feature.geometry.coordinates[0][0])
          .setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML('<p>' + feature.properties.OBJECTID + '<p>'))
          .addTo(map)
      });
    uniqueTurbineArray = uniqueTurbineArray.concat(newTurbinesArray);

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
  var xml = '<ogc:Filter>';
  xml += '<ogc:And>';
  xml += '<ogc:BBOX>';
  xml += '<ogc:PropertyName>SHAPE</ogc:PropertyName>';
  xml += '<gml:Box srsName="urn:ogc:def:crs:EPSG::4326">';
  xml += '<gml:coordinates>' + coords + '</gml:coordinates>';
  xml += '</gml:Box>';
  xml += '</ogc:BBOX>';
  xml += '<ogc:PropertyIsEqualTo>';
  xml += '<ogc:PropertyName>DescriptiveTerm</ogc:PropertyName>';
  xml += '<ogc:Literal>Wind Turbine</ogc:Literal>';
  xml += '</ogc:PropertyIsEqualTo>';
  xml += '</ogc:And>';
  xml += '</ogc:Filter>';

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
      filter: xml,
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
  return totalTurbineFeatures.reduce((acc, val) => acc.concat(val), []);
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
