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

 
function getNewFeatures(loadedFeatureArray, movedFeatureArray){
  let totalFeaturesIDs = loadedFeatureArray.map(x => x.properties.OBJECTID);
  let newFeaturesArray = movedFeatureArray.filter(feature => !totalFeaturesIDs.includes(feature.properties.OBJECTID));
  return newFeaturesArray;
}


// Add event which waits for the map to be loaded.
map.on('load', async function() {

  // Get the visible map bounds (BBOX).
  let bounds = map.getBounds();

  //array for bounds1 features - this will be the arrays with all unique features when the map moves
  //filters out areas less than 2500000m^2 and 100000m^2 for Woodland and Surfacewater features as they nest in larger areas.
  let smallWoodlandAreas = 2500000;
  let smallWaterAreas = 100000

  let uniqueTurbineArray = await getFeatures(bounds, 'Equal', 'DescriptiveTerm', 'Wind Turbine', 'Topography_TopographicArea');
  let uniqueWoodlandArray = await getFeatures(bounds, 'GreaterThanOrEqual', 'SHAPE_Area', smallWoodlandAreas, 'Zoomstack_Woodland');
  let uniqueWaterArray = await getFeatures(bounds, 'GreaterThanOrEqual', 'SHAPE_Area', smallWaterAreas, 'Zoomstack_Surfacewater');

  //create markers for turbines and shading woodland features when map loads
  let turbineCentroids =[]
  
  for (let i=0; i< uniqueTurbineArray.length; i++){
    turbineCentroids.push(turf.centroid(turf.polygon(uniqueTurbineArray[i].geometry.coordinates)).geometry.coordinates)
  }

  
  
  function addTurbineMarkersToMap(centroids, woodlandArray, waterArray){
    for(let i=0; i<centroids.length; i++){
      let element = document.createElement('div');
      element.className = 'turbineMarker';
      
      let radius = 5;
      let options = {steps: 64, units: 'miles'};
      let turbineCircle = turf.circle(centroids[i], radius, options);
      let woodlandArea = 0
      let woodlandAreaMiles2=0;
      let woodRisk;
      let waterArea = 0;
      let waterAreaMiles2=0;
      let waterRisk;
      let riskScore = 0;
      let overallRisk;
  
      element.addEventListener('click', function(){
        let turbinegeojson = {
                "type": "FeatureCollection",
                "features": centroids[i]
              };
          
                map.addLayer({
                  "id": "circle",
                  "type": "fill",
                  "source": {
                      "type": "geojson",
                      "data": turbinegeojson
                  },
                  "layout": {},
                  "paint": {
                      "fill-color": "#f80",
                      "fill-opacity": 0.5
                  }
              });
          
              map.getSource('circle').setData(turbineCircle);
      });

      //polygonise the woodland array so it can be read by turf.js
      let woodlandPolygons = woodlandArray.map(x => x.geometry.coordinates);
      woodlandPolygons = woodlandPolygons.map(x => turf.polygon(x));

      let waterPolygons = waterArray.map(x => x.geometry.coordinates);
      waterPolygons = waterPolygons.map(x => turf.polygon(x));
      
      let woodlandIntersection;
      for (let i=0; i<woodlandPolygons.length; i++){
        woodlandIntersection = turf.intersect(woodlandPolygons[i], turbineCircle);
        if(woodlandIntersection){
          woodlandArea += turf.area(turf.unkinkPolygon(turf.rewind(woodlandIntersection)));
          woodlandAreaMiles2 = turf.convertArea(woodlandArea, 'metres', 'miles');
          }
      }
      
      let waterIntersection;
      for (let i=0; i<waterPolygons.length; i++){
        waterIntersection = turf.intersect(waterPolygons[i], turbineCircle);
        if(waterIntersection){
          waterArea += turf.area(waterIntersection);
          waterAreaMiles2 = turf.convertArea(waterArea, 'metres', 'miles')
          }
          
      }

      //Analysing the data, I created a risk level based on the bounds for the area.
      //Added a risk score to each risk level.
      let lowWoodlandAreaBound = 10;
      let mediumWoodlandAreaBound = 35;

      if(woodlandAreaMiles2 < lowWoodlandAreaBound){
        woodRisk = "Low";
        riskScore += 0;
      }
      else if(woodlandAreaMiles2 >=lowWoodlandAreaBound && woodlandAreaMiles2 < mediumWoodlandAreaBound){
        woodRisk = "Medium";
        riskScore += 1;
      }
      else{
        woodRisk = "High";
        riskScore += 2;
      }

      //Analysing the data, I created a risk level based on the bounds for the area.
      //Added a risk score to each risk level.
      let lowWaterAreaBound = 0.5;
      let mediumWaterAreaBound = 1.25;
      if(waterAreaMiles2 < lowWaterAreaBound){
        waterRisk = "Low";
        riskScore += 0;
      }
      else if(waterAreaMiles2 >=lowWaterAreaBound && waterAreaMiles2 < mediumWaterAreaBound){
        waterRisk = "Medium";
        riskScore += 1;
      }
      else{
        waterRisk = "High";
        riskScore += 2;
      }

      //Combined the risk scores from the woodland and surfacte water risk scores
      //to give an overall risk score for the birds. 
      if(riskScore < 2){
        overallRisk = "Low";
        element.style.backgroundImage = "url('windturbineicongreen.png')";
      }
      else if(riskScore >=2 && riskScore < 3){
        overallRisk = "Medium";
        element.style.backgroundImage = "url('windturbineiconyellow.png')";
      }
      else{
        overallRisk = "High";
        element.style.backgroundImage = "url('windturbineiconred.png')";
      }

      new mapboxgl.Marker(element)
                    .setLngLat(centroids[i])
                    .setPopup(new mapboxgl.Popup({ offset: 10 })
                    .setHTML('<p><br><p> Total woodland area: ' + woodlandAreaMiles2.toFixed(2) + " miles<sup>2</sup>"
                              + '<p><br><p> Risk Level to woodland birds: ' + woodRisk
                              + '<p><br><p> Total surfacewater area: ' + waterAreaMiles2.toFixed(2) + " miles<sup>2</sup>"
                              + '<p><br><p> Risk Level to water birds: ' + waterRisk
                              + '<p><br><p><b> Overall Risk: '+ overallRisk +"</b>"))
                    .addTo(map)
    };
  }

  addTurbineMarkersToMap(turbineCentroids, uniqueWoodlandArray, uniqueWaterArray);

       
  map.addLayer({
    "id": "woodland",
    "type": "fill",
    "source": {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": uniqueWoodlandArray
      }
    },
    "layout": {},
    "paint": {
      "fill-color": "#0c0",
      "fill-opacity": 0.8
    }
  });

  map.addLayer({
    "id": "water",
    "type": "fill",
    "source": {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": uniqueWaterArray
      }
    },
    "layout": {},
    "paint": {
      "fill-color": "#00FFFF",
      "fill-opacity": 0.8
    }
  });
  
  // Add event which will be triggered when the map has finshed moving (pan + zoom).
  // Implements a simple strategy to only request data when the map viewport invalidates
  // certain bounds.
  map.on('moveend', async function() {
    bounds2 = map.getBounds();
    bounds = bounds2;

    let bounds2TurbineArray = await getFeatures(bounds2, 'Equal', 'DescriptiveTerm', 'Wind Turbine', 'Topography_TopographicArea');
    let bounds2WoodlandArray = await getFeatures(bounds2, 'GreaterThanOrEqual', 'SHAPE_Area', smallWoodlandAreas, 'Zoomstack_Woodland');
    let bounds2WaterArray = await getFeatures(bounds2, 'GreaterThanOrEqual', 'SHAPE_Area', smallWaterAreas, 'Zoomstack_Surfacewater');
    
    let newTurbineFeatures = await getNewFeatures(uniqueTurbineArray, bounds2TurbineArray);

    let newTurbineCentroids = [];
    for (let i=0; i< newTurbineFeatures.length; i++){
      newTurbineCentroids.push(turf.centroid(turf.polygon(newTurbineFeatures[i].geometry.coordinates)).geometry.coordinates)
    }


    uniqueTurbineArray = uniqueTurbineArray.concat(newTurbineFeatures);


    uniqueWoodlandArray = uniqueWoodlandArray.concat(getNewFeatures(uniqueWoodlandArray,bounds2WoodlandArray));
    let totalWoodlandFeatures = {
      "type": "FeatureCollection",
      "features": uniqueWoodlandArray
      }

    uniqueWaterArray = uniqueWaterArray.concat(getNewFeatures(uniqueWaterArray, bounds2WaterArray));
    let totalWaterFeatures = {
      "type": "FeatureCollection",
      "features": uniqueWaterArray
    }

    map.getSource('woodland').setData(totalWoodlandFeatures); 
    map.getSource('water').setData(totalWaterFeatures); 
    addTurbineMarkersToMap(newTurbineCentroids, uniqueWoodlandArray, uniqueWaterArray);
  });
});


 /**
  * Add Wind Turbine and Zoomstack_Woodland features from the WFS to the map
  * 
  // * @param {*} bounds 
  * 
  * @returns 
  */
