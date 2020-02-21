    const apiKey = 'HRQqp4yN8hLHepJEg2fG4kFS69w1oVap';

    let serviceUrl = 'https://osdatahubapi.os.uk/OSVectorTileAPI/vts/v1';

    async function fetchStation(stationNumber) {
        let stationParams = {
            key: apiKey,
            service: 'WFS',
            request: 'GetFeature',
            version: '2.0.0',
            typeNames: 'Zoomstack_RailwayStations',
            outputFormat: 'GEOJSON',
            srsName: 'urn:ogc:def:crs:EPSG::4326',
            count: 1,
            startIndex: stationNumber.toString()
        };

        let url = getUrl(stationParams);
        let response = await fetch(url);
        let json = await response.json();
        let station = json.features[0];
        
        return station;
    }

    function randomStations(){
        let randomNums = [];
        while(randomNums.length < 20){
            let num = Math.floor(Math.random() * 3451);
            if (randomNums.indexOf(num) === -1){
                randomNums.push(num)
            }
        }
        return randomNums;
    }


    async function generatesStations() {
        let numbers = randomStations();
        let stationList = [];
        for(let i=0; i<numbers.length; i++){
            const station = await fetchStation(numbers[i]);
            stationList.push(station);
    }

        return stationList;
    } 


    document.body.onload = addElement;

    async function addElement() {
        const stationList = await generatesStations();
        populatesDropDown(stationList);
        addDropdownListener(stationList);
        flyto(stationList[0].geometry.coordinates);
    }

    function flyto(coords) {
        map.flyTo({
                    center: coords,
                    zoom: 14,
                    essential: true
                    })
        drawAll(coords)
    }

    function addDropdownListener(stationList) {
        //Click on an option in the nav bar, and the map will fly to the location of that station.
        document.getElementById("stationSelect").addEventListener('change',  function () {
            let coords;
            for (let i = 0; i < stationList.length; i++) {
                if (document.getElementById("stationSelect").value == stationList[i].properties.Name) {
                    coords = stationList[i].geometry.coordinates;
                    flyto(coords);
                    break;
                }
            }

        });
    }

    function populatesDropDown(stationList) {
        for (let i = 0; i < stationList.length; i++) {
            let newOption = document.createElement("option");
            let newContent = document.createTextNode(stationList[i].properties.Name);
            newOption.appendChild(newContent);
            let selectDiv = document.getElementById("stationSelect");
            selectDiv.appendChild(newOption);
        }
    }

    // Initialize the map object.
    let map = new mapboxgl.Map({
        container: 'map',
        maxZoom: 17,
        style: serviceUrl + '/resources/styles',
<<<<<<< HEAD:docs/osbuildarea_script.js
        center: [-0.104951, 51.520623],
=======
<<<<<<< HEAD
        center: [-0.104759, 51.520698],
=======
        center: [-0.104951, 51.520623 ],
>>>>>>> 70a12c6e8cac0491c2472689f5dde3532b3aa760
>>>>>>> 3cc45e98c867fdba4401d9a8cc7d11a2a58ece3c:docs/osindex.html
        zoom: 14,
        transformRequest: function (url) {
            url += '?key=' + apiKey + '&srs=3857';
            return {
                url: url
            }
        }
    });

    map.dragRotate.disable(); // Disable map rotation using right click + drag.
    map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

    // Add navigation control (excluding compass button) to the map.
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }));

    // Add attribution control to the map.
    map.addControl(new mapboxgl.AttributionControl({
        customAttribution: '&copy; Crown copyright and database rights ' + new Date().getFullYear() + ' Ordnance Survey.'
    }));

    // Add geolocation control to the map.
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    }), 'bottom-right');

    // Create an empty GeoJSON FeatureCollection.
    let geojson = {
        "type": "FeatureCollection",
        "features": []
    };

    // Add event which waits for the map to be loaded.
    map.on('load', function () {
        // Add an empty GeoJSON style layer for the 1km circle polygon (buffered
        // centroid) features.
        map.addLayer({
            "id": "circle",
            "type": "fill",
            "source": {
                "type": "geojson",
                "data": geojson
            },
            "layout": {},
            "paint": {
                "fill-color": "#f80",
                "fill-opacity": 0.5
            }
        });

        // Add an empty GeoJSON style layer for the localBuildings features.
        map.addLayer({
            "id": "localBuildings",
            "type": "fill",
            "source": {
                "type": "geojson",
                "data": geojson
            },
            "layout": {},

        });
    });

