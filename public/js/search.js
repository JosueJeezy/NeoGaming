// Global variables
let map;
let userLocation = null;
let userMarker = null;
let storeMarkers = [];
let searchMarkers = [];
let searchResultMarkers = [];
let hasRequestedLocationPermission = false;
let currentSearchQuery = '';

// Sample gaming stores data
const gameStores = [
    {
        id: 1,
        name: 'GameStop Centro',
        lat: 31.6904 + 0.01,
        lng: -106.4245 + 0.01,
        address: 'Av. 16 de Septiembre 123, Centro',
        phone: '+52 656 123-4567',
        hours: 'Lun-Sáb: 10:00 - 22:00',
        rating: 4.5,
        specialties: ['Consolas', 'Videojuegos nuevos', 'Accesorios']
    },
    {
        id: 2,
        name: 'ElectroGamer Plaza',
        lat: 31.6904 - 0.015,
        lng: -106.4245 + 0.02,
        address: 'Blvd. Teófilo Borunda 456, Pronaf',
        phone: '+52 656 234-5678',
        hours: 'Lun-Dom: 11:00 - 21:00',
        rating: 4.2,
        specialties: ['PC Gaming', 'Hardware', 'Streaming']
    },
    {
        id: 3,
        name: 'Retro Gaming House',
        lat: 31.6904 + 0.02,
        lng: -106.4245 - 0.01,
        address: 'Calle Mariscal 789, Mariano Matamoros',
        phone: '+52 656 345-6789',
        hours: 'Mar-Dom: 12:00 - 20:00',
        rating: 4.8,
        specialties: ['Juegos retro', 'Consolas clásicas', 'Coleccionables']
    },
    {
        id: 4,
        name: 'TecnoJuegos Mall',
        lat: 31.6904 - 0.02,
        lng: -106.4245 - 0.015,
        address: 'Las Misiones Mall, Local 45',
        phone: '+52 656 456-7890',
        hours: 'Lun-Dom: 10:00 - 22:00',
        rating: 4.3,
        specialties: ['Última generación', 'VR', 'E-sports']
    },
    {
        id: 5,
        name: 'Cyber Games Café',
        lat: 31.6904 + 0.008,
        lng: -106.4245 + 0.025,
        address: 'Av. Universidad 321, UACJ',
        phone: '+52 656 567-8901',
        hours: '24 horas',
        rating: 4.1,
        specialties: ['Internet café', 'Torneos', 'Gaming lounge']
    }
];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Inicializando página de búsqueda...');
    initializePage();
});

// Initialize the page
function initializePage() {
    initializeMap();
    setupSearchInput();
    displayGamingStores();
    
    // Show location permission modal after a brief delay
    setTimeout(() => {
        showLocationPermissionModal();
    }, 1000);
}

// Show location permission modal
function showLocationPermissionModal() {
    if (!hasRequestedLocationPermission) {
        const modal = document.getElementById('locationPermissionModal');
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        }, 10);
    }
}

// Accept location permission
function acceptLocationPermission() {
    hideLocationPermissionModal();
    requestLocationAccess();
}

// Decline location permission
function declineLocationPermission() {
    hideLocationPermissionModal();
    showStatusMessage('Puedes buscar lugares manualmente usando el buscador', 'info');
    useDefaultLocation();
}

// Hide location permission modal
function hideLocationPermissionModal() {
    hasRequestedLocationPermission = true;
    const modal = document.getElementById('locationPermissionModal');
    modal.style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Request location access
function requestLocationAccess() {
    showStatusMessage('🎯 Obteniendo tu ubicación...', 'info');
    
    if (!navigator.geolocation) {
        showStatusMessage('❌ Geolocalización no soportada en este navegador', 'error');
        useDefaultLocation();
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = { lat: latitude, lng: longitude };
            
            showStatusMessage('✅ Ubicación obtenida correctamente', 'success');
            updateMapWithUserLocation(latitude, longitude);
            showLocationInfo(latitude, longitude);
            
            setTimeout(() => hideStatusMessage(), 3000);
        },
        (error) => {
            console.warn('Error getting location:', error);
            let message = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    message = '❌ Acceso a ubicación denegado';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = '⚠️ Ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    message = '⏰ Tiempo de espera agotado';
                    break;
                default:
                    message = '❌ Error desconocido';
                    break;
            }
            
            showStatusMessage(message + ' - usando ubicación por defecto', 'error');
            useDefaultLocation();
            
            setTimeout(() => hideStatusMessage(), 5000);
        },
        options
    );
}

