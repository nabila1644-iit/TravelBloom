const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnReset = document.getElementById('btnReset');
const heroContent = document.querySelector('.hero-content');
const resultsSection = document.getElementById('resultsSection');
const resultContainer = document.getElementById('resultContainer');

let travelData = null;
let clockInterval = null;

// Map each destination from travel_recommendation_api_2.json to its IANA time zone
const timeZoneMap = {
    'Sydney, Australia': 'Australia/Sydney',
    'Melbourne, Australia': 'Australia/Melbourne',
    'Tokyo, Japan': 'Asia/Tokyo',
    'Kyoto, Japan': 'Asia/Tokyo',
    'Rio de Janeiro, Brazil': 'America/Sao_Paulo',
    'São Paulo, Brazil': 'America/Sao_Paulo',
    'Angkor Wat, Cambodia': 'Asia/Phnom_Penh',
    'Taj Mahal, India': 'Asia/Kolkata',
    'Bora Bora, French Polynesia': 'Pacific/Tahiti',
    'Copacabana Beach, Brazil': 'America/Sao_Paulo'
};

// Fetch data from travel_recommendation_api_2.json
fetch('travel_recommendation_api.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        travelData = data;
        console.log('Fetched Travel Recommendation Data:', travelData);
    })
    .catch(error => {
        console.error('Error fetching travel recommendations:', error);
    });

// Format current local time for a given destination
function getDestinationTime(placeName) {
    const timeZone = timeZoneMap[placeName];
    if (!timeZone) return '';

    const options = {
        timeZone: timeZone,
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };

    return new Date().toLocaleTimeString('en-US', options);
}

// Hide page description and render recommendation cards with local time
function displayRecommendations(items) {
    if (clockInterval) {
        clearInterval(clockInterval);
    }

    if (heroContent) {
        heroContent.style.display = 'none';
    }
    resultsSection.style.display = 'block';
    resultContainer.innerHTML = '';

    if (!items || items.length === 0) {
        resultContainer.innerHTML = `
            <div class="no-results">
                <p>No recommendations found. Try searching for "beach", "temple", "country", or a country name (e.g., Australia, Japan, Brazil).</p>
            </div>
        `;
        return;
    }

    items.forEach(place => {
        const currentTime = getDestinationTime(place.name);
        if (currentTime) {
            console.log(`Current time in ${place.name}:`, currentTime);
        }

        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <img src="${place.imageUrl}" alt="${place.name}">
            <div class="result-card-body">
                <h3>${place.name}</h3>
                <p>${place.description}</p>
                ${currentTime ? `<p class="local-time" data-place="${place.name}">Current Time: ${currentTime}</p>` : ''}
            </div>
        `;
        resultContainer.appendChild(card);
    });

    // Keep the displayed time ticking every second while results are visible
    clockInterval = setInterval(() => {
        const timeElements = document.querySelectorAll('.local-time');
        timeElements.forEach(el => {
            const placeName = el.getAttribute('data-place');
            const updatedTime = getDestinationTime(placeName);
            if (updatedTime) {
                el.textContent = `Current Time: ${updatedTime}`;
            }
        });
    }, 1000);
}

// Execute keyword search when the Search button is clicked
function searchRecommendations() {
    if (!travelData) {
        console.warn('Travel data is not loaded yet.');
        return;
    }

    const keyword = searchInput.value
        .trim()
        .toLowerCase()
        .replace(/[^a-z\s]/g, '');

    if (!keyword) {
        clearResults();
        return;
    }

    let matchedPlaces = [];

    if (keyword === 'beach' || keyword === 'beaches' || keyword.includes('beach')) {
        matchedPlaces = travelData.beaches;
    } else if (keyword === 'temple' || keyword === 'temples' || keyword.includes('temple')) {
        matchedPlaces = travelData.temples;
    } else if (keyword === 'country' || keyword === 'countries') {
        travelData.countries.forEach(country => {
            matchedPlaces.push(...country.cities);
        });
    } else {
        const matchedCountry = travelData.countries.find(
            country => country.name.toLowerCase() === keyword || country.name.toLowerCase().includes(keyword)
        );
        if (matchedCountry) {
            matchedPlaces = matchedCountry.cities;
        }
    }

    console.log(`Results for "${keyword}":`, matchedPlaces);
    displayRecommendations(matchedPlaces);
}

// Clear input, stop clock updates, hide results, and restore the Home page description
function clearResults() {
    if (clockInterval) {
        clearInterval(clockInterval);
    }
    searchInput.value = '';
    resultContainer.innerHTML = '';
    resultsSection.style.display = 'none';
    if (heroContent) {
        heroContent.style.display = 'block';
    }
}

btnSearch.addEventListener('click', searchRecommendations);
btnReset.addEventListener('click', clearResults);