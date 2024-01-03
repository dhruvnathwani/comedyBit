document.addEventListener('DOMContentLoaded', async function() {
    const realmAppId = 'comedybit-botzw';
    const dbName = 'events';
    const collectionName = 'finalEvents';
    const app = new Realm.App({ id: realmAppId });
    let currentCity = 'Los Angeles';

    async function login() {
        try {
            return await app.logIn(Realm.Credentials.anonymous());
        } catch (error) {
            console.error('Error logging in:', error);
            return null;
        }
    }

    async function fetchCitiesAndData(city) {
        const user = await login();
        if (user) {
            const cities = await user.functions.getDistinctCities();
            populateCitySearch(cities);
            fetchData(city);
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

        citySearch.value = currentCity;

        citySearch.addEventListener('change', (event) => {
            currentCity = event.target.value;
            fetchData(currentCity);
        });
    }

    async function fetchData(city) {
        const user = await login();
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

    function createEventCard(event) {
        console.log("Creating event card for:", event.eventName);
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

        eventCard.addEventListener('click', () => {
            console.log("Event card clicked:", event.eventName);
            const popupTextBlock = document.getElementById('popup-text-block');
            const eventName = eventCard.querySelector('.event-name').textContent;
            const eventVenue = eventCard.querySelector('.venue').textContent;

            popupTextBlock.innerHTML = eventName + '<br>' + formattedDate + '<br>' + eventVenue;
        });

        return eventCard;
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
                card.style.display = (!filterFunction or filterFunction(eventDate)) ? '' : 'none';
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
});
