// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var map;
var infoWindow;
var service;
var masjids = [];
var city =  {lat:13.001495,lng:76.095985};;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center:city,
    zoom: 13,
    styles: [{
      stylers: [{ visibility: 'simplified' }]
    }, {
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }],
    mapTypeControl:false
  });

  infoWindow = new google.maps.InfoWindow();
  service = new google.maps.places.PlacesService(map);

  // The idle event is a debounced event, so we can query & listen without
  // throwing too many requests at the server.
  map.addListener('idle', performSearch);
}

function performSearch() {
  var request = {
    location : city,
    radius : 50000,
    type : 'mosque'
  };
  service.radarSearch(request, callback);
}

function callback(results, status) {
  if (status !== google.maps.places.PlacesServiceStatus.OK) {
    console.error(status);
    return;
  }
  for (var i = 0, result; result = results[i]; i++) {
    addMarker(result);
  }
}

function addMarker(place) {
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    icon: {
      url: 'mosque.png',
      anchor: new google.maps.Point(10, 10),
      scaledSize: new google.maps.Size(50, 50)
    },
    optimized:false
  });
  google.maps.event.addListener(marker, 'mousedown', function() {
    service.getDetails(place, function(result, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
      }
      infoWindow.setContent(result.name + '<br>' + marker.position.lat().toFixed(5) + ' ' + marker.position.lng().toFixed(5));
      masjids.push(result.name);
      console.log(masjids);
      infoWindow.open(map, marker);
    });
  });
}