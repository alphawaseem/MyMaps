const CITY = { lat: 12.2958, lng: 76.6394 }; // Mysuru city in karnataka
const MAP_ZOOM = 14; // map zoom level when loaded
const MARKER_ZOOM = 17; // used to set zoom level when we click on marker or list item
const MAP_HOLDER = document.getElementById('map');
const MY_MAP_STYLE = [{ stylers: [{ visibility: 'simplified' }] }];
let marker_image;
let map;
let service;
let infoWindow;
let masjids = [];
/**
 * Represents a Masjid
 * @constructor
 * @param {string} name - Name of the masjid
 * @param {float} lat - latitute of the masjid
 * @param {float} lng - longititude of the masjid
 **/
class Masjid {
    constructor(name, lat, lng) {
        this.name = ko.observable(name);
        this.lat = lat;
        this.lng = lng;
    }
}


class MapViewModel {
    constructor() {
        this.fullMasjids = [];
        this.filteredMasjids = ko.observableArray();
        this.masjidName = ko.observable();
    }

    addMasjid(mosque) {
        this.fullMasjids.push(mosque);
        this.filteredMasjids.push(mosque);
    }
    showInfo(masjid) {
        infoWindow.setContent(masjid.name());
        infoWindow.setPosition({ lat: masjid.lat, lng: masjid.lng });
        map.setZoom(MARKER_ZOOM);
        map.setCenter({ lat: masjid.lat, lng: masjid.lng });
        infoWindow.open(map);
    }
    addMarker(mosque) {

        let marker = new google.maps.Marker({
            position: { lat: mosque.lat, lng: mosque.lng },
            title: mosque.name(),
            icon: setMarkerImage()
        });
        marker.setMap(map);
        marker.addListener('click', () => {
            this.showInfo(mosque);
        });
    }
    resetList() {
        if (this.masjidName()) {
            this.filteredMasjids(this.filteredMasjids().filter(masjid => {
                if (masjid.name().toLowerCase().includes(this.masjidName().toLowerCase()))
                    return true;
                else
                    return false;

            }));
        } else {
            this.filteredMasjids(this.fullMasjids);

        }

    }
}

/**
 * This function is starting point of the app which is called
 * when google maps api have been loaded to the page
 * This function will initialize map then search for 
 * masjids around a city and stores those masjids in an array
 * which is used by the ViewModel of knockout.js to 
 * create markers on the map
 **/
function main() {

    map = initMap(MAP_HOLDER, {
        center: CITY,
        zoom: MAP_ZOOM,
        styles: MY_MAP_STYLE,
        mapTypeControl: false
    });

    if (map) {

        service = new google.maps.places.PlacesService(map);
        infoWindow = new google.maps.InfoWindow();
        let model = new MapViewModel();
        let query = {
            location: CITY,
            radius: 1000, // radius to search within
            type: 'mosque' // we are only intrested in places of type mosque
        };
        searchNearMosques(query).then((place_result) => {
            for (let i = 0, masjid; masjid = place_result[i]; i++) {
                getMosquesFromResult(masjid).then((mosque) => {
                    model.addMasjid(mosque);
                    model.addMarker(mosque);

                });
            }
        });

        ko.applyBindings(model);
    }
}


/**
 * This function returns a map object if valid dom element is provided
 * else returns undefined
 * @param {DOM Element} div - The dom element in which map will be loaded
 * @param {Object literal} options - Key-value pair to define options for map
 **/
function initMap(div, options) {
    if (div) {
        return map = new google.maps.Map(div, options);
    }
    return undefined;
}

/**
 * This function returns a promise. If promise is successful then
 * it returns the results of radarSearch. radarSearch returns array of PlaceResult
 * objects, we will use these objects to get each mosque's coordinates 
 * This function assumes a PlaceService object is defined globally as service.
 *
 * @param {Object literal} query - key-value pairs used to query by radarSearch
 *
 **/
function searchNearMosques(query) {
    return myPromise = new Promise((resolve, reject) => {
        service.radarSearch(query, (result, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                console.error(status);
                reject(status);
            }
            resolve(result);
        });

    });
}

/**
 * This function returns a promise. This function takes the PlaceResult object
 * and getDetails from it. Here we are interseted only in name of the place. Once
 * we get the name of the place ie mosque. We construct Masjid object from it 
 * and returns the object.
 * @param {PlaceResult} mosque - This object already has coordinates in geometry.location
 *                     but we are using it here to get the name of the location ie masjid
 **/
function getMosquesFromResult(mosque) {
    return myExtractPromise = new Promise((resolve, reject) => {
        service.getDetails(mosque, function(result, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                title = result.name;
                resolve(new Masjid(title, mosque.geometry.location.lat(), mosque.geometry.location.lng()));
            } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                setTimeout(function() {
                    getMosquesFromResult(mosque);
                }, 200);
            } else {
                console.error(status);
                reject(error);
            }
        });

    });
}

function setMarkerImage() {
    return new google.maps.MarkerImage(
        'mosque.png',
        new google.maps.Size(71, 71),
        new google.maps.Point(0, 0),
        new google.maps.Point(17, 34),
        new google.maps.Size(40, 40));
}