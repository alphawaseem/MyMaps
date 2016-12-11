$.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyBndW214czRP6Enei9aIff-vuTtoBbchNo&v=3&libraries=places")
    .done(function(script, textStatus) {
        main();
    })
    .fail(function(jqxhr, settings, exception) {
        $("#map").text("Could not load maps");
        console.error("Failed to get google maps. Please check your url and/or api key");
    });




/**
 * CONSTANTS
 */
const CITY = { lat: 13.001547, lng: 76.095922 }; // My city hassan
const MAP_ZOOM = 14; // map zoom level when loaded
const MARKER_ZOOM = 16; // used to set zoom level when we click on marker or list item
const MAP_HOLDER = document.getElementById('map');
const MY_MAP_STYLE = [{ stylers: [{ visibility: 'simplified' }] }];

/**
 * Singleton variables used for map
 */
let map;
let service;
let infoWindow;


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
        let model = new MapViewModel(map);
        let query = {
            location: CITY,
            radius: 5000, // radius to search within
            type: 'mosque' // we are only intrested in places of type mosque
        };
        searchNearMosques(query).then((place_result) => {
            for (let i = 0, masjid, len = place_result.length; i < len; i++) {
                masjid = place_result[i];
                getMosquesFromResult(masjid).then((mosque) => {
                    model.addMasjid(mosque);
                });
            }
        });

        ko.applyBindings(model);
    }
}



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

    /**
     * This function creates a marker with current object's lat and lng position
     */
    createMarker() {
        this.marker = new google.maps.Marker({
            position: { lat: this.lat, lng: this.lng },
            title: this.name(),
            animation: google.maps.Animation.DROP,
            icon: this.setMarkerImage()
        });
    }

    /**
     * This function set the object's marker on our Singleton map
     */
    showOnMap(map) {
        this.marker.setMap(map);
    }


    setMarkerImage() {
        return new google.maps.MarkerImage(
            'mosque.png',
            new google.maps.Size(71, 71),
            new google.maps.Point(0, 0),
            new google.maps.Point(17, 34),
            new google.maps.Size(40, 40));
    }
    getMarker() {
        return this.marker;
    }

}



/** 
 * Represents MapViewModel
 * @constructor  
 */
class MapViewModel {
    constructor(map) {
        // list of all masjids. this array is not supposed to be changed 
        // once fully populated
        this.fullMasjids = [];

        // this variable is used to observe user input
        this.searchMasjid = ko.observable();

        // initially this array will have all the masjids which will be 
        // populated from addMasjid method. As user types we filter this
        // array based on user input
        this.filteredMasjids = ko.observableArray();
        this.map = map;
    }

    /**
     * This function takes a Masjid object. Adds it to our arrays and will be shown on our map
     * @param {Masjid} masjid - Masjid object 
     **/
    addMasjid(masjid) {

        this.fullMasjids.push(masjid);
        this.filteredMasjids.push(masjid);

        masjid.createMarker(); //create marker
        masjid.getMarker().addListener('click', () => { // add click listener
            this.showInfoWindow(masjid);
        });
        masjid.showOnMap(this.map);

    }

    /**
     * This method will be called when user clicks on list item. When user clicks on 
     * the list item , a corresponding {Masjid} object will be passed by knockout
     * we use this object to get the location of the masjid and then open
     * infowindow to show the prayer timings of that masjid.
     * @param {Masjid} masjid - A masjid object
     **/
    showInfoWindow(masjid) {

        infoWindow.setContent(masjid.name());
        infoWindow.setPosition({ lat: masjid.lat, lng: masjid.lng });
        map.setZoom(MARKER_ZOOM);
        map.setCenter({ lat: masjid.lat, lng: masjid.lng });
        infoWindow.open(map);
        masjid.getMarker().setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => {
            masjid.getMarker().setAnimation(null);
        }, 3000);
    }

    /**
     * This function is called when user types something on search box
     * We have binded our searchbox to searchMasjid instace with help knockout
     *  observable, so that it gets updated automatically when user
     * types on the searchbox.
     * This function filters the masjids based on user input and stores the
     * result on filteredMasjids observableArray. We have binded this 
     * array to our list view so that it will get automatically updated
     * with changes in filteredMasjids 
     **/
    resetList() {
        this.filteredMasjids(this.fullMasjids.filter(masjid => {
            let name = masjid.name().toLowerCase();
            let search = this.searchMasjid().toLowerCase();
            if (name.includes(search)) {
                masjid.showOnMap(this.map);
                return true;
            } else {
                masjid.showOnMap(null);
                return false;
            }
        }));
    }
}


/**
 * This function returns a map object if valid dom element is provided
 * else returns undefined
 * @param {HTMLElement} div - The dom element in which map will be loaded
 * @param {Object} options - Key-value pair to define options for map
 **/
function initMap(div, options) {
    if (div) {
        return new google.maps.Map(div, options);
    }
    return undefined;
}

/**
 * This function returns a promise. If promise is successful then
 * it returns the results of radarSearch. radarSearch returns array of PlaceResult
 * objects, we will use these objects to get each mosque's coordinates 
 * This function assumes a PlaceService object is defined globally as service.
 *
 * @param {Object} query - key-value pairs used to query by radarSearch
 *
 **/
function searchNearMosques(query) {
    return new Promise((resolve, reject) => {
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
    return new Promise((resolve, reject) => {
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