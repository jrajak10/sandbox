const API_KEY = 'LMtM3BTwlwljPNGD77f81lrbsjBiKs52';

let serviceUrl = 'https://osdatahubapi.os.uk/OSMapsAPI/wmts/v1';

// Define parameters object.
let params = {
    key: API_KEY,
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
let queryString = Object.keys(params).map(function(key) {
    return key + '=' + params[key];
}).join('&');

// Create a map style object using the WMTS service.
let style = {
    'version': 8,
    'sources': {
        'raster-tiles': {
            'type': 'raster',
            'tiles': [ serviceUrl + '?' + queryString ],
            'tileSize': 256,
            'maxzoom': 20
        }
    },
    'layers': [{
        'id': 'os-maps-wmts',
        'type': 'raster',
        'source': 'raster-tiles'
    }]
};

// Initialize the map object.
let map = new mapboxgl.Map({
    container: 'map',
    minZoom: 7,
    maxZoom: 20,
    style: style,
    center: [ -2.498094, 52.569447],
    zoom: 7
});

map.dragRotate.disable(); // Disable map rotation using right click + drag.
map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

// Add navigation control (excluding compass button) to the map.
map.addControl(new mapboxgl.NavigationControl({
    showCompass: false
}));


let partners;
let features;

async function fetchPartnerHubs(partners){
    partners = await fetch('partner_hubs.json');
    let json = await partners.json();
    features = json.features;
    return features
}

async function createMarkers(features){
    features = await fetchPartnerHubs(partners);



    features.forEach(function(marker){
        new mapboxgl.Marker({color: "#f7a70a", id: 'marker'})
            .setLngLat(marker.geometry.coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 10 })
                .setHTML("Name: " + marker.properties["Company Name"]))
            .addTo(map);

    });
}
createMarkers(features)