
    var apiKey = '5IYearA3dYe1guQqqmZC9HNcAOqfpEdn';

    var wfsServiceUrl = 'https://osdatahubapi.os.uk/OSFeaturesAPI/wfs/v1',
        tileServiceUrl = 'https://osdatahubapi.os.uk/OSMapsAPI/wmts/v1';

    // Create a map style object using the OS Maps API WMTS service.
    var params = {
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

    var queryString = Object.keys(params).map(function(key) {
        return key + '=' + params[key];
    }).join('&');

    var style = {
        'version': 8,
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': [ tileServiceUrl + '?' + queryString ],
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
    var map = new mapboxgl.Map({
        container: 'map',
        minZoom: 9,
        maxZoom: 15,
        style: style,
        center: [-1.898575, 52.489471],
        zoom: 13
    });

    map.dragRotate.disable(); // Disable map rotation using right click + drag.
    map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

    // Add navigation control (excluding compass button) to the map.
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }));

    function getNewFeatures(loadedFeatureArray, movedFeatureArray){
        let totalFeaturesIDs = loadedFeatureArray.map(x => x.properties.OBJECTID);
        let newFeaturesArray = movedFeatureArray.filter(feature => !totalFeaturesIDs.includes(feature.properties.OBJECTID));
        return newFeaturesArray;
        }
        let responsibleAuthorities = [
            {
                "Name": "Birmingham",
                "center": [-1.898575, 52.489471]
            },
            {
                "Name": "Surrey",
                "center": [-0.580217, 51.236944]
            }, 
            {
                "Name": "Hampshire",
                "center": [-1.309977, 51.062196]
            },
            {
                "Name": "Essex",
                "center": [0.473472, 51.733467]
            }, 
            {
                "Name": "Hertfordshire",
                "center": [-0.207689, 51.805412]
            },
            {
                "Name": "Kent",
                "center": [0.522306, 51.271499]
            },
            {
                "Name": "Lancashire",
                "center": [-2.705225, 53.757385]
            },
            {
                "Name": "Sheffield",
                "center": [-1.4765833, 53.381783]
            },
            
            {
                "Name": "Brent",
                "center": [-0.276161, 51.555659]
            },
            {
                "Name": "Cumbria",
                "center": [-2.761999, 54.653181]
            }
            ]

    // Add event whicxh waits for the map to be loaded.
    map.on('load', async function() {
        
        // Get the visible map bounds (BBOX).
        var bounds = map.getBounds();

        
                                 
        for(let i=0; i<responsibleAuthorities.length; i++){
            let newOption = document.createElement("option");
            let newContent = document.createTextNode([i+ 1] + '. ' + responsibleAuthorities[i].Name);
            newOption.appendChild(newContent);
            let selectDiv = document.getElementById("area-select");
            selectDiv.appendChild(newOption)
        }
       
        document.getElementById("area-select").addEventListener('change', async function(){
            for(let i=0; i<responsibleAuthorities.length; i++){
                if(document.getElementById("area-select").value.replace([i+ 1]+'. ','') == responsibleAuthorities[i].Name){
                    map.flyTo({
                        center: responsibleAuthorities[i].center,
                        essential: true
                    });
                }
            }
        });

        let uniqueStreets = await getFeatures(bounds, 'ResponsibleAuthority', 'Birmingham', 'Highways_Street');
        
        for (let i=0; i< uniqueStreets.length; i++){
            uniqueStreets[i].geometry.coordinates = uniqueStreets[i].geometry.coordinates[0];
            }
            
        
        map.addSource('streets', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection', 
                'features': uniqueStreets
            }
        });

        map.addLayer({
            'id': 'streets',
            'type': 'line',
            'source': 'streets',
            'paint': {
                'line-width': 5,
                'line-color': "#FFD700"
            }
        })

        let uniqueHospitals = await getFeatures(bounds, 'SiteFunction', 'Hospital', 'Sites_FunctionalSite');

        map.addLayer({
            "id": "hospitals",
            "type": "fill",
            "source": {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": uniqueHospitals
            }
            },
            "layout": {},
            "paint": {
            "fill-color": "#FF1493",
            "fill-opacity": 0.8
            }
        });

        let uniqueSchools = await getFeatures(bounds, 'SiteFunction', 'Secondary Education', 'Sites_FunctionalSite');
        
        map.addLayer({
            "id": "schools",
            "type": "fill",
            "source": {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": uniqueSchools
            }
            },
            "layout": {},
            "paint": {
            "fill-color": "#20B2AA",
            "fill-opacity": 0.8
            }
        });

        
        
        // Add event which will be triggered when the map has finshed moving (pan + zoom).
        // Implements a simple strategy to only request data when the map viewport invalidates
        // certain bounds.
        map.on('moveend', async function() {
           
            bounds2 = map.getBounds();
            bounds = bounds2;


            let mapMovedStreets = await getFeatures(bounds2, 'ResponsibleAuthority', 'Birmingham', 'Highways_Street');
            for (let i=0; i< mapMovedStreets.length; i++){
                mapMovedStreets[i].geometry.coordinates = mapMovedStreets[i].geometry.coordinates[0];
                }
            
            uniqueStreets = uniqueStreets.concat(getNewFeatures(uniqueStreets, mapMovedStreets))

            //adds street features when the map flies to new area
            //removes the numbering to get the value of the area
            let areaString = document.getElementById("area-select").value.split('')
            let areaValue = areaString.slice(areaString.indexOf(" ")+1, areaString.length).join('')
            let newAreaStreets = await getFeatures(bounds2, 'ResponsibleAuthority', areaValue, 'Highways_Street');

            for (let i=0; i< newAreaStreets.length; i++){
                newAreaStreets[i].geometry.coordinates = newAreaStreets[i].geometry.coordinates[0];
                }
            
            uniqueStreets = uniqueStreets.concat(getNewFeatures(uniqueStreets, newAreaStreets))

            let total = {
                "type": "FeatureCollection",
                "features": uniqueStreets
                }
            map.getSource('streets').setData(total);   
            
            let mapMovedHospitals = await getFeatures(bounds2, 'SiteFunction', 'Hospital', 'Sites_FunctionalSite');
            uniqueHospitals = uniqueHospitals.concat(getNewFeatures(uniqueHospitals, mapMovedHospitals));

            let totalHospitals = {
                "type": "FeatureCollection",
                "features": uniqueHospitals
                }
            map.getSource('hospitals').setData(totalHospitals);

            let mapMovedSchools = await getFeatures(bounds2, 'SiteFunction', 'Secondary Education', 'Sites_FunctionalSite');
            uniqueSchools = uniqueSchools.concat(getNewFeatures(uniqueSchools, mapMovedSchools));

            let totalSchools = {
                "type": "FeatureCollection",
                "features": uniqueSchools
                }
            map.getSource('schools').setData(totalSchools);
            
            
        });

        //Get the source data from school features to use when calculating the nearest school to a hospital
        let schoolSource = map.getSource('schools')

        // When a click event occurs on a feature in the 'streets' layer, open a popup at
        // the location of the click, with description HTML from its properties.
        let popup = new mapboxgl.Popup({className: 'popup', offset: 5});
        map.on('click', 'streets', function(e) {
                popup
                .setLngLat(e.lngLat)
                .setHTML(e.features[0].properties.ResponsibleAuthority)
                .addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the 'streets' layer.
        map.on('mouseenter', 'streets', function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to a pointer when it leaves the 'streets' layer.
        map.on('mouseleave', 'streets', function () {
            map.getCanvas().style.cursor = '';
        });

        // When a click event occurs on a feature in the 'hospitalss' layer, open a popup at
        // the location of the click, with description HTML from its properties.
        map.on('click', 'hospitals', function(e) {
            let schools = schoolSource._data.features;

            //Distance from most southwestern and most northeastern points of England is approx. 425 miles.
            //As hospitals as secondary schools do exist in England, this number will be a good starting point,
            //as the minimum distance between a hospital and school will be less than this.
            //Distance is measures in miles 
            let minDistance = 425;
            let closestSchool = '';
            let closestFeature = ''
            for(let i=0; i<schools.length; i++){
                let distance = turf.distance(e.features[0].geometry.coordinates[0][0], schools[i].geometry.coordinates[0][0], {units: 'miles'})
                if(distance < minDistance){
                    minDistance = distance;
                    closestSchool = schools[i].properties.DistinctiveName1;  
                    closestFeature = [schools[i]]
                }                
            }
            if(!map.getLayer('closest-school')){
                map.addLayer({
                    "id": "closest-school",
                    "type": "fill",
                    "source": {
                    "type": "geojson",
                    "data": {
                        "type": "FeatureCollection",
                        "features": closestFeature
                    }
                    },
                    "layout": {},
                    "paint": {
                    "fill-color": "#000000",
                    "fill-opacity": 0.8
                    }
                });
            }
            else{
                let closestData = {
                    "type": "FeatureCollection",
                    "features": closestFeature
                }
                map.getSource('closest-school').setData(closestData)
            }

            
            
                
                popup
                .setLngLat(e.lngLat)
                .setHTML("<b>"+ e.features[0].properties.DistinctiveName1 + "</b>"
                     + '<br>Nearest School: ' + closestSchool
                     + '<br>Distance From Hospital: ' + minDistance.toFixed(2) + " miles")
                .addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the 'hospitals' layer.
        map.on('mouseenter', 'hospitals', function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to a pointer when it leaves the 'hospitals' layer.
        map.on('mouseleave', 'hospitals', function () {
            map.getCanvas().style.cursor = '';
            
        });

        // When a click event occurs on a feature in the 'hospitalss' layer, open a popup at
        // the location of the click, with description HTML from its properties.
        map.on('click', 'schools', function(e) {
            popup
            .setLngLat(e.lngLat)
            .setHTML(e.features[0].properties.DistinctiveName1)
            .addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the 'hospitals' layer.
        map.on('mouseenter', 'schools', function () {
            map.getCanvas().style.cursor = 'pointer';
        });

        // Change the cursor back to a pointer when it leaves the 'hospitals' layer.
        map.on('mouseleave', 'schools', function () {
            map.getCanvas().style.cursor = '';
        });
       
    });


    /**
     * Get features from the WFS.
     */
    async function getFeatures(bounds, propertyName, literal, typeName) {
        // Convert the bounds to a formatted string.
        var sw = bounds.getSouthWest().lng + ',' + bounds.getSouthWest().lat,
            ne = bounds.getNorthEast().lng + ',' + bounds.getNorthEast().lat;

        var coords = sw + ' ' + ne;

        // Create an OGC XML filter parameter value which will select the Airport
        // features (site function) intersecting the BBOX coordinates.
        var xml = '<ogc:Filter>';
        xml += '<ogc:And>';
        xml += '<ogc:BBOX>';
        xml += '<ogc:PropertyName>SHAPE</ogc:PropertyName>';
        xml += '<gml:Box srsName="urn:ogc:def:crs:EPSG::4326">';
        xml += '<gml:coordinates>' + coords + '</gml:coordinates>';
        xml += '</gml:Box>';
        xml += '</ogc:BBOX>';
        xml += '<ogc:PropertyIsEqualTo>';
        xml += '<ogc:PropertyName>'+ propertyName +'</ogc:PropertyName>';
        xml += '<ogc:Literal>'+ literal +'</ogc:Literal>';
        xml += '</ogc:PropertyIsEqualTo>';
        xml += '</ogc:And>';
        xml += '</ogc:Filter>';

        // Define (WFS) parameters object.
        let startIndex = 0;
        let featureLength = 0;
        let totalFeatures = [];

        do {
        var params = {
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
        
        totalFeatures.push(featureArray);
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

        return wfsServiceUrl + '?' + encodedParameters;
    }