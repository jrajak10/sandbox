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

function countUniqueCounties(data){
    let object = {}

    for(let i=0; i<data.length; i++){
        if (object[data[i]["County"]] > 0){
            object[data[i]["County"]]++
        }
        else{
            object[data[i]["County"]] = 1
        }
    }
    return object;
}

/**
 * 
 * @param {*Object[]} countyPolygons 
 * @param {*Object} recipientsCount 
 */
function calculateCountyColors(countyPolygons, recipientsCount) {
    let allCounties = _.map(_.uniqBy(countyPolygons, 'properties.NAME'));
    let countyColors = [];
    let color = "#FFF";

    for (let county in allCounties) {
        let countyName = allCounties[county].properties["NAME"];
        let recipientsInCounty = recipientsCount[countyName];
        if (!recipientsInCounty) {
            color = "#FFF";
        }
        else {
            color = recipientsInCounty <= 2 ? "#d3e8d3" : "#228b22";
        }
        countyColors.push(countyName, color);
    }
    //default value
    countyColors.push("#000");
    return countyColors;
}

function addCountiesOutline(map, countyPolygons){
    map.addLayer({
        'id': 'counties-outline',
        'type': 'line',
        'source': {
            'type': 'geojson',
            'data': {
                "type": "FeatureCollection",
                "features": countyPolygons
            }
        },
        'paint': {
            'line-color': '#000',
            'line-width': 1
        }
    });
}

function addChoroplethLayer(map, id, expression, countyPolygons){
    map.addLayer({
        "id": id,
        "type": "fill",
        "source": {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": countyPolygons
            }
        },
        "layout": {},
        "paint": {
            "fill-color": expression,
            "fill-opacity": 0.8
        }
    });
}

//returns information about the county, and number of recipients at the bottom of the information box
function addRecipientsInformation(map, recipientsCount) {
    map.on('click', 'recipients', function (e) {
        let recipientsTotal = recipientsCount[e.features[0].properties["NAME"]]
        //make recipientsTotal return a value, else it will return 'undefined'
        if (!recipientsTotal) {
            recipientsTotal = 0;
        }
        document.getElementById('onclick-information').innerHTML = "County: " + e.features[0].properties["NAME"]
            + "<br> Number of Recipients: " + recipientsTotal;
    });
}

function addMapFeatures(map, popup) {
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
        //Fetches the polygons of all the UK counties. 
        let countyPolygons = await fetchData('counties.json');
        let recipients = await fetchData('geovation_recipients.json');
        let recipientsCount = countUniqueCounties(recipients);
        
        // expression gives the colours for the map based on its value
        let expression = ['match', ['get', 'NAME']];
        let countyColors = (calculateCountyColors(countyPolygons, recipientsCount));
        expression = expression.concat(countyColors)

        addChoroplethLayer(map, 'recipients', expression, countyPolygons);
        addCountiesOutline(map, countyPolygons);
        addRecipientsInformation(map, recipientsCount);

        createMarkers(partnerHubs, map, 'partner-hub-markers', 'partner-hub-markers', 'partner_hubs_marker.png')
        createMarkers(sponsors, map, 'sponsor-markers', 'sponsor-markers', 'sponsors_marker.png')
        createMarkers(stakeholders, map, 'stakeholder-markers', 'stakeholder-markers', 'stakeholder_marker.png')

        toggleInput('partner-hub-markers', map);
        toggleInput('sponsor-markers', map)
        toggleInput('stakeholder-markers', map);
        toggleInput('recipients', map);
    });

    addPopup(map, 'partner-hub-markers', popup)
    addPopup(map, 'sponsor-markers', popup)
    addPopup(map, 'stakeholder-markers', popup)

    removePopup(map, 'partner-hub-markers', popup)
    removePopup(map, 'sponsor-markers', popup)
    removePopup(map, 'stakeholder-markers', popup)
}
