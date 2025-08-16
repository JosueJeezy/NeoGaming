// Variables globales para el mapa
let map;
let userLocation = null;
let userMarker = null;
let storeMarkers = [];
let placesService = null;

// API Key de Google Places
const GOOGLE_PLACES_API_KEY = 'AIzaSyDi3Vlk0byHl-P3rMMj9xcBMjxb5nQdvn8';

// Tiendas de videojuegos simuladas (datos de ejemplo)
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

// Inicialización automática cuando se carga la página de búsqueda
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página de búsqueda
    if (document.getElementById('map') && window.location.pathname.includes('search')) {
        console.log('Inicializando módulo de mapas para página de búsqueda...');
        initializeSearchPageMap();
    }
});

// Inicialización específica para la página de búsqueda
function initializeSearchPageMap() {
    // Inicializar mapa
    initializeMap();
    
    // Configurar búsqueda de lugares
    setupPlaceSearch();
    
    // Solicitar ubicación automáticamente después de un breve delay
    setTimeout(() => {
        autoRequestLocation();
    }, 1500);
}

// Solicitud automática de ubicación al cargar la página
function autoRequestLocation() {
    console.log('🎯 Solicitando ubicación automáticamente...');
    
    // Mostrar notificación discreta
    showLocationRequestNotification();
    
    if (!navigator.geolocation) {
        console.warn('Geolocalización no soportada');
        useDefaultLocation();
        return;
    }
    
    // Configuración optimizada para obtener ubicación rápidamente
    const options = {
        enableHighAccuracy: false, // Priorizar velocidad sobre precisión
        timeout: 10000, // 10 segundos
        maximumAge: 600000 // 10 minutos - usar ubicación en caché si está disponible
    };
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log('✅ Ubicación obtenida automáticamente:', latitude, longitude);
            
            userLocation = { lat: latitude, lng: longitude };
            handleLocationSuccess(latitude, longitude);
        },
        (error) => {
            console.warn('⚠️ Error en ubicación automática:', error.message);
            handleLocationError(error);
        },
        options
    );
}

// Mostrar notificación de solicitud de ubicación
function showLocationRequestNotification() {
    // Crear notificación temporal no intrusiva
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(0, 255, 136, 0.9);
        color: #000;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = '📍 Detectando tu ubicación...';
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Manejar éxito en obtención de ubicación
function handleLocationSuccess(lat, lng) {
    updateMapWithUserLocation(lat, lng);
    showLocationInfo(lat, lng);
    findNearbyStores();
    
    // Notificación de éxito
    showSuccessNotification('Ubicación detectada correctamente');
}

// Manejar error en obtención de ubicación
function handleLocationError(error) {
    let message = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Ubicación denegada - usando ubicación por defecto';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible - usando ubicación por defecto';
            break;
        case error.TIMEOUT:
            message = 'Tiempo agotado - usando ubicación por defecto';
            break;
        default:
            message = 'Error de ubicación - usando ubicación por defecto';
    }
    
    console.log('ℹ️', message);
    useDefaultLocation();
    showInfoNotification(message);
}

// Usar ubicación por defecto (Ciudad Juárez)
function useDefaultLocation() {
    const defaultLat = 31.6904;
    const defaultLng = -106.4245;
    
    userLocation = { lat: defaultLat, lng: defaultLng };
    updateMapWithUserLocation(defaultLat, defaultLng);
    findNearbyStores();
    
    console.log('🏠 Usando ubicación por defecto: Ciudad Juárez');
}

// Inicializar mapa
function initializeMap() {
    // Coordenadas por defecto (Ciudad Juárez)
    const defaultLat = 31.6904;
    const defaultLng = -106.4245;
    
    // Crear mapa centrado en Ciudad Juárez
    map = L.map('map').setView([defaultLat, defaultLng], 13);
    
    // Añadir tiles de OpenStreetMap con mejor configuración
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0,
    }).addTo(map);
    
    // Añadir marcadores de tiendas
    addStoreMarkers();
    
    // Configurar eventos del mapa
    setupMapEvents();
    
    console.log('🗺️ Mapa inicializado correctamente');
}

