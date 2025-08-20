// Global variables
let map;
let userLocation = null;
let userMarker = null;
let searchMarkers = [];
let gameStoreMarkers = [];
let hasRequestedLocationPermission = false;

// Gaming stores data (fixed content for your gaming website)
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
    displayGameStores();
    
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
            updateGameStoresDistances();
            
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
    updateGameStoresDistances();
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
    
    // Add game store markers
    addGameStoreMarkers();
    
    console.log('🗺️ Mapa inicializado');
}

// Add game store markers to map
function addGameStoreMarkers() {
    gameStores.forEach(store => {
        const storeIcon = L.divIcon({
            html: '🎮',
            className: 'game-store-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        const marker = L.marker([store.lat, store.lng], { icon: storeIcon })
            .addTo(map)
            .bindPopup(createGameStorePopupContent(store));
        
        gameStoreMarkers.push(marker);
    });
}

// Create game store popup content
function createGameStorePopupContent(store) {
    const stars = '⭐'.repeat(Math.floor(store.rating));
    const halfStar = (store.rating % 1) >= 0.5 ? '½' : '';
    
    return `
        <div style="min-width: 250px;">
            <h3 style="color: #00ff88; margin-bottom: 10px; text-align: center;">
                🎮 ${store.name}
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
    
    // Handle Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });
}

// Universal search function - finds any place near user
async function performSearch() {
    const searchInput = document.getElementById('placeSearchInput');
    const searchBtn = document.getElementById('searchBtn');
    const query = searchInput.value.trim();
    
    if (!query) {
        showStatusMessage('⚠️ Por favor escribe algo para buscar', 'error');
        return;
    }

    if (!userLocation) {
        showStatusMessage('⚠️ Primero necesitas permitir el acceso a tu ubicación', 'error');
        return;
    }
    
    // Update button state
    searchBtn.innerHTML = '<div class="loading"></div>';
    searchBtn.disabled = true;
    
    showStatusMessage(`🔍 Buscando "${query}" cerca de ti...`, 'info');
    
    try {
        // Clear previous search markers
        clearSearchMarkers();
        
        // Search using Nominatim API for universal search
        const results = await searchUniversalPlaces(query, userLocation.lat, userLocation.lng);
        
        if (results && results.length > 0) {
            showStatusMessage(`✅ Encontrados ${results.length} resultados para "${query}"`, 'success');
            displaySearchResults(results, query);
            addSearchMarkersToMap(results);
        } else {
            showStatusMessage(`❌ No se encontraron lugares para "${query}" cerca de ti`, 'error');
            hideResults();
        }
        
        setTimeout(() => hideStatusMessage(), 3000);
    } catch (error) {
        console.error('Search error:', error);
        showStatusMessage('❌ Error en la búsqueda. Intenta nuevamente.', 'error');
        setTimeout(() => hideStatusMessage(), 5000);
    }
    
    // Reset button
    searchBtn.innerHTML = '🔍';
    searchBtn.disabled = false;
}

// Universal search using Nominatim API
async function searchUniversalPlaces(query, lat, lng, radius = 0.1) {
    try {
        // Create bounding box around user location (radius in degrees)
        const bbox = [
            lng - radius,  // left
            lat - radius,  // bottom
            lng + radius,  // right
            lat + radius   // top
        ].join(',');
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&viewbox=${bbox}&bounded=1&limit=25&addressdetails=1&extratags=1`
        );
        
        if (!response.ok) throw new Error('API response not ok');
        
        const data = await response.json();
        
        // Process and filter results
        const places = data.map(element => {
            const placeLat = parseFloat(element.lat);
            const placeLng = parseFloat(element.lon);
            
            if (!placeLat || !placeLng) return null;
            
            const name = element.display_name.split(',')[0] || `Resultado para "${query}"`;
            const fullAddress = element.display_name;
            const phone = element.extratags?.phone || 'No disponible';
            const website = element.extratags?.website || null;
            const hours = element.extratags?.opening_hours || 'Consultar horarios';
            
            // Calculate distance
            const distance = calculateDistance(lat, lng, placeLat, placeLng);
            
            // Skip if too far (more than 50km)
            if (distance > 50) return null;
            
            return {
                id: element.place_id,
                name: name,
                lat: placeLat,
                lng: placeLng,
                address: fullAddress,
                phone: phone,
                hours: hours,
                website: website,
                distance: distance,
                type: getPlaceIcon(element.type, element.class)
            };
        }).filter(place => place !== null);
        
        // Sort by distance and return
        return places.sort((a, b) => a.distance - b.distance);
        
    } catch (error) {
        console.error('Universal search error:', error);
        throw error;
    }
}

// Get appropriate icon based on place type
function getPlaceIcon(type, className) {
    const iconMap = {
        'amenity': {
            'restaurant': '🍽️',
            'cafe': '☕',
            'hospital': '🏥',
            'pharmacy': '💊',
            'bank': '🏦',
            'fuel': '⛽',
            'cinema': '🎬',
            'school': '🏫',
            'university': '🎓',
            'bar': '🍺',
            'fast_food': '🍟',
            'hotel': '🏨'
        },
        'shop': {
            'supermarket': '🛒',
            'mall': '🏬',
            'clothes': '👕',
            'electronics': '📱',
            'books': '📚'
        },
        'leisure': {
            'park': '🌳',
            'stadium': '🏟️',
            'fitness_centre': '💪'
        },
        'tourism': {
            'hotel': '🏨',
            'attraction': '🎯',
            'museum': '🏛️'
        }
    };
    
    if (iconMap[className] && iconMap[className][type]) {
        return iconMap[className][type];
    }
    
    return '📍'; // Default pin
}

