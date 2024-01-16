document.addEventListener('DOMContentLoaded', async function() {
    const realmAppId = 'comedybit-botzw';
    const dbName = 'events';
    const collectionName = 'finalEvents';
    const app = new Realm.App({ id: realmAppId });
    let currentCity = 'Los Angeles';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;
            console.log(`Latitude: ${lat}, Longitude: ${long}`);
            console.log(`Current city after geolocation: ${currentCity}`);

            currentCity = await getClosestCity(lat, long);
            console.log(`Current city after await: ${currentCity}`);

            const citySearch = document.getElementById('citySearch');
            citySearch.value = currentCity;
            fetchData(currentCity);
            fetchVenues(currentCity);
        }, handleError);
        
        function handleError(error) {
            console.error('Error getting location:', error.message || 'Unknown Error');
            fetchData(currentCity);
            fetchVenues(currentCity); // Default to Los Angeles
        }

    } else {
        console.log('Geolocation is not supported by this browser.');
        fetchVenues(currentCity); // Default to Los Angeles
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

      async function getClosestCity(lat1, lon1) {
        const user = await login();
        if (user) {
            console.log(`getClosestCity called with lat: ${lat1}, lon: ${lon1}`);
            const mongo = user.mongoClient("mongodb-atlas");
            const citiesData = await mongo.db(dbName).collection(collectionName).find({});
            //console.log(`Fetched cities data: ${JSON.stringify(citiesData)}`); // Log the data to verify it's what you expect
            
            let closestCity = 'Los Angeles'; // Default to Los Angeles
            let minDist = Infinity;
    
            for (const city of citiesData) {
                const lat2 = city.latitude;
                const lon2 = city.longitude;
                const dist = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    
                if (dist < minDist) {
                    minDist = dist;
                    closestCity = city.greaterCity;
                }
            }
            console.log(`getClosestCity resolved with closest city: ${closestCity}`);
            console.log(`Closest city: ${closestCity}`); // Log the closest city for debugging
            return closestCity;
        } else {
            console.error('User login failed.');
            return 'Los Angeles'; // Default if user login fails
        }
    }

    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180)
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
            '<img src="path-to-your-creator-icon" loading="lazy" alt="" class="creator-icon">' +
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


        venueNameElem.textContent = venue || 'N/A';
        venueAddressElem.textContent = eventCard.dataset.location || 'N/A'; // Replace 'location' with the actual field name
        dateTimeElem.textContent = eventCard.querySelector('.date').textContent;
        eventButtonElem.setAttribute('href', eventCard.dataset.url || '#');
        eventButtonElem.setAttribute('target', '_blank');
        descriptionBox.textContent = eventCard.dataset.description;
        priceBox.textContent = eventCard.dataset.ticketPrice
        popupTextBlock.textContent = eventCard.querySelector('.event-name').textContent;
    }

    async function fetchCitiesAndData(city) {
        const user = await login();
        if (user) {
            const cities = await user.functions.getDistinctCities();
            populateCitySearch(cities);
            fetchVenues(city);
            fetchData(city);
        }
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
        //citySearch.value = currentCity;
        citySearch.addEventListener('change', (event) => {
            currentCity = event.target.value;
            fetchVenues(currentCity);
            fetchData(currentCity);
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
    fetchCitiesAndData(currentCity);
    const dateFilters = {
        'tonight-button': (date) => date.toDateString() === new Date().toDateString(),
        'this-week-button': (date) => date >= startOfWeek(new Date()) && date < startOfNextWeek(new Date()),
        'this-month-button': (date) => date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear(),
        'later-button': (date) => date >= startOfNextMonth(new Date())
    };
    let activeFilterId = null;
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
            const filterFunction = dateFilters[filterId];
            filterEvents(isChecked ? filterFunction : null);
        });
    });
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
    const searchForm = document.getElementById('searchForm');
    const searchBar = document.getElementById('searchBar');
    searchForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const searchText = searchBar.value;
        if (!searchText.trim()) {
            alert("Please enter a search term.");
            return;
        }

        try {
            const user = await login()
            const searchResults = await user.functions.searchEvents(searchText)
            populateEvents(searchResults.sort((a, b) => new Date(a.date) - new Date(b.date)));
        } catch (error) {
            console.error('Error during search:', error);
        }
    });
});
