onmessage = function(e){
    service = new google.maps.places.PlacesService(map);
    console.log(service);
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