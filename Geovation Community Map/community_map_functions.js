// Initialize the map object.
let map = new mapboxgl.Map({
    container: 'map',
    minZoom: 7,
    maxZoom: 20,
    style: style,
    center: [ -2.498094, 52.569447],
    zoom: 7
});

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

function formatCursor(cursor, map){
    map.getCanvas().style.cursor = cursor; 
}

let popup = new mapboxgl.Popup({ className: 'popup', offset: 25 });

function createMap(map){
    map.dragRotate.disable(); // Disable map rotation using right click + drag.
    map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

    // Add navigation control (excluding compass button) to the map.
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }));

    map.on('load', async function () {
        let partnerHubs = await fetchPartnerHubs(partners)
        createPartnerHubMarkers(partnerHubs, map)
        document.getElementById('markers').addEventListener('change', function (e) {
            map.setLayoutProperty(
                'markers',
                'visibility',
                e.target.checked ? 'visible' : 'none'
            );
        });  
    });    

    map.on('mouseenter', 'markers', function(e){
        formatCursor('pointer', map);
        popup
            .setLngLat(e.features[0].geometry.coordinates)
            .setHTML(e.features[0].properties["Company Name"])
            .addTo(map);   
    });
    
    map.on('mouseleave', 'markers', function(e){
        formatCursor('', map);
        popup.remove();   
    });
}


createMap(map);