// Configurar eventos del mapa
function setupMapEvents() {
    // Evento al hacer clic en el mapa
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        console.log(`Clic en mapa: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        // Opcionalmente, añadir marcador temporal
        const tempMarker = L.marker([lat, lng])
            .addTo(map)
            .bindPopup(`📍 Ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
            .openPopup();
        
        // Remover marcador temporal después de 5 segundos
        setTimeout(() => {
            map.removeLayer(tempMarker);
        }, 5000);
    });
    
    // Evento al cambiar el zoom
    map.on('zoomend', function() {
        const zoom = map.getZoom();
        console.log(`Zoom cambiado a: ${zoom}`);
    });
}

// Añadir marcadores de tiendas al mapa
function addStoreMarkers() {
    gameStores.forEach(store => {
        // Crear ícono personalizado para tiendas
        const storeIcon = L.divIcon({
            html: '🎮',
            className: 'store-marker',
            iconSize: [25, 25],
            iconAnchor: [12, 25],
            popupAnchor: [0, -25]
        });
        
        const marker = L.marker([store.lat, store.lng], { icon: storeIcon })
            .addTo(map)
            .bindPopup(createStorePopupContent(store));
        
        // Evento al hacer hover sobre el marcador
        marker.on('mouseover', function() {
            this.openPopup();
        });
        
        storeMarkers.push(marker);
    });
    
    console.log(`📍 ${gameStores.length} tiendas añadidas al mapa`);
}

// Crear contenido del popup de tienda
function createStorePopupContent(store) {
    const stars = '⭐'.repeat(Math.floor(store.rating));
    const halfStar = (store.rating % 1) >= 0.5 ? '⭐' : '';
    
    return `
        <div style="min-width: 250px; max-width: 300px;">
            <h3 style="color: #00ff88; margin-bottom: 10px; font-size: 1.2rem; text-align: center;">
                ${store.name}
            </h3>
            
            <div style="margin: 8px 0; color: #333; font-size: 0.9rem;">
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <span style="margin-right: 8px;">📍</span>
                    <span>${store.address}</span>
                </div>
                
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <span style="margin-right: 8px;">📞</span>
                    <span>${store.phone}</span>
                </div>
                
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <span style="margin-right: 8px;">🕒</span>
                    <span>${store.hours}</span>
                </div>
                
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="margin-right: 8px;">⭐</span>
                    <span>${stars}${halfStar} (${store.rating}/5)</span>
                </div>
            </div>
            
            <div style="margin: 10px 0; padding: 8px; background: #f0f0f0; border-radius: 5px;">
                <strong style="color: #333;">🎮 Especialidades:</strong><br>
                <span style="color: #666; font-size: 0.85rem;">${store.specialties.join(', ')}</span>
            </div>
            
            <div style="display: flex; gap: 5px; margin-top: 10px;">
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        style="flex: 1; background: #00ff88; color: #000; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">
                    🚗 Cómo llegar
                </button>
                <button onclick="map.setView([${store.lat}, ${store.lng}], 17)" 
                        style="background: #007acc; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                    🔍 Zoom
                </button>
            </div>
        </div>
    `;
}

