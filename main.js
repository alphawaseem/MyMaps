
/**
 * Represents a Masjid
 * @constructor
 * @param {string} name - Name of the masjid
 * @param {float} lat - latitute of the masjid
 * @param {float} lng - longititude of the masjid
 **/
 class Masjid{
  constructor(name, lat , lng){
    this.name = name;
    this.lat = lat;
    this.lng = lng;
  }
 }

let service;
let infoWindow;
const CITY = {lat:12.2958,lng:76.6394}; // Mysuru city in karnataka
const MAP_ZOOM = 14;
const MARKER_ZOOM = 18;
const MAP_HOLDER = document.getElementById('map');
const MY_MAP_STYLE = [{
    stylers: [{ visibility: 'simplified' }]
  }];
let map;

function main(){

   map = initMap(MAP_HOLDER,{center:CITY,
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

    searchNearMosques(query).then((place_result) =>{
      for(let i=0,masjid;masjid=place_result[i];i++){
        getMosquesFromResult(masjid).then((mosque)=>{
          mosques.push(mosque);
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
