
export { map, partners, fetchPartnerHubs, createPartnerHubMarkers, formatCursor, createMap }

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
let queryString = Object.keys(params).map(function (key) {
    return key + '=' + params[key];
}).join('&');

// Create a map style object using the WMTS service.
let style = {
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
};

// Initialize the map object.
let map = new mapboxgl.Map({
    container: 'map',
    minZoom: 7,
    maxZoom: 20,
    style: style,
    center: [-2.498094, 52.569447],
    zoom: 7
});

let partners;

//fetches json data for partner hubs
async function fetchPartnerHubs(partners) {
    partners = await fetch('partner_hubs.json');
    let json = await partners.json();
    let features = json.features;
    return features
}

function createPartnerHubMarkers(partnerHubs, map) {
    map.loadImage(
        'marker.png',
        function (error, image) {
            if (error) throw error;
            if (!map.getImage) {
                map.addImage('marker', image);
            }
            if (!map.getLayer('markers')) {
                map.addLayer({
                    'id': 'markers',
                    'type': 'symbol',
                    'source': {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': partnerHubs
                        }
                    },
                    'layout': {
                        'icon-image': 'marker',
                        'icon-size': 1
                    }
                });
            }
        }
    );
}

//fomat the cursor when hovering over a marker
function formatCursor(cursor, map) {
    map.getCanvas().style.cursor = cursor;
}

function createMap(map) {
    map.dragRotate.disable(); // Disable map rotation using right click + drag.
    map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

    // Add navigation control (excluding compass button) to the map.
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }));

    map.on('load', async function () {
        let partnerHubs = await fetchPartnerHubs(partners)
        createPartnerHubMarkers(partnerHubs, map)
        //toggle the checkbox to show/hide markers
        document.getElementById('markers').addEventListener('change', function (e) {
            map.setLayoutProperty(
                'markers',
                'visibility',
                e.target.checked ? 'visible' : 'none'
            );
        });
    });

    //create popup which can be removed when toggling the input
    let popup = new mapboxgl.Popup({ className: 'popup', offset: 25 });

    map.on('mouseenter', 'markers', function (e) {
        formatCursor('pointer', map);
        popup
            .setLngLat(e.features[0].geometry.coordinates)
            .setHTML(e.features[0].properties["Company Name"])
            .addTo(map);
    });

    map.on('mouseleave', 'markers', function (e) {
        formatCursor('', map);
        popup.remove();
    });
}


