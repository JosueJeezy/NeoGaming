// Variables globales para el mapa
let map;
let userLocation = null;
let userMarker = null;
let storeMarkers = [];

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

// Inicializar mapa
function initializeMap() {
    // Coordenadas por defecto (Ciudad Juárez)
    const defaultLat = 31.6904;
    const defaultLng = -106.4245;
    
    // Crear mapa centrado en Ciudad Juárez
    map = L.map('map').setView([defaultLat, defaultLng], 13);
    
    // Añadir tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Añadir marcadores de tiendas
    addStoreMarkers();
    
    console.log('Mapa inicializado');
}

// Añadir marcadores de tiendas al mapa
function addStoreMarkers() {
    gameStores.forEach(store => {
        const marker = L.marker([store.lat, store.lng])
            .addTo(map)
            .bindPopup(createStorePopupContent(store));
        
        storeMarkers.push(marker);
    });
}

// Crear contenido del popup de tienda
function createStorePopupContent(store) {
    const stars = '⭐'.repeat(Math.floor(store.rating));
    
    return `
        <div style="min-width: 200px;">
            <h3 style="color: var(--primary-color); margin-bottom: 10px; font-size: 1.1rem;">
                ${store.name}
            </h3>
            <p style="margin: 5px 0; color: #333;">
                <strong>📍 Dirección:</strong><br>
                ${store.address}
            </p>
            <p style="margin: 5px 0; color: #333;">
                <strong>📞 Teléfono:</strong> ${store.phone}
            </p>
            <p style="margin: 5px 0; color: #333;">
                <strong>🕒 Horarios:</strong> ${store.hours}
            </p>
            <p style="margin: 5px 0; color: #333;">
                <strong>⭐ Calificación:</strong> ${stars} (${store.rating}/5)
            </p>
            <p style="margin: 5px 0; color: #333;">
                <strong>🎮 Especialidades:</strong><br>
                ${store.specialties.join(', ')}
            </p>
            <div style="margin-top: 10px;">
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        style="background: #00ff88; color: #000; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                    📍 Cómo llegar
                </button>
            </div>
        </div>
    `;
}