async function getFeatures(bounds, comparison, propName, literal, typeName) {
  // Convert the bounds to a formatted string.
  var sw = bounds.getSouthWest().lng + ',' + bounds.getSouthWest().lat,
    ne = bounds.getNorthEast().lng + ',' + bounds.getNorthEast().lat;

  var coords = sw + ' ' + ne;
  // Create an OGC XML filter parameter value which will select the
  // features (site function) intersecting the BBOX coordinates.
  var xml = '<ogc:Filter>';
  xml += '<ogc:And>';
  xml += '<ogc:BBOX>';
  xml += '<ogc:PropertyName>SHAPE</ogc:PropertyName>';
  xml += '<gml:Box srsName="urn:ogc:def:crs:EPSG::4326">';
  xml += '<gml:coordinates>' + coords + '</gml:coordinates>';
  xml += '</gml:Box>';
  xml += '</ogc:BBOX>';
  xml += '<ogc:PropertyIs'+ comparison +'To>';
  xml += '<ogc:PropertyName>'+ propName +'</ogc:PropertyName>';
  xml += '<ogc:Literal>'+ literal +'</ogc:Literal>';
  xml += '</ogc:PropertyIs'+ comparison +'To>';
  xml += '</ogc:And>';
  xml += '</ogc:Filter>';

  // Create an array of features when more than 100 are on the map
  let startIndex = 0;
  let featureLength = 0;
  let totalFeatures = [];
  do {
    let params = {
      key: apiKey,
      service: 'WFS',
      request: 'GetFeature',
      version: '2.0.0',
      typeNames: typeName,
      outputFormat: 'GEOJSON',
      srsName: 'urn:ogc:def:crs:EPSG::4326',
      filter: xml,
      startIndex: startIndex.toString(), 
      count: 100
    };
  
    let featureUrl = getUrl(params);
    let response = await fetch(featureUrl);
    let json = await response.json();
    let featureArray = json.features;
    featureLength = featureArray.length;

    //push max 100 unique array entries at a time into a total features array
    totalFeatures.push(featureArray)
    startIndex += featureLength;     
  }
  
  while (featureLength >= 100)
  return [].concat(...totalFeatures);
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