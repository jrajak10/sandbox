export { partners, fetchPartnerHubs, createPartnerHubMarkers, formatCursor, addMapFeatures }

let partners;

//fetches json data for partner hubs
async function fetchPartnerHubs(partners) {
    partners = await fetch('partner_hubs.json');
    let json = await partners.json();
    let features = json.features;
    return features
}

//Creates Partner Hub Markers, loading them on the map
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

//function that formats the cursor when hovering over a marker
function formatCursor(cursor, map) {
    map.getCanvas().style.cursor = cursor;
}

function addMapFeatures(map) {
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