// Solicitar ubicación actual del usuario
function requestCurrentLocation() {
    const btn = document.getElementById('findStoresBtn');
    if (btn) {
        btn.innerHTML = '<span class="loading"></span> Obteniendo ubicación...';
        btn.disabled = true;
    }
    
    if (!navigator.geolocation) {
        showLocationError('Geolocalización no soportada en este navegador');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = { lat: latitude, lng: longitude };
            
            updateMapWithUserLocation(latitude, longitude);
            showLocationInfo(latitude, longitude);
            findNearbyStores();
            
            if (btn) {
                btn.innerHTML = '📍 Buscar Tiendas Cercanas';
                btn.disabled = false;
            }
        },
        (error) => {
            console.warn('Error obteniendo geolocalización:', error.message);
            showLocationError('No se pudo obtener tu ubicación. Mostrando ubicación por defecto.');
            
            // Usar ubicación por defecto
            const defaultLat = 31.6904;
            const defaultLng = -106.4245;
            userLocation = { lat: defaultLat, lng: defaultLng };
            
            updateMapWithUserLocation(defaultLat, defaultLng);
            findNearbyStores();
            
            if (btn) {
                btn.innerHTML = '📍 Buscar Tiendas Cercanas';
                btn.disabled = false;
            }
        },
        {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 300000 // 5 minutos
        }
    );
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
        iconAnchor: [15, 30]
    });
    
    // Añadir marcador del usuario
    userMarker = L.marker([lat, lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('📍 Tu ubicación actual');
    
    // Centrar mapa en la ubicación del usuario
    map.setView([lat, lng], 14);
}

// Mostrar información de ubicación
function showLocationInfo(lat, lng) {
    const locationInfo = document.getElementById('locationInfo');
    const locationContent = document.getElementById('locationContent');
    
    if (!locationInfo || !locationContent) return;
    
    locationContent.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 15px;">📍</div>
            <h3 style="color: var(--primary-color); margin-bottom: 10px;">
                Ubicación Detectada
            </h3>
            <div style="color: var(--text-gray); margin-bottom: 15px;">
                <strong>Coordenadas:</strong><br>
                Latitud: ${lat.toFixed(6)}°<br>
                Longitud: ${lng.toFixed(6)}°
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
}

// Mostrar error de ubicación
function showLocationError(message) {
    const locationInfo = document.getElementById('locationInfo');
    const locationContent = document.getElementById('locationContent');
    
    if (!locationInfo || !locationContent) return;
    
    locationContent.innerHTML = `
        <div style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 15px;">⚠️</div>
            <h3 style="color: var(--accent-red); margin-bottom: 10px;">
                Error de Ubicación
            </h3>
            <div style="color: var(--text-gray);">
                ${message}
            </div>
        </div>
    `;
    
    locationInfo.style.display = 'block';
}

// Buscar tiendas cercanas
function findNearbyStores() {
    if (!userLocation) {
        requestCurrentLocation();
        return;
    }
    
    // Calcular distancias y ordenar tiendas
    const storesWithDistance = gameStores.map(store => {
        const distance = calculateDistance(
            userLocation.lat, userLocation.lng,
            store.lat, store.lng
        );
        return { ...store, distance };
    }).sort((a, b) => a.distance - b.distance);
    
    displayNearbyStores(storesWithDistance);
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
    
    if (!storesSection || !storesList) return;
    
    storesList.innerHTML = '';
    
    stores.forEach((store, index) => {
        const storeCard = document.createElement('div');
        storeCard.className = 'category-card';
        storeCard.style.animationDelay = `${index * 0.1}s`;
        
        const stars = '⭐'.repeat(Math.floor(store.rating));
        
        storeCard.innerHTML = `
            <span class="category-icon">🎮</span>
            <h3 class="category-title">${store.name}</h3>
            <p class="category-description">${store.address}</p>
            <div style="margin: 10px 0;">
                <div style="color: var(--primary-color); font-weight: bold;">
                    📍 ${store.distance.toFixed(1)} km
                </div>
                <div style="color: var(--text-gray); font-size: 0.9rem;">
                    ${stars} (${store.rating}/5)
                </div>
                <div style="color: var(--text-gray); font-size: 0.8rem; margin-top: 5px;">
                    ${store.hours}
                </div>
            </div>
            <div style="margin-top: 15px;">
                <button onclick="showStoreOnMap(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-secondary" style="padding: 8px 15px; font-size: 0.9rem; margin-right: 5px;">
                    Ver en mapa
                </button>
                <button onclick="showDirections(${store.lat}, ${store.lng}, '${store.name}')" 
                        class="btn btn-primary" style="padding: 8px 15px; font-size: 0.9rem;">
                    Cómo llegar
                </button>
            </div>
        `;
        
        storesList.appendChild(storeCard);
    });
    
    storesSection.style.display = 'block';
}

// Mostrar tienda en el mapa
function showStoreOnMap(lat, lng, storeName) {
    map.setView([lat, lng], 16);
    
    // Encontrar y abrir popup del marcador
    storeMarkers.forEach(marker => {
        const markerLat = marker.getLatLng().lat;
        const markerLng = marker.getLatLng().lng;
        
        if (Math.abs(markerLat - lat) < 0.001 && Math.abs(markerLng - lng) < 0.001) {
            marker.openPopup();
        }
    });
    
    // Scroll hacia el mapa
    document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
}

// Mostrar direcciones (simulado)
function showDirections(lat, lng, storeName) {
    const directionsModal = document.createElement('div');
    directionsModal.className = 'modal show';
    
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}`;
    
    directionsModal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 400px;">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            <div style="font-size: 3rem; margin-bottom: 15px;">🗺️</div>
            <h3 style="color: var(--primary-color); margin-bottom: 15px;">
                Cómo llegar a
            </h3>
            <p style="color: var(--text-light); font-weight: bold; margin-bottom: 20px;">
                ${storeName}
            </p>
            
            <div style="margin-bottom: 20px;">
                <a href="${googleMapsUrl}" target="_blank" class="btn btn-primary" 
                   style="display: block; margin-bottom: 10px;">
                    🗺️ Abrir en Google Maps
                </a>
                <a href="${appleMapsUrl}" target="_blank" class="btn btn-secondary" 
                   style="display: block;">
                    🍎 Abrir en Apple Maps
                </a>
            </div>
            
            <div style="color: var(--text-gray); font-size: 0.9rem;">
                Se abrirá tu aplicación de mapas predeterminada
            </div>
        </div>
    `;
    
    document.body.appendChild(directionsModal);
}

// Inicialización del módulo de mapas
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página de búsqueda
    const mapElement = document.getElementById('map');
    if (mapElement) {
        console.log('Inicializando módulo de mapas...');
        initializeMap();
        
        // Auto-solicitar ubicación al cargar la página
        setTimeout(() => {
            requestCurrentLocation();
        }, 1000);
    }
});

// Función para redimensionar el mapa cuando sea necesario
window.resizeMap = function() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
};

// Event listeners para los botones
window.findNearbyStores = findNearbyStores;
window.requestCurrentLocation = requestCurrentLocation;
window.showStoreOnMap = showStoreOnMap;
window.showDirections = showDirections;