// Request location manually (button click)
function requestLocationManually() {
    requestLocationAccess();
}

// Use default location (Ciudad Juárez)
function useDefaultLocation() {
    const defaultLat = 31.6904;
    const defaultLng = -106.4245;
    
    userLocation = { lat: defaultLat, lng: defaultLng };
    updateMapWithUserLocation(defaultLat, defaultLng);
    showLocationInfo(defaultLat, defaultLng, true);
}

// Initialize map
function initializeMap() {
    const defaultLat = 31.6904;
    const defaultLng = -106.4245;
    
    map = L.map('map', {
        zoomControl: true,
        attributionControl: true
    }).setView([defaultLat, defaultLng], 13);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 3
    }).addTo(map);
    
    console.log('🗺️ Mapa inicializado');
}

// Update map with user location
function updateMapWithUserLocation(lat, lng) {
    // Remove existing user marker
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    // Create user location icon
    const userIcon = L.divIcon({
        html: '📍',
        className: 'user-location-marker',
        iconSize: [35, 35],
        iconAnchor: [17, 35],
        popupAnchor: [0, -35]
    });
    
    // Add user marker
    userMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('📍 Tu ubicación actual')
        .openPopup();
    
    // Center map with smooth animation
    map.flyTo([lat, lng], 14, {
        animate: true,
        duration: 2
    });
    
    // Add gaming store markers after user location is set
    addGamingStoreMarkers();
}

