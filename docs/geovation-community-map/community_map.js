import { addMapFeatures } from "./community_map_functions.js";

const API_KEY = '9HtqvDpMDgOd32QLscDMi6AVIt5NZaMJ';

let tileServiceUrl = 'https://api.os.uk/maps/raster/v1/zxy';


// Create a map style object using the WMTS service.
let style = {
    'version': 8,
    'sources': {
        'raster-tiles': {
            'type': 'raster',
            'tiles':  [tileServiceUrl + '/Light_3857/{z}/{x}/{y}.png?key=' + API_KEY],
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

//create popup which can be removed when toggling the input
let popup = new mapboxgl.Popup({ className: 'popup', offset: 25 });



addMapFeatures(map, popup);
