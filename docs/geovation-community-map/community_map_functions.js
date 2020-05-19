export { fetchData, createMarkers, formatCursor, addMapFeatures }

//fetches json data from json files
async function fetchData(data) {
    let fetchedData = await fetch(data);
    let json = await fetchedData.json();
    let features = json.features;
    return features
}

//Creates Partner Hub Markers, loading them on the map
function createMarkers(fetchedData, map, imageName, id, file) {
    map.loadImage(
        file,
        function (error, image) {
            if (error) throw error;
            if (!map.getImage) {
                map.addImage(imageName, image);
            }
            if (!map.getLayer(id)) {
                map.addLayer({
                    'id': id,
                    'type': 'symbol',
                    'source': {
                        'type': 'geojson',
                        'data': {
                            'type': 'FeatureCollection',
                            'features': fetchedData
                        }
                    },
                    'layout': {
                        'icon-image': imageName,
                        'icon-size': 1,
                        'icon-allow-overlap': true
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

//create popup which can be removed when toggling the input
let popup = new mapboxgl.Popup({ className: 'popup', offset: 25 });

// adds popup when mouse hovers over marker
function addPopup(map, marker, popup){
    map.on('mouseenter', marker, function (e) {
        formatCursor('pointer', map);
        popup
            .setLngLat(e.features[0].geometry.coordinates)
            .setHTML(e.features[0].properties["Company Name"])
            .addTo(map);
    });
}

//remvoes popup when mouse leaves marker
function removePopup(map, marker, popup){
    map.on('mouseleave', marker, function (e) {
        formatCursor('', map);
        popup.remove();
    });
}
    
//toggle the checkbox to show/hide markers
function toggleInput(id, map) {
    document.getElementById(id).addEventListener('change', function (e) {
        map.setLayoutProperty(
            id,
            'visibility',
            e.target.checked ? 'visible' : 'none'
        );
    });
};

function addMapFeatures(map) {
    map.dragRotate.disable(); // Disable map rotation using right click + drag.
    map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

    // Add navigation control (excluding compass button) to the map.
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }));

    map.on('load', async function () {
        let partnerHubs = await fetchData('partner_hubs.json');
        let sponsors = await fetchData('sponsors.json');
        let stakeholders = await fetchData('stakeholders.json');
       
        createMarkers(partnerHubs, map, 'partner-hub-markers', 'partner-hub-markers', 'partner_hubs_marker.png')
        createMarkers(sponsors, map, 'sponsor-markers','sponsor-markers', 'sponsors_marker.png')
        createMarkers(stakeholders, map, 'stakeholder-markers', 'stakeholder-markers', 'stakeholder_marker.png')

        toggleInput('partner-hub-markers', map);
        toggleInput('sponsor-markers', map)
        toggleInput('stakeholder-markers', map)     
    });

    addPopup(map, 'partner-hub-markers', popup)
    addPopup(map, 'sponsor-markers', popup)
    addPopup(map, 'stakeholder-markers', popup)

    removePopup(map, 'partner-hub-markers', popup)
    removePopup(map, 'sponsor-markers', popup)
    removePopup(map, 'stakeholder-markers', popup)
}
