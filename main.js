// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

let service;
let infoWindow;

function main(){

  const CITY = {lat:12.2958,lng:76.6394}; // Mysuru city in karnataka
  const MAP_ZOOM = 14;
  const MARKER_ZOOM = 18;
  const MAP_HOLDER = document.getElementById('map');
  const MY_MAP_STYLE = [{
      stylers: [{ visibility: 'simplified' }]
    }];

  let map = initMap(MAP_HOLDER,{center:CITY,
    zoom:MAP_ZOOM,
    styles:MY_MAP_STYLE,
    mapTypeControl : false
  });

  if(map){
    let mosques = [];
    service = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow();
    let query = { 
      location : CITY,
      radius : 1000, // radius to search within
      type : 'mosque' // we are only intrested in places of type mosque
    };

    searchNearMosques(query).then((data) =>{
      for(let i=0,masjid;masjid=data[i];i++){
        getMosquesFromResult(masjid).then((data)=>{
          mosques.push(data);
        });
      }

    });
    console.log(mosques);
  }
}


/**
* This function returns a map object if valid dom element is provided
* else returns undefined
* @param {DOM Element} div - The dom element in which map will be loaded
* @param {Object literal} options - Key-value pair to define options for map
**/
function initMap(div,options) {
  if(div){
    return map = new google.maps.Map(div, options);
  }
  return undefined;
}

/**
* This function returns a promise. If promise is successful then
* it resovles to results of radarSearch. radarSearch returns PlaceResult
* objects, we will use these objects to get each mosque's coordinates 
* This function assumes a PlaceService object is defined globally as service.
*
* @param {Object literal} query - key-value pairs used to query by radarSearch
*
**/ 
function searchNearMosques(query){
  return myPromise = new Promise((resolve,reject) => {
    service.radarSearch(query,(result,status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK){
        console.error(status);
        reject(status);
      }
      resolve(result);
    });

  });
}

function getMosquesFromResult(mosque){
  return myExtractPromise = new Promise((resolve,reject)=>{
    service.getDetails(mosque, function(result, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        title = result.name;
        resolve(new Masjid(title,mosque.geometry.location.lat(),mosque.geometry.location.lng()));
      } else if ( status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
        setTimeout(function(){
          getMosquesFromResult(mosque);
        },200);
      } else {
        console.error(status);
        reject(error);
      }
    });

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

//  class MasjidViewModel{
  
//   constructor(){
//     this.self = this;
//     this.masjids = ko.observableArray();
//     this.masjidName = ko.observable();
//     this.filteredList = ko.observableArray();
//     this.markers = [];
//   }
//   addMasjid(masjid){
//     this.masjids.push(masjid);
//     this.addMarker(masjid);
//   }
//   searchMasjid(){
//     console.log(this.masjidName());
//   }
//   showInfo(mosque){
//     console.log(mosque);
//     console.log(this.markers);
//   }

//   addMarker(mosque) {
//   var marker = new google.maps.Marker({
//     map: map,
//     position: {lat:mosque.lat,lng:mosque.lng},
//     icon: {
//       url: 'mosque.png',
//       anchor: new google.maps.Point(10, 10),
//       scaledSize: new google.maps.Size(50, 50)
//     },
//     optimized:false
//   });
//   google.maps.event.addListener(marker, 'mousedown', function() {
//       infoWindow.setContent(mosque.title + '<br>' + mosque.lat.toFixed(5) + ' ' + mosque.lng.toFixed(5));
//       infoWindow.open(map, marker);
//     });
//   console.log(marker);
// }

//  }

//   let map;
//   let infoWindow;
//   let service;
//   let city =  
//   let model = new MasjidViewModel();  
   

 // function main(){
 //  // 1. init map
 //  // 2. perform search and store result
 //  // 3. show results on map
 //  // 4. show list view
 //  // 5. bind list view with markers


 //  initMap();
 //  performSearch();
 //  ko.applyBindings(model,document.getElementById("listview"));

 // }