// Show location info
function showLocationInfo(lat, lng, isDefault = false) {
    const locationInfo = document.getElementById('locationInfo');
    const locationContent = document.getElementById('locationContent');
    
    if (!locationInfo || !locationContent) return;
    
    const locationText = isDefault ? 'Ciudad Juárez, Chihuahua (Ubicación por defecto)' : 'Tu ubicación actual';
    
    locationContent.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 15px;">📍</div>
        <h3 style="color: var(--primary-color); margin-bottom: 10px;">
            ${isDefault ? '🌎' : '✅'} ${locationText}
        </h3>
        <div style="color: var(--text-gray); margin-bottom: 15px;">
            <strong>Coordenadas:</strong><br>
            Lat: ${lat.toFixed(6)}° | Lng: ${lng.toFixed(6)}°
        </div>
        <div style="color: var(--text-light);">
            🔍 ¡Busca cualquier lugar en el buscador de arriba!
        </div>
    `;
    
    locationInfo.style.display = 'block';
    locationInfo.style.opacity = '0';
    
    setTimeout(() => {
        locationInfo.style.transition = 'opacity 0.5s ease';
        locationInfo.style.opacity = '1';
    }, 100);
}

// Setup search input functionality
function setupSearchInput() {
    const searchInput = document.getElementById('placeSearchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    const clearBtn = document.getElementById('searchClearBtn');
    
    let searchTimeout;
    
    // Handle input changes
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Show/hide clear button
        clearBtn.style.display = query ? 'block' : 'none';
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            hideSuggestions();
            return;
        }
        
        searchTimeout = setTimeout(() => {
            showSearchSuggestions(query);
        }, 300);
    });
    
    // Handle Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            hideSuggestions();
        }
    });
}

// Clear search input
function clearSearch() {
    const searchInput = document.getElementById('placeSearchInput');
    const clearBtn = document.getElementById('searchClearBtn');
    
    searchInput.value = '';
    clearBtn.style.display = 'none';
    hideSuggestions();
    
    // Clear search results
    clearSearchResults();
    searchInput.focus();
}

// Quick search functionality
function quickSearch(query) {
    const searchInput = document.getElementById('placeSearchInput');
    searchInput.value = query;
    document.getElementById('searchClearBtn').style.display = 'block';
    performSearch();
}

// Show search suggestions
async function showSearchSuggestions(query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    // Show common suggestions immediately
    showCommonSuggestions(query);
}

// Show common suggestions
function showCommonSuggestions(query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    const queryLower = query.toLowerCase();
    
    const commonPlaces = [
        { name: 'Cines', icon: '🎬', keywords: ['cine', 'cinema', 'movie'] },
        { name: 'Restaurantes', icon: '🍽️', keywords: ['restaurant', 'comida', 'food'] },
        { name: 'Hospitales', icon: '🏥', keywords: ['hospital', 'clinic', 'medico'] },
        { name: 'Farmacias', icon: '💊', keywords: ['farmacia', 'pharmacy', 'medicina'] },
        { name: 'Bancos', icon: '🏦', keywords: ['banco', 'bank', 'cajero', 'atm'] },
        { name: 'Gasolineras', icon: '⛽', keywords: ['gasolinera', 'gas', 'combustible'] },
        { name: 'Supermercados', icon: '🛒', keywords: ['super', 'mercado', 'tienda', 'market'] },
        { name: 'Hoteles', icon: '🏨', keywords: ['hotel', 'motel', 'hospedaje'] },
        { name: 'Escuelas', icon: '🏫', keywords: ['escuela', 'school', 'colegio'] },
        { name: 'Parques', icon: '🌳', keywords: ['parque', 'park', 'jardin'] },
        { name: 'Centros comerciales', icon: '🏬', keywords: ['mall', 'centro comercial', 'plaza'] },
        { name: 'Cafeterías', icon: '☕', keywords: ['cafe', 'coffee', 'starbucks'] }
    ];
    
    const filtered = commonPlaces.filter(place => 
        place.keywords.some(keyword => 
            keyword.includes(queryLower) || queryLower.includes(keyword)
        )
    ).slice(0, 6);
    
    if (filtered.length > 0) {
        const suggestionsHTML = filtered.map(place => 
            `<div class="suggestion-item" onclick="selectSearchSuggestion('${place.name}')">
                <span>${place.icon}</span>
                <span>${place.name}</span>
            </div>`
        ).join('');
        
        suggestionsDiv.innerHTML = suggestionsHTML;
        suggestionsDiv.style.display = 'block';
    } else {
        hideSuggestions();
    }
}

// Select a suggestion from dropdown
function selectSearchSuggestion(suggestion) {
    const searchInput = document.getElementById('placeSearchInput');
    searchInput.value = suggestion;
    document.getElementById('searchClearBtn').style.display = 'block';
    hideSuggestions();
    performSearch();
}

// Hide suggestions dropdown
function hideSuggestions() {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    suggestionsDiv.style.display = 'none';
}

// Perform search when button clicked or Enter pressed
async function performSearch() {
    const searchInput = document.getElementById('placeSearchInput');
    const searchBtn = document.getElementById('searchBtn');
    const query = searchInput.value.trim();
    
    if (!query) {
        showStatusMessage('⚠️ Por favor ingresa algo para buscar', 'error');
        return;
    }
    
    if (!userLocation) {
        showStatusMessage('⚠️ Esperando ubicación. Intenta de nuevo en un momento.', 'error');
        return;
    }
    
    currentSearchQuery = query;
    
    // Update button state
    searchBtn.innerHTML = '<div class="loading-spinner"></div>';
    searchBtn.disabled = true;
    
    showStatusMessage(`🔍 Buscando ${query}...`, 'info');
    
    try {
        await searchPlaces(query);
    } catch (error) {
        console.error('Search error:', error);
        showStatusMessage('❌ Error en la búsqueda. Intenta de nuevo.', 'error');
    } finally {
        // Reset button
        searchBtn.innerHTML = '🔍';
        searchBtn.disabled = false;
        hideSuggestions();
    }
}

// Search places using Overpass API (OpenStreetMap)
async function searchPlaces(query) {
    const { lat, lng } = userLocation;
    const radius = 10000; // 10km radius
    
    // Clear previous search results
    clearSearchResults();
    
    // Create Overpass query for different types of places
    const overpassQuery = buildOverpassQuery(query, lat, lng, radius);
    
    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            processSearchResults(data.elements, query);
        } else {
            throw new Error('Overpass API error');
        }
    } catch (error) {
        console.log('Overpass API failed, trying Nominatim fallback');
        await searchWithNominatim(query);
    }
}

// Build Overpass query based on search term
function buildOverpassQuery(query, lat, lng, radius) {
    const queryLower = query.toLowerCase();
    let amenities = [];
    let shops = [];
    let leisure = [];
    let healthcare = [];
    let tourism = [];
    
    // Map search terms to OSM tags
    if (queryLower.includes('cine') || queryLower.includes('cinema')) {
        amenities.push('cinema');
    }
    if (queryLower.includes('restaurant') || queryLower.includes('comida')) {
        amenities.push('restaurant', 'fast_food', 'food_court');
    }
    if (queryLower.includes('hospital') || queryLower.includes('medico') || queryLower.includes('clinic')) {
        amenities.push('hospital', 'clinic');
        healthcare.push('hospital', 'clinic');
    }
    if (queryLower.includes('farmacia') || queryLower.includes('pharmacy')) {
        amenities.push('pharmacy');
    }
    if (queryLower.includes('banco') || queryLower.includes('bank') || queryLower.includes('cajero')) {
        amenities.push('bank', 'atm');
    }
    if (queryLower.includes('gasolinera') || queryLower.includes('gas')) {
        amenities.push('fuel');
    }
    if (queryLower.includes('super') || queryLower.includes('mercado') || queryLower.includes('tienda')) {
        shops.push('supermarket', 'convenience', 'mall');
        amenities.push('marketplace');
    }
    if (queryLower.includes('hotel') || queryLower.includes('hospedaje')) {
        tourism.push('hotel', 'motel', 'hostel');
    }
    if (queryLower.includes('escuela') || queryLower.includes('school') || queryLower.includes('colegio')) {
        amenities.push('school', 'university', 'college');
    }
    if (queryLower.includes('parque') || queryLower.includes('park')) {
        leisure.push('park', 'playground');
    }
    if (queryLower.includes('mall') || queryLower.includes('centro comercial') || queryLower.includes('plaza')) {
        shops.push('mall', 'department_store');
    }
    if (queryLower.includes('cafe') || queryLower.includes('coffee')) {
        amenities.push('cafe', 'bar');
    }
    
    // If no specific matches, search broadly
    if (amenities.length === 0 && shops.length === 0 && leisure.length === 0 && healthcare.length === 0 && tourism.length === 0) {
        // Generic search - include common amenities
        amenities = ['restaurant', 'bank', 'hospital', 'pharmacy', 'fuel', 'cinema', 'school'];
        shops = ['supermarket', 'mall', 'convenience'];
    }
    
    let queries = [];
    
    // Build individual queries for each category
    if (amenities.length > 0) {
        amenities.forEach(amenity => {
            queries.push(`node["amenity"="${amenity}"](around:${radius},${lat},${lng});`);
            queries.push(`way["amenity"="${amenity}"](around:${radius},${lat},${lng});`);
        });
    }
    
    if (shops.length > 0) {
        shops.forEach(shop => {
            queries.push(`node["shop"="${shop}"](around:${radius},${lat},${lng});`);
            queries.push(`way["shop"="${shop}"](around:${radius},${lat},${lng});`);
        });
    }
    
    if (leisure.length > 0) {
        leisure.forEach(item => {
            queries.push(`node["leisure"="${item}"](around:${radius},${lat},${lng});`);
            queries.push(`way["leisure"="${item}"](around:${radius},${lat},${lng});`);
        });
    }
    
    if (healthcare.length > 0) {
        healthcare.forEach(item => {
            queries.push(`node["healthcare"="${item}"](around:${radius},${lat},${lng});`);
            queries.push(`way["healthcare"="${item}"](around:${radius},${lat},${lng});`);
        });
    }
    
    if (tourism.length > 0) {
        tourism.forEach(item => {
            queries.push(`node["tourism"="${item}"](around:${radius},${lat},${lng});`);
            queries.push(`way["tourism"="${item}"](around:${radius},${lat},${lng});`);
        });
    }
    
    const fullQuery = `
        [out:json][timeout:25];
        (
            ${queries.join('\n            ')}
        );
        out center meta;
    `;
    
    return fullQuery;
}

// Process search results from Overpass API
function processSearchResults(elements, query) {
    if (!elements || elements.length === 0) {
        showStatusMessage(`❌ No se encontraron ${query} cerca de tu ubicación`, 'error');
        setTimeout(() => hideStatusMessage(), 5000);
        return;
    }
    
    const places = elements.map(element => {
        const lat = element.lat || (element.center && element.center.lat);
        const lng = element.lon || (element.center && element.center.lon);
        
        if (!lat || !lng) return null;
        
        const name = element.tags?.name || element.tags?.brand || getGenericName(element.tags);
        const address = buildAddress(element.tags);
        const phone = element.tags?.phone || element.tags?.['contact:phone'] || '';
        const hours = element.tags?.opening_hours || '';
        const website = element.tags?.website || element.tags?.['contact:website'] || '';
        
        // Calculate distance
        const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
        
        return {
            id: element.id,
            name: name,
            lat: lat,
            lng: lng,
            address: address,
            phone: phone,
            hours: hours,
            website: website,
            distance: distance,
            type: getPlaceType(element.tags)
        };
    }).filter(place => place !== null);
    
    // Sort by distance
    places.sort((a, b) => a.distance - b.distance);
    
    // Display results
    displaySearchResults(places, query);
    addSearchResultMarkers(places);
    
    showStatusMessage(`✅ Encontrados ${places.length} ${query}`, 'success');
    setTimeout(() => hideStatusMessage(), 3000);
}

// Fallback search using Nominatim
async function searchWithNominatim(query) {
    const { lat, lng } = userLocation;
    
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=20&q=${encodeURIComponent(query)}&viewbox=${lng-0.1},${lat+0.1},${lng+0.1},${lat-0.1}&bounded=1&addressdetails=1`
        );
        
        if (response.ok) {
            const results = await response.json();
            
            if (results && results.length > 0) {
                const places = results.map((result, index) => ({
                    id: `nominatim_${index}`,
                    name: result.display_name.split(',')[0],
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    address: result.display_name.split(',').slice(1, 3).join(',').trim(),
                    phone: '',
                    hours: '',
                    website: '',
                    distance: calculateDistance(userLocation.lat, userLocation.lng, parseFloat(result.lat), parseFloat(result.lon)),
                    type: result.type || 'place'
                }));
                
                // Sort by distance
                places.sort((a, b) => a.distance - b.distance);
                
                displaySearchResults(places, query);
                addSearchResultMarkers(places);
                
                showStatusMessage(`✅ Encontrados ${places.length} resultados para ${query}`, 'success');
                setTimeout(() => hideStatusMessage(), 3000);
            } else {
                showStatusMessage(`❌ No se encontraron resultados para ${query}`, 'error');
                setTimeout(() => hideStatusMessage(), 5000);
            }
        } else {
            throw new Error('Nominatim API error');
        }
    } catch (error) {
        showStatusMessage(`❌ Error en la búsqueda de ${query}. Intenta de nuevo.`, 'error');
        setTimeout(() => hideStatusMessage(), 5000);
    }
}

