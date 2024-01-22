document.addEventListener('DOMContentLoaded', async function() {
    const realmAppId = 'comedybit-botzw';
    const dbName = 'events';
    const collectionName = 'finalEvents';
    const app = new Realm.App({ id: realmAppId });

    async function init() {
        let currentCity;
        const mongoClient = await app.currentUser.mongoClient("mongodb-atlas"); // Create a MongoDB client instance
        const collection = mongoClient.db(dbName).collection(collectionName); // Retrieve the collection
    
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const long = position.coords.longitude;
    
                currentCity = await callFindClosestGreaterCity(lat, long); // Pass the collection
                startApp(currentCity);
            }, () => {
                currentCity = 'Los Angeles'; // Default city if location access is denied
                startApp(currentCity);
            });
        } else {
            console.log('Geolocation is not supported by this browser.');
            currentCity = 'Los Angeles'; // Default city if geolocation is not supported
            startApp(currentCity);
        }
    }



    async function startApp(city) {
        const user = await login();
        if (user) {
            const cities = await user.functions.getDistinctCities();
            populateCitySearch(cities);
            setCitySearchValue(city);  // Ensure this is called after cities are populated
            fetchVenues(city);
            fetchData(city);
            setUpEventListeners();
        }
    }
    
    function setCitySearchValue(city) {
        const citySearch = document.getElementById('citySearch');
        if (citySearch) {
            // Ensure the option for the city exists before setting the value
            if (Array.from(citySearch.options).some(option => option.value === city)) {
                citySearch.value = city;
            } else {
                console.error(`City '${city}' not found in options`);
            }
        } else {
            console.error('citySearch element not found');
        }
    }


    async function login() {
        try {
            return await app.logIn(Realm.Credentials.anonymous());
        } catch (error) {
            console.error('Error logging in:', error);
            return null;
        }
    }




    async function fetchVenues(city) {
        const user = await login();
        if (user) {
            const mongo = user.mongoClient("mongodb-atlas");
            const eventsData = await mongo.db(dbName).collection(collectionName).find({ greaterCity: city });
            const venues = [...new Set(eventsData.map(event => event.locationName))];
            populateVenueSearch(venues);
        }
    }




    function populateVenueSearch(venues) {
        const venueSearch = document.getElementById('venueSearch');
        venueSearch.innerHTML = ''; // Clear all options
        if (venues.length > 0) {
          venueSearch.innerHTML += '<option value="all">All Venues</option>';
        }
        venues.forEach(venue => {
          const option = document.createElement('option');
          option.value = venue;
          option.textContent = venue;
          venueSearch.appendChild(option);
        });
        venueSearch.addEventListener('change', (event) => {
          const selectedVenue = event.target.value;
          filterEventsByVenue(selectedVenue);
        });
      }



    async function callFindClosestGreaterCity(lat, long) {
        const user = await login();

        if (user) {
            // call the findClosestGreaterCity function
            const closestCity = await user.functions.findClosestGreaterCity(lat, long);
            console.log("Closest city:", closestCity)
            return closestCity;
        }
        else { 
            return 'Los Angeles'
        }
}
    


    async function fetchData(city, venue) {
        const user = await login();
        if (user) {
            const mongo = user.mongoClient("mongodb-atlas");
            const currentDate = new Date();
            const query = {
                date: { $gte: currentDate.toISOString() },
                ...(city && { greaterCity: city }),
            };
            let eventsData = await mongo.db(dbName).collection(collectionName).find(query);
            if (venue && venue !== 'all') {
                eventsData = eventsData.filter(event => event.locationName === venue);
            }
            populateEvents(eventsData.sort((a, b) => new Date(a.date) - new Date(b.date)));
        }
    }





    function filterEventsByVenue(venue) {
        const citySearch = document.getElementById('citySearch');
        const selectedCity = citySearch.value;
        fetchData(selectedCity, venue);
    }




    function createEventCard(event) {
        const eventCard = document.createElement('div');
        eventCard.className = 'div-block-5';
        eventCard.style.opacity = '1';


        const date = new Date(event.date);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayName = dayNames[date.getDay()];
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const rawHours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = rawHours >= 12 ? 'PM' : 'AM';


        let displayHours = rawHours % 12;
        displayHours = displayHours ? displayHours : 12;
        const formattedDate = `${dayName}, ${month} ${day}, ${year} | ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        eventCard.innerHTML = '<div class="top">' +
            '<img src="' + event.thumbnail + '" loading="lazy" alt="" class="image-3">' +
            '<div class="inner-block">' +
            '<div class="event-name">' + event.eventName + '</div>' +
            '</div></div>' +
            '<div class="bottom">' +
            '<div class="date">' + formattedDate + '</div>' +
            '<div class="venue">' + event.locationName + '</div>' +
            '</div>';


        eventCard.dataset.venue = event.locationName;
        eventCard.dataset.description = event.description;
        eventCard.dataset.url = event.url;
        eventCard.dataset.location = event.location;
        eventCard.dataset.ticketPrice = event.ticketPrice;
        eventCard.addEventListener('click', () => {
            updateDetailBlock(eventCard);
        });
        return eventCard;
    }




    function updateDetailBlock(eventCard) {
        const venueNameElem = document.getElementById('venue-name');
        const venueAddressElem = document.getElementById('venue-address');
        const dateTimeElem = document.getElementById('date-time');
        const eventButtonElem = document.getElementById('eventButton');
        const popupTextBlock = document.getElementById('popup-text-block');
        const descriptionBox = document.getElementById('description-paragraph');
        const priceBox = document.getElementById('priceLabel')
        const venue = eventCard.dataset.venue;
        const address = eventCard.dataset.location;
        
        // Create a Google Maps URL for the address
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;



        venueNameElem.textContent = venue || 'N/A';
        venueAddressElem.innerHTML = `<a href="${mapsUrl}" target="_blank">${address}</a>`;
        dateTimeElem.textContent = eventCard.querySelector('.date').textContent;
        eventButtonElem.setAttribute('href', eventCard.dataset.url || '#');
        eventButtonElem.setAttribute('target', '_blank');
        descriptionBox.textContent = eventCard.dataset.description;
        priceBox.textContent = eventCard.dataset.ticketPrice
        popupTextBlock.textContent = eventCard.querySelector('.event-name').textContent;
    }




    function populateCitySearch(cities) {
        const citySearch = document.getElementById('citySearch');
        citySearch.innerHTML = '<option value="" selected>Choose a City</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySearch.appendChild(option);
        });
    }


    function populateEvents(events) {
        console.log("Populating events:", events);
        const cardContainer = document.querySelector('.row-1');
        cardContainer.innerHTML = '';
        events.forEach(event => {
            const eventCard = createEventCard(event);
            cardContainer.appendChild(eventCard);
        });
    }




    const dateFilters = {
        'tonight-button': (date) => date.toDateString() === new Date().toDateString(),
        'this-week-button': (date) => date >= startOfWeek(new Date()) && date < startOfNextWeek(new Date()),
        'this-month-button': (date) => date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear(),
        'later-button': (date) => date >= startOfNextMonth(new Date())
    };


    let activeFilterId = null;

    function filterEvents(filterFunction) {
        console.log("Filtering events");
        const cards = document.querySelectorAll('.div-block-5');
        cards.forEach(card => {
            const dateStr = card.querySelector('.date').textContent.split('|')[0].trim();
            const eventDate = new Date(dateStr);
            if (activeFilterId && !filterFunction) {
                card.style.display = 'none';
            } else {
                card.style.display = (!filterFunction || filterFunction(eventDate)) ? '' : 'none';
            }
        });


    }
    function startOfNextMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }
    function startOfWeek(date) {
        const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }
    function startOfNextWeek(date) {
        const nextWeek = new Date(date);
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        return nextWeek;
    }


    function setUpEventListeners() {


        const citySearch = document.getElementById('citySearch');
        citySearch.addEventListener('change', (event) => {
            const selectedCity = event.target.value;
            fetchVenues(selectedCity);
            fetchData(selectedCity);
        });



        const searchForm = document.getElementById('searchForm');
        searchForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const searchText = document.getElementById('searchBar').value;
            if (!searchText.trim()) {
                alert("Please enter a search term.");
                return;
            }
            try {
                const user = await login()
                const searchResults = await user.functions.searchEvents(searchText);
                populateEvents(searchResults.sort((a, b) => new Date(a.date) - new Date(b.date)));
            } catch (error) {
                console.error('Error during search:', error);
            }
        });


        
        Object.keys(dateFilters).forEach(filterId => {
            const filterButton = document.getElementById(filterId);
            filterButton.addEventListener('change', function(event) {
                const isChecked = event.target.checked;
                if (isChecked) {
                    Object.keys(dateFilters).forEach(id => {
                        if (id !== filterId) {
                            document.getElementById(id).checked = false;
                        }
                    });
                    activeFilterId = filterId;
                } else {
                    activeFilterId = null;
                }
                filterEvents(isChecked ? dateFilters[filterId] : null);
            });
        });

    }

    init(); // Call to initialize the script

});
    
