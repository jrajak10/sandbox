import { addMapFeatures } from "./community_map_functions.js";

const API_KEY = '8ethzVGN9T27lVBclrwYIobHbl2Xe1SL';

let vectorUrl = 'https://api.os.uk/maps/vector/v1/vts';


let bounds = [[-22.79042, 49.60878], //southwest coordinates of basemap range
            [12.878297, 61.127404]] //northeast coordinates of basemap range

// Initialize the map object.
let map = new mapboxgl.Map({
        container: 'map',
        minZoom: 5,
        maxZoom: 12,
        style: vectorUrl + '/resources/styles?key=' + API_KEY,
        center: [-3.3557395, 54.8353492],
        zoom: 5,
        maxBounds: bounds,
        transformRequest: url => {
            if(! /[?&]key=/.test(url) ) url += '?key=' + API_KEY
            return {
                url: url + '&srs=3857'
            }
        }
    });

//create popup which can be removed when toggling the input
let popup = new mapboxgl.Popup({ className: 'popup', offset: 25});

addMapFeatures(map, popup);