// Get generic name based on tags
function getGenericName(tags) {
    if (tags.amenity) return tags.amenity.charAt(0).toUpperCase() + tags.amenity.slice(1);
    if (tags.shop) return tags.shop.charAt(0).toUpperCase() + tags.shop.slice(1);
    if (tags.leisure) return tags.leisure.charAt(0).toUpperCase() + tags.leisure.slice(1);
    if (tags.tourism) return tags.tourism.charAt(0).toUpperCase() + tags.tourism.slice(1);
    return 'Lugar';
}

// Build address from OSM tags
function buildAddress(tags) {
    const parts = [];
    
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:neighbourhood']) parts.push(tags['addr:neighbourhood']);
    if (tags['addr:suburb']) parts.push(tags['addr:suburb']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    
    return parts.join(', ') || 'Dirección no disponible';
}

// Get place type icon
function getPlaceType(tags) {
    const typeIcons = {
        cinema: '🎬',
        restaurant: '🍽️',
        fast_food: '🍔',
        hospital: '🏥',
        clinic: '🏥',
        pharmacy: '💊',
        bank: '🏦',
        atm: '🏧',
        fuel: '⛽',
        supermarket: '🛒',
        mall: '🏬',
        hotel: '🏨',
        school: '🏫',
        university: '🎓',
        park: '🌳',
        cafe: '☕'
    };
    
    if (tags.amenity && typeIcons[tags.amenity]) return typeIcons[tags.amenity];
    if (tags.shop && typeIcons[tags.shop]) return typeIcons[tags.shop];
    if (tags.leisure && typeIcons[tags.leisure]) return typeIcons[tags.leisure];
    if (tags.tourism && typeIcons[tags.tourism]) return typeIcons[tags.tourism];
    
    return '📍';
}

// Display search results
function displaySearchResults(places, query) {
    const resultsSection = document.getElementById('searchResultsSection');
    const resultsList = document.getElementById('searchResultsList');
    const resultsTitle = document.getElementById('searchResultsTitle');
    
    if (!places || places.length === 0) return;
    
    resultsTitle.textContent = `📍 ${places.length} resultados para "${query}"`;
    resultsList.innerHTML = '';
    
    places.slice(0, 20).forEach((place, index) => {
        const resultCard = document.createElement('div');
        resultCard.className = 'search-result-card';
        resultCard.style.animationDelay = `${index * 0.1}s`;
        
        // Medal for closest results
        let badge = '';
        if (index === 0) badge = '🥇 ';
        else if (index === 1) badge = '🥈 ';
        else if (index === 2) badge = '🥉 ';
        
        resultCard.innerHTML = `
            <div class="search-result-name">${place.type} ${badge}${place.name}</div>
            <div class="search-result-address">📍 ${place.address}</div>
            <div class="search-result-distance">🎯 ${place.distance.toFixed(1)} km de distancia</div>
            ${place.phone ? `<div style="color: var(--text-gray); margin: 0.25rem 0;">📞 ${place.phone}</div>` : ''}
            ${place.hours ? `<div style="color: var(--text-gray); margin: 0.25rem 0;">🕒 ${place.hours}</div>` : ''}
            <div class="search-result-actions">
                <button onclick="showPlaceOnMap(${place.lat}, ${place.lng}, '${place.name.replace(/'/g, "\\'")}', '${place.type}')" 
                        class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    👁️ Ver en mapa
                </button>
                <button onclick="showDirections(${place.lat}, ${place.lng}, '${place.name.replace(/'/g, "\\'")}', true)" 
                        class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    🚗 Cómo llegar
                </button>
            </div>
        `;
        
        resultsList.appendChild(resultCard);
    });
    
    resultsSection.style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

// Add search result markers to map
function addSearchResultMarkers(places) {
    // Clear previous search result markers
    clearSearchResultMarkers();
    
    places.slice(0, 20).forEach((place, index) => {
        // Create red pin marker
        const resultMarker = L.divIcon({
            html: '📍',
            className: 'search-result-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        const marker = L.marker([place.lat, place.lng], { icon: resultMarker })
            .addTo(map)
            .bindPopup(createSearchResultPopupContent(place));
        
        searchResultMarkers.push(marker);
    });
    
    // If we have results, fit map to show all markers
    if (places.length > 0) {
        const group = new L.featureGroup([...searchResultMarkers, userMarker].filter(m => m));
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Create search result popup content
function createSearchResultPopupContent(place) {
    return `
        <div class="search-result-popup">
            <h4>${place.type} ${place.name}</h4>
            <div class="info"><strong>📍 Dirección:</strong><br>${place.address}</div>
            <div class="info"><strong>🎯 Distancia:</strong> ${place.distance.toFixed(1)} km</div>
            ${place.phone ? `<div class="info"><strong>📞 Teléfono:</strong> ${place.phone}</div>` : ''}
            ${place.hours ? `<div class="info"><strong>🕒 Horarios:</strong> ${place.hours}</div>` : ''}
            <div style="display: flex; gap: 5px; margin-top: 10px;">
                <button onclick="showDirections(${place.lat}, ${place.lng}, '${place.name.replace(/'/g, "\\'")}', true)" 
                        style="flex: 1; background: #00ff88; color: #000; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    🚗 Cómo llegar
                </button>
                <button onclick="map.setView([${place.lat}, ${place.lng}], 17)" 
                        style="background: #007acc; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">
                    🔍 Zoom
                </button>
            </div>
        </div>
    `;
}

// Clear search result markers
function clearSearchResultMarkers() {
    searchResultMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    searchResultMarkers = [];
}

// Clear search results
function clearSearchResults() {
    const resultsSection = document.getElementById('searchResultsSection');
    resultsSection.style.display = 'none';
    clearSearchResultMarkers();
}

// Show place on map
function showPlaceOnMap(lat, lng, placeName, placeType) {
    // Animate to place location
    map.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.5
    });
    
    // Find and open popup for the corresponding marker
    searchResultMarkers.forEach(marker => {
        const markerLat = marker.getLatLng().lat;
        const markerLng = marker.getLatLng().lng;
        
        if (Math.abs(markerLat - lat) < 0.001 && Math.abs(markerLng - lng) < 0.001) {
            setTimeout(() => {
                marker.openPopup();
            }, 1600);
        }
    });
    
    // Scroll to map
    setTimeout(() => {
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    }, 200);
    
    showStatusMessage(`📍 Mostrando ${placeName} en el mapa`, 'success');
    setTimeout(() => hideStatusMessage(), 3000);
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Display gaming stores section
function displayGamingStores() {
    const storesList = document.getElementById('storesList');
    
    storesList.innerHTML = '';
    
    gameStores.forEach((store, index) => {
        const storeCard = document.createElement('div');
        storeCard.className = 'store-card';
        storeCard.style.animationDelay = `${index * 0.1}s`;
        
        const stars = '⭐'.repeat(Math.floor(store.rating));
        const halfStar = (store.rating % 1) >= 0.5 ? '½' : '';
        
        storeCard.innerHTML = `
            <span class="store-icon">🎮</span>
            <h3 class="store-name">${store.name}</h3>
            <p class="store-address">📍 ${store.address}</p>
            <div class="store-rating">${stars}${halfStar} (${store.rating}/5) • ${store.hours}</div>
            <div style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 1rem;">
                <strong>Especialidades:</strong> ${store.specialties.slice(0, 2).join(', ')}
            </div>
            <div class="store-actions">
                <button onclick="showStoreOnMap(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    👁️ Ver en mapa
                </button>
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    🚗 Cómo llegar
                </button>
            </div>
        `;
        
        storesList.appendChild(storeCard);
    });
}

// Add gaming store markers to map
function addGamingStoreMarkers() {
    // Clear existing store markers
    storeMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    storeMarkers = [];
    
    gameStores.forEach(store => {
        const storeIcon = L.divIcon({
            html: '🎮',
            className: 'store-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        const marker = L.marker([store.lat, store.lng], { icon: storeIcon })
            .addTo(map)
            .bindPopup(createStorePopupContent(store));
        
        storeMarkers.push(marker);
    });
}

// Create store popup content
function createStorePopupContent(store) {
    const stars = '⭐'.repeat(Math.floor(store.rating));
    const halfStar = (store.rating % 1) >= 0.5 ? '½' : '';
    
    return `
        <div style="min-width: 250px;">
            <h3 style="color: #00ff88; margin-bottom: 10px; text-align: center;">
                ${store.name}
            </h3>
            <div style="margin: 8px 0; font-size: 0.9rem;">
                <div><strong>📍 Dirección:</strong><br>${store.address}</div>
                <div><strong>📞 Teléfono:</strong> ${store.phone}</div>
                <div><strong>🕒 Horarios:</strong> ${store.hours}</div>
                <div><strong>⭐ Rating:</strong> ${stars}${halfStar} (${store.rating}/5)</div>
            </div>
            <div style="margin: 10px 0; padding: 8px; background: #f0f0f0; border-radius: 5px;">
                <strong>🎮 Especialidades:</strong><br>
                ${store.specialties.join(', ')}
            </div>
            <div style="display: flex; gap: 5px; margin-top: 10px;">
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        style="flex: 1; background: #00ff88; color: #000; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    🚗 Cómo llegar
                </button>
                <button onclick="map.setView([${store.lat}, ${store.lng}], 17)" 
                        style="background: #007acc; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer;">
                    🔍 Zoom
                </button>
            </div>
        </div>
    `;
}

// Show store on map
function showStoreOnMap(lat, lng, storeName) {
    // Animate to store location
    map.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.5
    });
    
    // Find and open popup for the corresponding marker
    storeMarkers.forEach(marker => {
        const markerLat = marker.getLatLng().lat;
        const markerLng = marker.getLatLng().lng;
        
        if (Math.abs(markerLat - lat) < 0.001 && Math.abs(markerLng - lng) < 0.001) {
            setTimeout(() => {
                marker.openPopup();
            }, 1600);
        }
    });
    
    // Scroll to map
    setTimeout(() => {
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    }, 200);
    
    showStatusMessage(`📍 Mostrando ${storeName} en el mapa`, 'success');
    setTimeout(() => hideStatusMessage(), 3000);
}

// Find nearby gaming stores
function findNearbyStores() {
    if (!userLocation) {
        showStatusMessage('⚠️ Ubicación no disponible. Obtén tu ubicación primero.', 'error');
        return;
    }
    
    showStatusMessage('🎮 Calculando distancias a tiendas...', 'info');
    
    // Calculate distances and update display
    const storesWithDistance = gameStores.map(store => {
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            store.lat, store.lng
        );
        return { ...store, distance };
    }).sort((a, b) => a.distance - b.distance);
    
    // Update the store cards with distance information
    updateStoreCardsWithDistance(storesWithDistance);
    
    showStatusMessage(`✅ Distancias calculadas para ${storesWithDistance.length} tiendas`, 'success');
    setTimeout(() => hideStatusMessage(), 3000);
    
    // Scroll to stores section
    setTimeout(() => {
        document.getElementById('storesSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

// Update store cards with distance information
function updateStoreCardsWithDistance(storesWithDistance) {
    const storesList = document.getElementById('storesList');
    storesList.innerHTML = '';
    
    storesWithDistance.forEach((store, index) => {
        const storeCard = document.createElement('div');
        storeCard.className = 'store-card';
        storeCard.style.animationDelay = `${index * 0.1}s`;
        
        // Medal for closest stores
        let badge = '';
        if (index === 0) badge = '🥇 ';
        else if (index === 1) badge = '🥈 ';
        else if (index === 2) badge = '🥉 ';
        
        const stars = '⭐'.repeat(Math.floor(store.rating));
        const halfStar = (store.rating % 1) >= 0.5 ? '½' : '';
        
        storeCard.innerHTML = `
            <span class="store-icon">🎮</span>
            <h3 class="store-name">${badge}${store.name}</h3>
            <p class="store-address">📍 ${store.address}</p>
            <div class="store-distance">🎯 ${store.distance.toFixed(1)} km de distancia</div>
            <div class="store-rating">${stars}${halfStar} (${store.rating}/5) • ${store.hours}</div>
            <div style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 1rem;">
                <strong>Especialidades:</strong> ${store.specialties.slice(0, 2).join(', ')}
            </div>
            <div class="store-actions">
                <button onclick="showStoreOnMap(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    👁️ Ver en mapa
                </button>
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    🚗 Cómo llegar
                </button>
            </div>
        `;
        
        storesList.appendChild(storeCard);
    });
}

// Show directions to store/place
function showDirections(lat, lng, placeName, isSearchResult = false) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}`;
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            
            <div style="font-size: 4rem; margin-bottom: 1rem; text-align: center;">🗺️</div>
            
            <h3 style="color: var(--primary-color); margin-bottom: 0.5rem; font-size: 1.5rem; text-align: center;">
                Cómo llegar a
            </h3>
            <p style="color: var(--text-light); font-weight: bold; margin-bottom: 2rem; font-size: 1.1rem; text-align: center;">
                ${placeName}
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem;">
                <a href="${googleMapsUrl}" target="_blank" 
                   class="btn btn-primary" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span>🗺️</span> Abrir en Google Maps
                </a>
                <a href="${appleMapsUrl}" target="_blank" 
                   class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span>🍎</span> Abrir en Apple Maps
                </a>
                <a href="${wazeUrl}" target="_blank" 
                   class="btn btn-secondary" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span>🚗</span> Abrir en Waze
                </a>
            </div>
            
            <div style="color: var(--text-gray); font-size: 0.9rem; line-height: 1.4; text-align: center;">
                Se abrirá tu aplicación de navegación preferida
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Status message functions
function showStatusMessage(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    
    statusDiv.className = `alert alert-${type}`;
    statusDiv.innerHTML = message;
    statusDiv.style.display = 'block';
}

function hideStatusMessage() {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.style.display = 'none';
}

console.log('🎮 Página de búsqueda cargada completamente');
