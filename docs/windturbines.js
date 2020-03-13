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


// async function addTurbineMarkersToMap(feature) {
//   let element = document.createElement('div');
//   element.className = 'turbineMarker';

//   let centroid = turf.centroid(turf.polygon(feature.geometry.coordinates)).geometry.coordinates;
//   let radius = 5;
//   let options = {steps: 64, units: 'miles'};
//   let circle = turf.circle(centroid, radius, options);

  
//   element.addEventListener('click', function(){
  
//     let turbinegeojson = {
//       "type": "FeatureCollection",
//       "features": centroid
//     };

//       map.addLayer({
//         "id": "circle",
//         "type": "fill",
//         "source": {
//             "type": "geojson",
//             "data": turbinegeojson
//         },
//         "layout": {},
//         "paint": {
//             "fill-color": "#f80",
//             "fill-opacity": 0.5
//         }
//     });

//     map.getSource('circle').setData(circle);
//   });
  
//     new mapboxgl.Marker(element)
//                   .setLngLat(centroid)
//                   .setPopup(new mapboxgl.Popup({ offset: 10 })
//                   .setHTML('<p><br><p> Number of large woodland areas: ' +  
//                             '<p><br><p> Risk Level: '))
//                   .addTo(map)  
// }

 
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
  let uniqueTurbineArray = await getFeatures(bounds, 'Equal', 'DescriptiveTerm', 'Wind Turbine', 'Topography_TopographicArea');
  let uniqueWoodlandArray = await getFeatures(bounds, 'GreaterThanOrEqual', 'SHAPE_Area', '2500000', 'Zoomstack_Woodland');




  //create markers for turbines and shading woodland features when map loads
  // uniqueTurbineArray.forEach(addTurbineMarkersToMap);

  
  
  let turbineCentroids =[]
  uniqueTurbineArray.forEach(feature => turbineCentroids.push(turf.centroid(turf.polygon(feature.geometry.coordinates)).geometry.coordinates));

 

  

  

  let radius = 5;
  let options = {steps: 64, units: 'miles'};
  let turbineCircles = turbineCentroids.map(x => turf.circle(x, radius, options));
  let turbineIntersection =[]
  // let area = 0;
  

  

  


  turbineCentroids.forEach(function(centroid){
    let element = document.createElement('div');
    element.className = 'turbineMarker';
    let turbineCircle = turf.circle(centroid, radius, options);
    let area;

    element.addEventListener('click', function area(){
      let turbinegeojson = {
              "type": "FeatureCollection",
              "features": centroid
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
    let woodlandPolygons = [];
    for(let i=0; i<uniqueWoodlandArray.length; i++){
      woodlandPolygons.push(turf.polygon(uniqueWoodlandArray[i].geometry.coordinates));
    }
    
    let turbineIntersection =[];
    let intersection;
    for (let i=0; i<woodlandPolygons.length; i++){
      intersection = turf.intersect(woodlandPolygons[i], turbineCircle);
      if(intersection){
        turbineIntersection.push(intersection)
      }
    }

    area = turbineIntersection.map(x => turf.area(x)).reduce((x,y) => x+y)
    console.log(area)
    
    new mapboxgl.Marker(element)
                  .setLngLat(centroid)
                  .setPopup(new mapboxgl.Popup({ offset: 10 })
                  .setHTML('<p><br><p> Number of large woodland areas: ' + area 
                            + '<p><br><p> Risk Level: '))
                  .addTo(map)
  })
  
                  
                  
  // let largeTurbine = turbineCircles[268];


  // for (let i=0; i<woodlandPolygons.length; i++){
  //   let intersection = turf.intersect(woodlandPolygons[i], largeTurbine);
  //   if(intersection){

  //   z.push(turf.union(intersection, intersection))
  //   area += turf.area(turf.union(intersection));
  //   }
  // }

 
  //  console.log(z)
  // console.log(area)


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
  
  // Add event which will be triggered when the map has finshed moving (pan + zoom).
  // Implements a simple strategy to only request data when the map viewport invalidates
  // certain bounds.
  map.on('moveend', async function() {
    bounds2 = map.getBounds();
    bounds = bounds2;

    let bounds2TurbineArray = await getFeatures(bounds2, 'Equal', 'DescriptiveTerm', 'Wind Turbine', 'Topography_TopographicArea');
    let bounds2WoodlandArray = await getFeatures(bounds2, 'GreaterThanOrEqual', 'SHAPE_Area', '2500000', 'Zoomstack_Woodland');
    
    let newTurbineFeatures = await getNewFeatures(uniqueTurbineArray, bounds2TurbineArray);
    // newTurbineFeatures.forEach(addTurbineMarkersToMap);
    uniqueTurbineArray = uniqueTurbineArray.concat(newTurbineFeatures);

    


    uniqueWoodlandArray = uniqueWoodlandArray.concat(getNewFeatures(uniqueWoodlandArray,bounds2WoodlandArray));
    let totalWoodlandFeatures = {
      "type": "FeatureCollection",
      "features": uniqueWoodlandArray
      }

    map.getSource('woodland').setData(totalWoodlandFeatures); 
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