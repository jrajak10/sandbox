export { partners, fetchPartnerHubs, createPartnerHubMarkers, formatCursor, addMapFeatures }
<<<<<<< HEAD:docs/Geovation Community Map/community_map_functions.js
=======

let partners;

//fetches json data for partner hubs
async function fetchPartnerHubs(partners) {
    partners = await fetch('partner_hubs.json');
    let json = await partners.json();
    let features = json.features;
    return features
}
>>>>>>> a0478d7a38ffd0f0e20f2404aa2ecde68fcb4b46:Geovation Community Map/community_map_functions.js

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

<<<<<<< HEAD:docs/Geovation Community Map/community_map_functions.js
//function that formats the cursor when hovering over a marker
=======
//fomat the cursor when hovering over a marker
>>>>>>> a0478d7a38ffd0f0e20f2404aa2ecde68fcb4b46:Geovation Community Map/community_map_functions.js
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
<<<<<<< HEAD:docs/Geovation Community Map/community_map_functions.js

    //create popup which can be removed when toggling the input
    let popup = new mapboxgl.Popup({ className: 'popup', offset: 25 });

=======

    //create popup which can be removed when toggling the input
    let popup = new mapboxgl.Popup({ className: 'popup', offset: 25 });

>>>>>>> a0478d7a38ffd0f0e20f2404aa2ecde68fcb4b46:Geovation Community Map/community_map_functions.js
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
<<<<<<< HEAD:docs/Geovation Community Map/community_map_functions.js
}
=======
}


>>>>>>> a0478d7a38ffd0f0e20f2404aa2ecde68fcb4b46:Geovation Community Map/community_map_functions.js
