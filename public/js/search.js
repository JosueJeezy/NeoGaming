// Global variables
let map;
let userLocation = null;
let userMarker = null;
let searchMarkers = [];
let hasRequestedLocationPermission = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Inicializando página de búsqueda...');
    initializePage();
});

// Initialize the page
function initializePage() {
    initializeMap();
    setupSearchInput();
    
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
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
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

// Hide suggestions dropdown
function hideSuggestions() {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    suggestionsDiv.style.display = 'none';
}

// Quick search function
function quickSearch(query) {
    const searchInput = document.getElementById('placeSearchInput');
    searchInput.value = query;
    performSearch();
}

// Perform search for places near user
async function performSearch() {
    const searchInput = document.getElementById('placeSearchInput');
    const searchBtn = document.getElementById('searchBtn');
    const query = searchInput.value.trim();
    
    if (!query) {
        showStatusMessage('⚠️ Por favor ingresa algo para buscar', 'error');
        return;
    }

    if (!userLocation) {
        showStatusMessage('⚠️ Primero necesitas permitir el acceso a tu ubicación', 'error');
        return;
    }
    
    // Update button state
    searchBtn.innerHTML = '<div class="loading"></div>';
    searchBtn.disabled = true;
    
    showStatusMessage(`🔍 Buscando ${query} cerca de ti...`, 'info');
    
    try {
        // Clear previous search markers
        clearSearchMarkers();
        
        // Search for places using Overpass API (OpenStreetMap)
        const results = await searchNearbyPlaces(query, userLocation.lat, userLocation.lng);
        
        if (results && results.length > 0) {
            showStatusMessage(`✅ Encontrados ${results.length} resultados para "${query}"`, 'success');
            displaySearchResults(results, query);
            addSearchMarkersToMap(results);
        } else {
            showStatusMessage(`❌ No se encontraron ${query} cerca de tu ubicación`, 'error');
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
    hideSuggestions();
}

// Search nearby places using Overpass API
async function searchNearbyPlaces(query, lat, lng, radius = 5000) {
    // Map search terms to Overpass query tags
    const queryMappings = {
        'restaurantes': 'amenity=restaurant',
        'restaurant': 'amenity=restaurant',
        'comida': 'amenity=restaurant',
        'hospitales': 'amenity=hospital',
        'hospital': 'amenity=hospital',
        'medico': 'amenity=hospital',
        'gasolineras': 'amenity=fuel',
        'gasolina': 'amenity=fuel',
        'combustible': 'amenity=fuel',
        'supermercados': 'shop=supermarket',
        'supermercado': 'shop=supermarket',
        'tienda': 'shop~"supermarket|convenience|general"',
        'tiendas': 'shop~"supermarket|convenience|general"',
        'bancos': 'amenity=bank',
        'banco': 'amenity=bank',
        'cajero': 'amenity=atm',
        'farmacias': 'amenity=pharmacy',
        'farmacia': 'amenity=pharmacy',
        'medicinas': 'amenity=pharmacy',
        'hoteles': 'tourism=hotel',
        'hotel': 'tourism=hotel',
        'cines': 'amenity=cinema',
        'cine': 'amenity=cinema',
        'entretenimiento': 'amenity=cinema',
        'escuelas': 'amenity=school',
        'escuela': 'amenity=school',
        'educacion': 'amenity=school',
        'parques': 'leisure=park',
        'parque': 'leisure=park',
        'cafes': 'amenity=cafe',
        'cafe': 'amenity=cafe',
        'bar': 'amenity=bar',
        'bares': 'amenity=bar'
    };
    
    // Find appropriate tag for the search query
    let searchTag = null;
    const queryLower = query.toLowerCase();
    
    for (const [key, tag] of Object.entries(queryMappings)) {
        if (queryLower.includes(key) || key.includes(queryLower)) {
            searchTag = tag;
            break;
        }
    }
    
    // If no specific tag found, search for general shops or amenities
    if (!searchTag) {
        searchTag = `name~"${query}"`;
    }
    
    // Build Overpass query
    const overpassQuery = `
        [out:json][timeout:25];
        (
            node[${searchTag}](around:${radius},${lat},${lng});
            way[${searchTag}](around:${radius},${lat},${lng});
        );
        out center meta;
    `;
    
    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: overpassQuery
        });
        
        if (!response.ok) throw new Error('API response not ok');
        
        const data = await response.json();
        
        // Process results
        const places = data.elements.map(element => {
            const lat = element.lat || element.center?.lat;
            const lng = element.lon || element.center?.lon;
            
            if (!lat || !lng) return null;
            
            const name = element.tags?.name || `${query.charAt(0).toUpperCase() + query.slice(1)}`;
            const address = buildAddress(element.tags);
            const phone = element.tags?.phone || 'No disponible';
            const hours = element.tags?.opening_hours || 'Consultar horarios';
            const website = element.tags?.website || element.tags?.contact?.website;
            
            // Calculate distance
            const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
            
            return {
                id: element.id,
                name,
                lat,
                lng,
                address,
                phone,
                hours,
                website,
                distance,
                type: getPlaceType(element.tags)
            };
        }).filter(place => place !== null);
        
        // Sort by distance and limit results
        return places
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 20);
            
    } catch (error) {
        console.error('Overpass API error:', error);
        throw error;
    }
}