// Actualizar mapa con ubicación del usuario
function updateMapWithUserLocation(lat, lng) {
    // Remover marcador anterior del usuario si existe
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    // Crear ícono personalizado para el usuario
    const userIcon = L.divIcon({
        html: '📍',
        className: 'user-location-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
    
    // Añadir marcador del usuario con animación
    userMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('📍 Tu ubicación actual')
        .openPopup();
    
    // Centrar mapa en la ubicación del usuario con animación suave
    map.flyTo([lat, lng], 14, {
        animate: true,
        duration: 1.5
    });
    
    console.log(`👤 Usuario ubicado en: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
}

// Mostrar información de ubicación
function showLocationInfo(lat, lng) {
    const locationInfo = document.getElementById('locationInfo');
    const locationContent = document.getElementById('locationContent');
    
    if (!locationInfo || !locationContent) {
        console.log('Elementos de información de ubicación no encontrados');
        return;
    }
    
    // Obtener nombre aproximado de la ubicación
    getLocationName(lat, lng).then(locationName => {
        locationContent.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📍</div>
                <h3 style="color: var(--primary-color); margin-bottom: 10px;">
                    Ubicación Detectada
                </h3>
                <div style="color: var(--text-light); margin-bottom: 10px; font-weight: bold;">
                    ${locationName}
                </div>
                <div style="color: var(--text-gray); margin-bottom: 15px; font-size: 0.9rem;">
                    <strong>Coordenadas:</strong><br>
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
                <div style="color: var(--text-light);">
                    🎯 Buscando tiendas de videojuegos cercanas...
                </div>
            </div>
        `;
        
        locationInfo.style.display = 'block';
        locationInfo.style.opacity = '0';
        
        setTimeout(() => {
            locationInfo.style.transition = 'all 0.5s ease';
            locationInfo.style.opacity = '1';
        }, 100);
    });
}

// Obtener nombre aproximado de la ubicación
async function getLocationName(lat, lng) {
    try {
        // Usar reverse geocoding básico con Nominatim (OpenStreetMap)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
                // Extraer ciudad y estado/país
                const parts = data.display_name.split(',');
                return parts.slice(0, 2).join(',').trim();
            }
        }
    } catch (error) {
        console.log('No se pudo obtener nombre de ubicación:', error);
    }
    
    // Fallback a coordenadas
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Configurar búsqueda de lugares
function setupPlaceSearch() {
    const searchInput = document.getElementById('placeSearchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (!searchInput || !suggestionsDiv) {
        console.log('Elementos de búsqueda no encontrados');
        return;
    }
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            showPlaceSuggestions(query);
        }, 300);
    });
    
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    // Buscar al presionar Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchPlace();
        }
    });
    
    console.log('🔍 Búsqueda de lugares configurada');
}

