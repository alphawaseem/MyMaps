/**
 * CONSTANTS
 */
const CITY = { lat: 13.001547, lng: 76.095922 }; // My city hassan,Karnataka
const MAP_ZOOM = 14; // map zoom level when loaded
const MARKER_ZOOM = 16; // used to set zoom level when we click on marker or list item
const MAP_HOLDER = document.getElementById('map');
const MY_MAP_STYLE = [{ stylers: [{ visibility: 'simplified' }] }];
const config = {
    apiKey: "AIzaSyBBrwoN7BSFC77ECuCKobQHpPBnxHwQvfI",
    authDomain: "masjid-prayer-timing.firebaseapp.com",
    databaseURL: "https://masjid-prayer-timing.firebaseio.com",
    storageBucket: "masjid-prayer-timing.appspot.com",
    messagingSenderId: "37412697423"
};
/**
 * Singleton variables used for map
 */
let map;
let infoWindow;
// Initialize Firebase
firebase.initializeApp(config);


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

        infoWindow = new google.maps.InfoWindow();
        let model = new MapViewModel(map);

        firebase.database().ref('/masjids/').once('value').then(function(snapshot) {
            if (snapshot.val()) {
                snapshot.forEach(masjid => {
                    let masjidObj = masjid.val();
                    masjidObj.id = masjid.key;
                    model.addMasjid(new Masjid(masjidObj));
                });
            } else {
                showError('Something went wrong while getting masjids. Try again later!');
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
    constructor(masjid) {
        this.name = ko.observable(masjid.masjid_name);
        this.lat = masjid.lat;
        this.lng = masjid.lng;
        this.city = masjid.city;
        this.id = masjid.id;
        this.createMarker();
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
        let firebaseResult;
        firebase.database().ref('/masjids/' + masjid.id).once('value').then(function(snapshot) {
            firebaseResult = snapshot.val();
            let content = `<div>
            <header><h3>${masjid.name()}</h3></header>
            <section><ul class="w3-ul w3-card-4">
            <li class="w3-blue"> Fajr <span class="w3-right">${firebaseResult.fajr}</span></li>
            <li class="w3-red"> Zohr <span class="w3-right">${firebaseResult.zohr}</span></li>
            <li class="w3-teal"> Asr <span class="w3-right">${firebaseResult.asr}</span></li>
            <li class="w3-orange"> Mughrib <span class="w3-right">${firebaseResult.mughrib}</span></li>
            <li class="w3-black"> Isha <span class="w3-right">${firebaseResult.isha}</span></li>     
            </ul>
            </section>
            <footer><small>${masjid.city}</small></footer>    
        </div>`
            infoWindow.setContent(content);
            infoWindow.setPosition({ lat: masjid.lat, lng: masjid.lng });
            map.setZoom(MARKER_ZOOM);
            map.setCenter({ lat: masjid.lat, lng: masjid.lng });
            infoWindow.open(map);
            masjid.getMarker().setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
                masjid.getMarker().setAnimation(null);
            }, 3000);
        });
        if (onMobile && !aside.hasClass('list-view-hidden')) {
            aside.toggleClass('list-view-hidden');
        }

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