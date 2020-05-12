// Initialize the map object.
let map = new mapboxgl.Map({
    container: 'map',
    minZoom: 7,
    maxZoom: 20,
    style: style,
    center: [ -2.498094, 52.569447],
    zoom: 7
});


function createMap(map){
    map.dragRotate.disable(); // Disable map rotation using right click + drag.
    map.touchZoomRotate.disableRotation(); // Disable map rotation using touch rotation gesture.

    // Add navigation control (excluding compass button) to the map.
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
    }));

}

map.on('load', async function () {
    let partnerHubs = await fetchPartnerHubs(partners)
    createPartnerHubMarkers(partnerHubs)
    document.getElementById('markers').addEventListener('change', togglePartnerHubs)  
});


function formatCursor(cursor){
    map.getCanvas().style.cursor = cursor; 
}

let popup = new mapboxgl.Popup({ className: 'popup', offset: 25 });

map.on('mouseenter', 'markers', function(e){
    formatCursor('pointer');
    popup
        .setLngLat(e.features[0].geometry.coordinates)
        .setHTML(e.features[0].properties["Company Name"])
        .addTo(map);   
})

map.on('mouseleave', 'markers', function(e){
    formatCursor('');
    popup.remove();   
})

createMap(map);
