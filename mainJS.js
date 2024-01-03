document.addEventListener('DOMContentLoaded', async function() {
    const realmAppId = 'comedybit-botzw'; // Replace with your Realm app ID
    const dbName = 'events'; // Replace with your database name
    const collectionName = 'finalEvents'; // Replace with your collection name
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
                                  '<img src="path-to-your-creator-icon" loading="lazy" alt="" class="creator-icon">' +
                                  '<div class="event-name">' + event.eventName + '</div>' +
                                  '</div></div>' +
                                  '<div class="bottom">' +
                                  '<div class="date">' + formattedDate + '</div>' +
                                  '<div class="venue">' + event.locationName + '</div>' +
                                  '</div>';

            // Add a click event listener to the newly created eventCard
            eventCard.addEventListener('click', function() {
                // Get the title from the clicked card
                const cardTitle = eventCard.querySelector('.event-name').textContent;

                // Update the popup text block content with the card's title
                const popupTextBlock = document.getElementById('popup-text-block');
                popupTextBlock.textContent = cardTitle;
            });

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

    // Get all event cards (assuming they share a common class)
    const eventCards = document.querySelectorAll('.div-block-5');

    // Get the popup text block element by its ID
    const popupTextBlock = document.getElementById('popup-text-block');

    // Loop through each event card and add a click event handler
    eventCards.forEach(function(card) {
        card.addEventListener('click', function() {
            // Get the title from the clicked card
            const cardTitle = card.querySelector('.event-name').textContent;

            // Update the popup text block content with the card's title
            popupTextBlock.textContent = cardTitle;
        });
    });
});