// Build address from OSM tags
function buildAddress(tags) {
    if (!tags) return 'Dirección no disponible';
    
    const parts = [];
    
    if (tags['addr:street']) {
        parts.push(tags['addr:street']);
        if (tags['addr:housenumber']) {
            parts[0] += ' ' + tags['addr:housenumber'];
        }
    }
    
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:state']) parts.push(tags['addr:state']);
    
    return parts.length > 0 ? parts.join(', ') : 'Dirección no disponible';
}

// Get place type icon
function getPlaceType(tags) {
    if (tags.amenity === 'restaurant') return '🍽️';
    if (tags.amenity === 'hospital') return '🏥';
    if (tags.amenity === 'fuel') return '⛽';
    if (tags.shop === 'supermarket') return '🛒';
    if (tags.amenity === 'bank') return '🏦';
    if (tags.amenity === 'pharmacy') return '💊';
    if (tags.tourism === 'hotel') return '🏨';
    if (tags.amenity === 'cinema') return '🎬';
    if (tags.amenity === 'school') return '🏫';
    if (tags.leisure === 'park') return '🌳';
    if (tags.amenity === 'cafe') return '☕';
    if (tags.amenity === 'bar') return '🍺';
    return '📍';
}

// Add search markers to map
function addSearchMarkersToMap(results) {
    results.forEach((place, index) => {
        const icon = L.divIcon({
            html: place.type,
            className: 'search-result-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
        
        const marker = L.marker([place.lat, place.lng], { icon })
            .addTo(map)
            .bindPopup(createPlacePopupContent(place));
        
        searchMarkers.push(marker);
    });
    
    // Adjust map view to show all markers
    if (results.length > 0) {
        const group = new L.featureGroup([userMarker, ...searchMarkers]);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Create place popup content
function createPlacePopupContent(place) {
    return `
        <div style="min-width: 200px;">
            <h3 style="color: #00ff88; margin-bottom: 10px; text-align: center;">
                ${place.type} ${place.name}
            </h3>
            <div style="margin: 8px 0; font-size: 0.9rem;">
                <div><strong>📍 Dirección:</strong><br>${place.address}</div>
                <div><strong>📞 Teléfono:</strong> ${place.phone}</div>
                <div><strong>🕒 Horarios:</strong> ${place.hours}</div>
                <div><strong>📏 Distancia:</strong> ${place.distance.toFixed(1)} km</div>
            </div>
            <div style="display: flex; gap: 5px; margin-top: 10px;">
                <button onclick="showDirections(${place.lat}, ${place.lng}, '${place.name}')" 
                        style="flex: 1; background: #00ff88; color: #000; border: none; padding: 8px; border-radius: 5px; cursor: pointer; font-weight: bold;">
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
    
    resultsTitle.textContent = `${getPlaceType({})} Resultados: ${searchQuery}`;
    resultsList.innerHTML = '';
    
    results.forEach((place, index) => {
        const placeCard = document.createElement('div');
        placeCard.className = 'store-card';
        placeCard.style.animationDelay = `${index * 0.1}s`;
        
        // Medal for closest places
        let badge = '';
        if (index === 0) badge = '🥇 ';
        else if (index === 1) badge = '🥈 ';
        else if (index === 2) badge = '🥉 ';
        
        placeCard.innerHTML = `
            <span class="store-icon">${place.type}</span>
            <h3 class="store-name">${badge}${place.name}</h3>
            <p class="store-address">📍 ${place.address}</p>
            <div class="store-distance">📏 ${place.distance.toFixed(1)} km de distancia</div>
            <div class="store-rating">📞 ${place.phone} • 🕒 ${place.hours}</div>
            <div class="store-actions">
                <button onclick="showPlaceOnMap(${place.lat}, ${place.lng}, '${place.name}')" 
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

// Show place on map
function showPlaceOnMap(lat, lng, placeName) {
    map.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.5
    });
    
    // Find and open popup for the corresponding marker
    searchMarkers.forEach(marker => {
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

// Show directions to place
function showDirections(lat, lng, placeName) {
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

// Clear search markers
function clearSearchMarkers() {
    searchMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    searchMarkers = [];
}

// Hide results section
function hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
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