// Add search markers to map with RED pins
function addSearchMarkersToMap(results) {
    results.forEach((place, index) => {
        // Create RED marker for search results
        const icon = L.divIcon({
            html: `<div style="background: red; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
            className: 'search-result-marker',
            iconSize: [25, 25],
            iconAnchor: [12, 25],
            popupAnchor: [0, -25]
        });
        
        const marker = L.marker([place.lat, place.lng], { icon })
            .addTo(map)
            .bindPopup(createSearchPlacePopupContent(place, index + 1));
        
        searchMarkers.push(marker);
    });
    
    // Adjust map view to show all markers
    if (results.length > 0) {
        const allMarkers = [userMarker, ...searchMarkers];
        const group = new L.featureGroup(allMarkers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Create search place popup content
function createSearchPlacePopupContent(place, number) {
    return `
        <div style="min-width: 200px;">
            <h3 style="color: #dc3545; margin-bottom: 10px; text-align: center;">
                #${number} - ${place.name}
            </h3>
            <div style="margin: 8px 0; font-size: 0.9rem;">
                <div><strong>📍 Dirección:</strong><br>${place.address}</div>
                <div><strong>📞 Teléfono:</strong> ${place.phone}</div>
                <div><strong>🕒 Horarios:</strong> ${place.hours}</div>
                <div><strong>📏 Distancia:</strong> ${place.distance.toFixed(1)} km</div>
                ${place.website ? `<div><strong>🌐 Web:</strong> <a href="${place.website}" target="_blank">Visitar</a></div>` : ''}
            </div>
            <div style="display: flex; gap: 5px; margin-top: 10px;">
                <button onclick="showDirections(${place.lat}, ${place.lng}, '${place.name}')" 
                        style="flex: 1; background: #dc3545; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    🚗 Cómo llegar
                </button>
            </div>
        </div>
    `;
}

// Display search results
function displaySearchResults(results, searchQuery) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsList = document.getElementById('resultsList');
    
    if (!resultsSection || !resultsList) return;
    
    resultsTitle.textContent = `🔍 Resultados: ${searchQuery}`;
    resultsList.innerHTML = '';
    
    results.forEach((place, index) => {
        const placeCard = document.createElement('div');
        placeCard.className = 'store-card';
        placeCard.style.animationDelay = `${index * 0.1}s`;
        
        // Number for easy identification with map
        const number = index + 1;
        
        placeCard.innerHTML = `
            <span class="store-icon" style="background: red; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold;">${number}</span>
            <h3 class="store-name">${place.name}</h3>
            <p class="store-address">📍 ${place.address}</p>
            <div class="store-distance">📏 ${place.distance.toFixed(1)} km de distancia</div>
            <div class="store-rating">📞 ${place.phone}</div>
            ${place.website ? `<div style="margin: 0.5rem 0;"><a href="${place.website}" target="_blank" style="color: var(--primary-color);">🌐 Visitar sitio web</a></div>` : ''}
            <div class="store-actions">
                <button onclick="showPlaceOnMap(${place.lat}, ${place.lng}, '${place.name}', ${number})" 
                        class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    👁️ Ver en mapa
                </button>
                <button onclick="showDirections(${place.lat}, ${place.lng}, '${place.name}')" 
                        class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    🚗 Cómo llegar
                </button>
            </div>
        `;
        
        resultsList.appendChild(placeCard);
    });
    
    resultsSection.style.display = 'block';
    
    // Scroll to results section
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
}

// Display game stores
function displayGameStores() {
    const gameStoresList = document.getElementById('gameStoresList');
    if (!gameStoresList) return;
    
    gameStoresList.innerHTML = '';
    
    gameStores.forEach((store, index) => {
        const storeCard = document.createElement('div');
        storeCard.className = 'store-card';
        storeCard.style.animationDelay = `${index * 0.1}s`;
        
        const stars = '⭐'.repeat(Math.floor(store.rating));
        const halfStar = (store.rating % 1) >= 0.5 ? '½' : '';
        
        // Show distance if user location is available
        let distanceInfo = '';
        if (userLocation) {
            const distance = calculateDistance(
                userLocation.lat, userLocation.lng,
                store.lat, store.lng
            );
            distanceInfo = `<div class="store-distance">📏 ${distance.toFixed(1)} km de distancia</div>`;
        }
        
        storeCard.innerHTML = `
            <span class="store-icon">🎮</span>
            <h3 class="store-name">${store.name}</h3>
            <p class="store-address">📍 ${store.address}</p>
            ${distanceInfo}
            <div class="store-rating">${stars}${halfStar} (${store.rating}/5) • ${store.hours}</div>
            <div style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 1rem;">
                <strong>Especialidades:</strong> ${store.specialties.slice(0, 2).join(', ')}
            </div>
            <div class="store-actions">
                <button onclick="showGameStoreOnMap(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    👁️ Ver en mapa
                </button>
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