<<<<<<< HEAD:docs/osbuildarea_script.js
    function drawAll(center) {

=======
    // Add an event listener to handle when the user clicks the 'Find localBuildings' button.
    document.getElementById('request').addEventListener('click', function() {
        // Get the centre point of the map window.
<<<<<<< HEAD
        var center = [-0.104759, 51.520698];


        

        // {Turf.js} Takes the centre point coordinates and calculates a circular polygon
        // of the given a radius in kilometers; and steps for precision.
        var circle = turf.circle(center, 0.1, { steps: 24, units: 'kilometers' });
=======
        var center = [-0.104951, 51.520623 ];
>>>>>>> 3cc45e98c867fdba4401d9a8cc7d11a2a58ece3c:docs/osindex.html



        const circle_radius = 0.5
        // {Turf.js} Takes the centre point coordinates and calculates a circular polygon
        // of the given a radius in kilometers; and steps for precision.
<<<<<<< HEAD:docs/osbuildarea_script.js
        let circle = turf.circle(center, circle_radius, {
            steps: 24,
            units: 'kilometers'
        });
        
=======
        var circle = turf.circle(center, 0.5, { steps: 24, units: 'kilometers' });
>>>>>>> 70a12c6e8cac0491c2472689f5dde3532b3aa760
>>>>>>> 3cc45e98c867fdba4401d9a8cc7d11a2a58ece3c:docs/osindex.html

        // Set the GeoJSON data for the 'circle' layer and re-render the map.
        map.getSource('circle').setData(circle);


        // Get the flipped geometry coordinates and return a new space-delimited string.
        let coords = circle.geometry.coordinates[0].join(' ');

        // Create an OGC XML filter parameter value which will select the localBuildings
        // features intersecting the circle polygon coordinates.
        let xml = '<ogc:Filter>';
        xml += '<ogc:Intersects>';
        xml += '<ogc:PropertyName>SHAPE</ogc:PropertyName>';
        xml += '<gml:Polygon srsName="urn:ogc:def:crs:EPSG::4326">';
        xml += '<gml:outerBoundaryIs>';
        xml += '<gml:LinearRing>';
        xml += '<gml:coordinates>' + coords + '</gml:coordinates>';
        xml += '</gml:LinearRing>';
        xml += '</gml:outerBoundaryIs>';
        xml += '</gml:Polygon>';
        xml += '</ogc:Intersects>';
        xml += '</ogc:Filter>';

        // Define parameters object.
        let wfsParams = {
            key: apiKey,
            service: 'WFS',
            request: 'GetFeature',
            version: '2.0.0',
            typeNames: 'Zoomstack_LocalBuildings',
            outputFormat: 'GEOJSON',
            srsName: 'urn:ogc:def:crs:EPSG::4326',
            filter: xml,
            count: 100,
            startIndex: 0
        };

        let resultsRemain = true;

        geojson.features.length = 0;

        map.getSource('localBuildings').setData(geojson);
        document.getElementById('feature-count').innerHTML = '';
        document.getElementById('area').innerHTML = '';
        // Use fetch() method to request GeoJSON data from the OS Features API.
        //
        // If successful - set the GeoJSON data for the 'localBuildings' layer and re-render
        // the map.
        //
        // Calls will be made until the number of features returned is less than the
        // requested count, at which point it can be assumed that all features for
        // the query have been returned, and there is no need to request further pages.
        function fetchWhile(resultsRemain) {
            if (resultsRemain) {
                fetch(getUrl(wfsParams))
                    .then(response => response.json())
                    .then((data) => {
                        wfsParams.startIndex += wfsParams.count;

                        geojson.features.push.apply(geojson.features, data.features);

                        resultsRemain = data.features.length < wfsParams.count ? false : true;

                        fetchWhile(resultsRemain);
                    });
            } else {
                map.getSource('localBuildings').setData(geojson);
                document.getElementById('feature-count').innerHTML = geojson.features.length;

                // To calculate the area, rounded to 3 decimal places
                let area = 0;
                let ratio = 0;
                const circle_area = Math.PI * circle_radius * circle_radius;
                let feature = geojson.features;
                for (let i = 0; i < feature.length; i++) {
                    // Area in kilometers square
                    area += (geojson.features[i].properties.SHAPE_Area) / 1000000
                }
                ratio = area / circle_area
                //format the area
                if (area < 0.01) {
                    document.getElementById('area').innerHTML = "< 0.01"
                }
                else document.getElementById('area').innerHTML = area.toFixed(2);

                // format the ratio
                if (ratio < 0.01) {
                    document.getElementById('ratio').innerHTML = "< 0.01"
                }
                else document.getElementById('ratio').innerHTML = ratio.toFixed(2);

                // change color based on ratios
                if (ratio >= 0.45) {
                    map.setPaintProperty("localBuildings", "fill-color", "#F00")
                }
                else if (ratio < 0.45 && ratio > 0.3) {
                    map.setPaintProperty("localBuildings", "fill-color", "#FFA500")
                }
                else if (ratio < 0.29 && ratio > 0.15) {
                    map.setPaintProperty("localBuildings", "fill-color", "#FFFF00")
                }

                else {
                    map.setPaintProperty("localBuildings", "fill-color", "#0c0")
                }
            }
        }

        fetchWhile(resultsRemain);
    }

    /**
    * Return URL with encoded parameters.
    */
    function getUrl(params) {
        let encodedParameters = Object.keys(params)
            .map(paramName => paramName + '=' + encodeURI(params[paramName]))
            .join('&');

        return 'https://osdatahubapi.os.uk/OSFeaturesAPI/wfs/v1?' + encodedParameters;
    }