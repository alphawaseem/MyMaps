// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center:city,
    zoom: 14,
    styles: [{
      stylers: [{ visibility: 'simplified' }]
    }],
    mapTypeControl:false
  });

  infoWindow = new google.maps.InfoWindow();
  service = new google.maps.places.PlacesService(map);

  // The idle event is a debounced event, so we can query & listen without
  // throwing too many requests at the server.
  //map.addListener('idle', performSearch);
}

function performSearch() {
  var query = {
    location : city,
    radius : 50000,
    type : 'mosque'
  };
  service.radarSearch(query, storeMosques);
}

function storeMosques(mosques, status) {
  if (status !== google.maps.places.PlacesServiceStatus.OK) {
    console.error(status);
    return;
  }
  for (var i = 0, mosque; mosque = mosques[i]; i++) {
    //addMarker(mosque);
    addMosque(mosque);
  }
}
function addMosque(mosque){
  service.getDetails(mosque, function(result, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        title = result.name;
        let currentMasjid = new Masjid(title,mosque.geometry.location.lat(),mosque.geometry.location.lng())
        masjids.push(currentMasjid);
        addMarker(currentMasjid);
      } else if ( status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
        setTimeout(function(){
          addMosque(mosque);
        },200);
      } else {
        console.error(status);
        return;
      }

    });

}
function addMarker(mosque) {
  var marker = new google.maps.Marker({
    map: map,
    position: {lat:mosque.lat,lng:mosque.lng},
    icon: {
      url: 'mosque.png',
      anchor: new google.maps.Point(10, 10),
      scaledSize: new google.maps.Size(50, 50)
    },
    optimized:false
  });
  google.maps.event.addListener(marker, 'mousedown', function() {
      infoWindow.setContent(mosque.title + '<br>' + mosque.lat.toFixed(5) + ' ' + mosque.lng.toFixed(5));
      infoWindow.open(map, marker);
    });
}


/**
 Masjid object having its coords and title
 **/
 class Masjid{
  constructor(title, lat , lng){
    this.title = title;
    this.lat = lat;
    this.lng = lng;
  }
 }

  let map;
  let infoWindow;
  let service;
  let masjids = [];
  let city =  {lat:13.001495,lng:76.095985};

 function main(){
  // 1. init map
  // 2. perform search and store result
  // 3. show results on map
  // 4. show list view
  // 5. bind list view with markers

  
  initMap();
  performSearch();

 }