// Mostrar sugerencias de lugares
function showPlaceSuggestions(query) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    // Lugares conocidos con coordenadas
    const knownPlaces = [
        { name: 'Ciudad Juárez, Chihuahua', lat: 31.6904, lng: -106.4245 },
        { name: 'Centro Histórico, Ciudad Juárez', lat: 31.6904, lng: -106.4245 },
        { name: 'UACJ - Universidad Autónoma', lat: 31.6760, lng: -106.4245 },
        { name: 'Pronaf, Ciudad Juárez', lat: 31.6650, lng: -106.4100 },
        { name: 'Las Misiones Mall', lat: 31.6890, lng: -106.4200 },
        { name: 'Río Grande Mall', lat: 31.6800, lng: -106.4300 },
        { name: 'El Paso, Texas', lat: 31.7619, lng: -106.4850 },
        { name: 'Downtown El Paso', lat: 31.7587, lng: -106.4869 },
        { name: 'Parque Central', lat: 31.6950, lng: -106.4200 },
        { name: 'Plaza de Armas', lat: 31.6904, lng: -106.4245 }
    ];
    
    const queryLower = query.toLowerCase();
    const filteredPlaces = knownPlaces.filter(place => 
        place.name.toLowerCase().includes(queryLower)
    );
    
    if (filteredPlaces.length > 0) {
        const html = filteredPlaces
            .slice(0, 5) // Máximo 5 sugerencias
            .map(place => 
                `<div class="suggestion-item" onclick="selectPlace('${place.name}', ${place.lat}, ${place.lng})">
                    📍 ${place.name}
                 </div>`
            ).join('');
        
        suggestionsDiv.innerHTML = html;
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

// Seleccionar lugar de las sugerencias
function selectPlace(placeName, lat, lng) {
    const searchInput = document.getElementById('placeSearchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    searchInput.value = placeName;
    suggestionsDiv.style.display = 'none';
    
    // Mover mapa al lugar seleccionado
    moveMapToLocation(lat, lng, placeName);
}

// Buscar lugar específico
function searchPlace() {
    const searchInput = document.getElementById('placeSearchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        showInfoNotification('Ingresa un lugar para buscar');
        return;
    }
    
    console.log('🔍 Buscando lugar:', query);
    
    // Coordenadas predefinidas para lugares comunes
    const knownPlaces = {
        'ciudad juárez': { lat: 31.6904, lng: -106.4245, name: 'Ciudad Juárez, Chihuahua' },
        'centro': { lat: 31.6904, lng: -106.4245, name: 'Centro Histórico' },
        'uacj': { lat: 31.6760, lng: -106.4245, name: 'UACJ' },
        'universidad': { lat: 31.6760, lng: -106.4245, name: 'Universidad Autónoma' },
        'pronaf': { lat: 31.6650, lng: -106.4100, name: 'Pronaf' },
        'el paso': { lat: 31.7619, lng: -106.4850, name: 'El Paso, Texas' },
        'las misiones': { lat: 31.6890, lng: -106.4200, name: 'Las Misiones Mall' },
        'rio grande': { lat: 31.6800, lng: -106.4300, name: 'Río Grande Mall' },
        'parque central': { lat: 31.6950, lng: -106.4200, name: 'Parque Central' }
    };
    
    const queryLower = query.toLowerCase();
    let foundPlace = null;
    
    // Buscar coincidencia exacta o parcial
    for (const [key, place] of Object.entries(knownPlaces)) {
        if (queryLower.includes(key) || key.includes(queryLower)) {
            foundPlace = place;
            break;
        }
    }
    
    if (foundPlace) {
        moveMapToLocation(foundPlace.lat, foundPlace.lng, foundPlace.name);
        showSuccessNotification(`Lugar encontrado: ${foundPlace.name}`);
    } else {
        showInfoNotification('Lugar no encontrado. Intenta con: Ciudad Juárez, Centro, UACJ, etc.');
    }
}

// Mover mapa a ubicación específica
function moveMapToLocation(lat, lng, locationName) {
    // Animar movimiento del mapa
    map.flyTo([lat, lng], 15, {
        animate: true,
        duration: 2
    });
    
    // Crear marcador temporal con estilo especial
    const searchIcon = L.divIcon({
        html: '🔍',
        className: 'search-result-marker',
        iconSize: [35, 35],
        iconAnchor: [17, 35]
    });
    
    const searchMarker = L.marker([lat, lng], { icon: searchIcon })
        .addTo(map)
        .bindPopup(`🔍 ${locationName}`)
        .openPopup();
    
    // Remover el marcador después de 15 segundos
    setTimeout(() => {
        map.removeLayer(searchMarker);
    }, 15000);
    
    console.log(`📍 Navegado a: ${locationName} (${lat}, ${lng})`);
}

// Solicitar ubicación actual del usuario (función manual)
function requestCurrentLocation() {
    const btn = document.getElementById('findStoresBtn');
    
    // Cambiar estado del botón
    if (btn) {
        btn.innerHTML = '<span class="loading"></span> Obteniendo ubicación...';
        btn.disabled = true;
    }
    
    if (!navigator.geolocation) {
        showInfoNotification('Geolocalización no soportada en este navegador');
        resetLocationButton();
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = { lat: latitude, lng: longitude };
            
            handleLocationSuccess(latitude, longitude);
            showSuccessNotification('Ubicación obtenida correctamente');
            resetLocationButton();
        },
        (error) => {
            console.warn('Error obteniendo geolocalización:', error);
            handleLocationError(error);
            resetLocationButton();
        },
        {
            timeout: 15000,
            enableHighAccuracy: true,
            maximumAge: 300000 // 5 minutos
        }
    );
}

// Restablecer botón de ubicación
function resetLocationButton() {
    const btn = document.getElementById('findStoresBtn');
    if (btn) {
        btn.innerHTML = '🔍 Buscar Tiendas Cercanas';
        btn.disabled = false;
    }
}

// Buscar tiendas cercanas
function findNearbyStores() {
    if (!userLocation) {
        console.log('No hay ubicación de usuario, solicitando...');
        requestCurrentLocation();
        return;
    }
    
    console.log('🎮 Buscando tiendas cercanas...');
    
    // Calcular distancias y ordenar tiendas
    const storesWithDistance = gameStores.map(store => {
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            store.lat, store.lng
        );
        return { ...store, distance };
    }).sort((a, b) => a.distance - b.distance);
    
    displayNearbyStores(storesWithDistance);
    
    // Destacar tiendas más cercanas en el mapa
    highlightNearestStores(storesWithDistance.slice(0, 3));
}

