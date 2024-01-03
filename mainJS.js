<script src="https://unpkg.com/realm-web@1.4.0/dist/bundle.iife.js"></script>

<script>
document.addEventListener('DOMContentLoaded', async function() {
    // MongoDB Realm configuration
    const realmAppId = 'comedybit-botzw'; // Replace with your Realm app ID
    const dbName = 'events'; // Replace with your database name
    const collectionName = 'finalEvents'; // Replace with your collection name

    // Initialize MongoDB Realm
    const app = new Realm.App({ id: realmAppId });
    let currentCity = 'Los Angeles'; // Set the default city to Los Angeles

    async function loginAnonymous() {
        try {
            const user = await app.logIn(Realm.Credentials.anonymous());
            return user;
        } catch (error) {
            console.error('There was a problem logging in:', error);
            return null;
        }
    }

    async function fetchCities() {
        try {
            const user = await loginAnonymous();
            if (user) {
                const cities = await user.functions.getDistinctCities();
                populateCitySearch(cities);
                fetchData(currentCity); // Fetch data for Los Angeles upon loading
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
        }
    }

    function populateCitySearch(cities) {
        const citySearch = document.getElementById('citySearch');
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySearch.appendChild(option);
        });

        // Set the selected city to Los Angeles
        citySearch.value = currentCity;

        citySearch.addEventListener('change', (event) => {
            currentCity = event.target.value;
            fetchData(currentCity);
        });
    }

    async function fetchData(city) {
        try {
            const user = await loginAnonymous();
            if (user) {
                const mongo = user.mongoClient("mongodb-atlas");
                const currentDate = new Date();
                const query = {
                    date: { $gte: currentDate.toISOString() },
                    ...(city && { greaterCity: city })
                };

                const eventsData = await mongo.db(dbName).collection(collectionName).find(query);
                populateEvents(eventsData.sort((a, b) => new Date(a.date) - new Date(b.date)));
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }

    function populateEvents(events) {
        const cardContainer = document.querySelector('.row-1');
        cardContainer.innerHTML = '';

        events.forEach(event => {
            const eventCard = document.createElement('div');
            eventCard.className = 'div-block-5';
            eventCard.style.opacity = '1';

            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' | ' + eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            eventCard.innerHTML = '<div class="top">' +
                                  '<img src="' + event.thumbnail + '" loading="lazy" alt="" class="image-3">' +
                                  '<div class="inner-block">' +
                                  '<img src="https://uploads-ssl.webflow.com/658b76990ed1c61ba88b6870/658b76990ed1c61ba88b6878_Path.svg" loading="lazy" alt="" class="creator-icon">' +
                                  '<div class="event-name">' + event.eventName + '</div>' +
                                  '</div></div>' +
                                  '<div class="bottom">' +
                                  '<div class="date">' + formattedDate + '</div>' +
                                  '<div class="venue">' + event.locationName + '</div>' +
                                  '</div>';

            cardContainer.appendChild(eventCard);
        });
    }

    // Add event listeners for date filter checkboxes
    const dateFilters = {
        'tonight-button': (date) => date.toDateString() === new Date().toDateString(),
        'this-week-button': (date) => date >= startOfWeek(new Date()) && date < startOfNextWeek(new Date()),
        'this-month-button': (date) => date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear(),
        'later-button': (date) => date >= startOfNextMonth(new Date())
    };

    let activeFilterId = null; // Track the active filter

    Object.keys(dateFilters).forEach(filterId => {
        const filterButton = document.getElementById(filterId);
        filterButton.addEventListener('change', function(event) {
            const isChecked = event.target.checked;
            if (isChecked) {
                // Uncheck other filters
                Object.keys(dateFilters).forEach(id => {
                    if (id !== filterId) {
                        document.getElementById(id).checked = false;
                    }
                });
                activeFilterId = filterId;
            } else {
                // If unchecked, set activeFilterId to null
                activeFilterId = null;
            }
            const filterFunction = dateFilters[filterId];
            filterEvents(isChecked ? filterFunction : null);
        });
    });

    function filterEvents(filterFunction) {
        const cards = document.querySelectorAll('.div-block-5');
        cards.forEach(card => {
            const dateStr = card.querySelector('.date').textContent.split('|')[0].trim();
            const eventDate = new Date(dateStr);
            if (activeFilterId && !filterFunction) {
                // If another filter is active, hide the card
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

    fetchCities(); // Populate city search and fetch data for Los Angeles on load
});
</script>




<script>
document.addEventListener('DOMContentLoaded', async function() {
    const app = new Realm.App({ id: 'comedybit-botzw' }); // Replace with your Realm app ID

    async function loginAnonymous() {
        try {
            return await app.logIn(Realm.Credentials.anonymous());
        } catch (error) {
            console.error('There was a problem logging in:', error);
            return null;
        }
    }

    async function searchEvents(query) {
        try {
            const user = await loginAnonymous();
            if (user) {
                return await user.functions.searchEvents(query);
            }
        } catch (error) {
            console.error('Error searching events:', error);
            return [];
        }
    }

    // Function to create and append event cards
    function populateEvents(events) {
        const cardContainer = document.querySelector('.row-1');
        cardContainer.innerHTML = ''; // Clear existing content

        events.forEach(event => {
            // Create and append event cards as per your existing logic
            // Example event card structure (modify as needed)
            const eventCard = document.createElement('div');
            eventCard.className = 'div-block-5';
            eventCard.style.opacity = '1';

            // Format the date and other details
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' | ' + eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

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

            cardContainer.appendChild(eventCard);
        });
    }

    // Add event listener to the search button
    document.getElementById('search-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        const query = document.getElementById('name').value;
        if (query) {
            const events = await searchEvents(query);
            populateEvents(events);
        }
    });
});
</script>