// Destacar las tiendas más cercanas en el mapa
function highlightNearestStores(nearestStores) {
    // Agregar círculos de radio alrededor de las tiendas más cercanas
    nearestStores.forEach((store, index) => {
        const color = index === 0 ? '#00ff88' : index === 1 ? '#ffaa00' : '#ff6b6b';
        const radius = (3 - index) * 200; // Radio diferente para cada tienda
        
        L.circle([store.lat, store.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            radius: radius,
            weight: 2
        }).addTo(map);
    });
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Mostrar tiendas cercanas
function displayNearbyStores(stores) {
    const storesSection = document.getElementById('storesSection');
    const storesList = document.getElementById('storesList');
    
    if (!storesSection || !storesList) {
        console.log('Elementos de tiendas no encontrados');
        return;
    }
    
    storesList.innerHTML = '';
    
    stores.forEach((store, index) => {
        const storeCard = document.createElement('div');
        storeCard.className = 'category-card';
        storeCard.style.animationDelay = `${index * 0.1}s`;
        
        // Determinar medalla por distancia
        let badge = '';
        if (index === 0) badge = '🥇';
        else if (index === 1) badge = '🥈';
        else if (index === 2) badge = '🥉';
        
        const stars = '⭐'.repeat(Math.floor(store.rating));
        const halfStar = (store.rating % 1) >= 0.5 ? '½' : '';
        
        storeCard.innerHTML = `
            <span class="category-icon">🎮</span>
            <h3 class="category-title">${badge} ${store.name}</h3>
            <p class="category-description">${store.address}</p>
            <div style="margin: 10px 0;">
                <div style="color: var(--primary-color); font-weight: bold; font-size: 1.1rem;">
                    📍 ${store.distance.toFixed(1)} km de distancia
                </div>
                <div style="color: var(--text-gray); font-size: 0.9rem; margin: 5px 0;">
                    ${stars}${halfStar} (${store.rating}/5) • ${store.hours}
                </div>
                <div style="color: var(--text-light); font-size: 0.85rem; margin-top: 8px;">
                    <strong>Especialidades:</strong> ${store.specialties.slice(0, 2).join(', ')}
                </div>
            </div>
            <div style="margin-top: 15px; display: flex; gap: 8px;">
                <button onclick="showStoreOnMap(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-secondary" style="flex: 1; padding: 8px 12px; font-size: 0.85rem;">
                    👁️ Ver en mapa
                </button>
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-primary" style="flex: 1; padding: 8px 12px; font-size: 0.85rem;">
                    🚗 Cómo llegar
                </button>
            </div>
        `;
        
        storesList.appendChild(storeCard);
    });
    
    storesSection.style.display = 'block';
    
    // Scroll suave hacia las tiendas
    setTimeout(() => {
        storesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
    
    console.log(`🏪 Mostrando ${stores.length} tiendas cercanas`);
}

// Mostrar tienda en el mapa
function showStoreOnMap(lat, lng, storeName) {
    // Animar hacia la tienda
    map.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.5
    });
    
    // Encontrar y abrir popup del marcador correspondiente
    storeMarkers.forEach(marker => {
        const markerLat = marker.getLatLng().lat;
        const markerLng = marker.getLatLng().lng;
        
        if (Math.abs(markerLat - lat) < 0.001 && Math.abs(markerLng - lng) < 0.001) {
            setTimeout(() => {
                marker.openPopup();
            }, 1600); // Esperar a que termine la animación
        }
    });
    
    // Scroll hacia el mapa
    setTimeout(() => {
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
    }, 200);
    
    showSuccessNotification(`Mostrando ${storeName} en el mapa`);
}

// Mostrar direcciones (simulado)
function showDirections(lat, lng, storeName) {
    const directionsModal = document.createElement('div');
    directionsModal.className = 'modal show';
    directionsModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}`;
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    
    directionsModal.innerHTML = `
        <div style="background: var(--background-card); border-radius: 15px; padding: 30px; text-align: center; max-width: 400px; position: relative; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 24px; color: var(--text-gray); cursor: pointer;">
                ✕
            </button>
            
            <div style="font-size: 4rem; margin-bottom: 20px;">🗺️</div>
            
            <h3 style="color: var(--primary-color); margin-bottom: 10px; font-size: 1.3rem;">
                Cómo llegar a
            </h3>
            <p style="color: var(--text-light); font-weight: bold; margin-bottom: 25px; font-size: 1.1rem;">
                ${storeName}
            </p>
            
            <div style="margin-bottom: 25px;">
                <a href="${googleMapsUrl}" target="_blank" 
                   style="display: block; margin-bottom: 12px; background: #4285f4; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; transition: all 0.3s ease;">
                    🗺️ Abrir en Google Maps
                </a>
                <a href="${appleMapsUrl}" target="_blank" 
                   style="display: block; margin-bottom: 12px; background: #007aff; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; transition: all 0.3s ease;">
                    🍎 Abrir en Apple Maps
                </a>
                <a href="${wazeUrl}" target="_blank" 
                   style="display: block; background: #33ccff; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; transition: all 0.3s ease;">
                    🚗 Abrir en Waze
                </a>
            </div>
            
            <div style="color: var(--text-gray); font-size: 0.9rem; line-height: 1.4;">
                Se abrirá tu aplicación de navegación preferida
            </div>
        </div>
    `;
    
    document.body.appendChild(directionsModal);
    
    // Agregar animación de entrada
    directionsModal.style.opacity = '0';
    setTimeout(() => {
        directionsModal.style.transition = 'opacity 0.3s ease';
        directionsModal.style.opacity = '1';
    }, 10);
}

// Funciones de notificación
function showSuccessNotification(message) {
    showNotification(message, 'success', '✅');
}

function showInfoNotification(message) {
    showNotification(message, 'info', 'ℹ️');
}

function showErrorNotification(message) {
    showNotification(message, 'error', '❌');
}

function showNotification(message, type, icon) {
    const notification = document.createElement('div');
    
    const colors = {
        success: '#00ff88',
        info: '#17a2b8',
        error: '#dc3545'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: ${colors[type]};
        color: ${type === 'success' ? '#000' : '#fff'};
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `${icon} ${message}`;
    document.body.appendChild(notification);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Función para redimensionar el mapa cuando sea necesario
function resizeMap() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

// Función de limpieza para remover marcadores temporales
function clearTemporaryMarkers() {
    // Implementar limpieza de marcadores temporales si es necesario
    console.log('🧹 Limpiando marcadores temporales');
}

// Event listeners globales para las funciones del mapa
window.findNearbyStores = findNearbyStores;
window.requestCurrentLocation = requestCurrentLocation;
window.showStoreOnMap = showStoreOnMap;
window.showDirections = showDirections;
window.searchPlace = searchPlace;
window.selectPlace = selectPlace;
window.resizeMap = resizeMap;

// Agregar estilos CSS adicionales para animaciones
const additionalStyles = `
    <style>
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .user-location-marker {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .store-marker:hover {
            transform: scale(1.2);
            transition: transform 0.2s ease;
        }
        
        .search-result-marker {
            animation: bounce 1s ease-in-out 3;
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
    </style>
`;

// Agregar estilos al head
document.head.insertAdjacentHTML('beforeend', additionalStyles);

console.log('🗺️ Módulo de mapas mejorado cargado completamente');
