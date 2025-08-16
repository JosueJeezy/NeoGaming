// Configuración de la API del clima
const WEATHER_API_KEY = '49446b6194238df3739f282ced1e781a';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';
const GEOCODING_API_BASE = 'https://api.openweathermap.org/geo/1.0';

// Función principal para cargar datos del clima
window.loadWeatherData = async function(lat, lon) {
    try {
        console.log(`Cargando clima para coordenadas: ${lat}, ${lon}`);
        
        // Mostrar indicador de carga
        showWeatherLoading();
        
        // Obtener datos del clima y información de ubicación
        const [weatherData, locationData] = await Promise.all([
            fetchWeatherData(lat, lon),
            fetchLocationData(lat, lon)
        ]);
        
        if (weatherData) {
            displayWeatherInfo(weatherData, locationData);
        }
    } catch (error) {
        console.error('Error cargando datos del clima:', error);
        showWeatherError();
    }
};

// Obtener datos del clima desde la API
async function fetchWeatherData(lat, lon) {
    try {
        const url = `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Datos del clima obtenidos:', data);
        
        return data;
    } catch (error) {
        console.error('Error en fetchWeatherData:', error);
        throw error;
    }
}

// Obtener información detallada de la ubicación usando geocoding reverso
async function fetchLocationData(lat, lon) {
    try {
        const url = `${GEOCODING_API_BASE}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${WEATHER_API_KEY}&lang=es`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.warn(`Error en geocoding: ${response.status}`);
            return null;
        }
        
        const data = await response.json();
        console.log('Datos de ubicación obtenidos:', data);
        
        return data[0] || null;
    } catch (error) {
        console.error('Error en fetchLocationData:', error);
        return null;
    }
}

// Función para obtener ubicación precisa del usuario
window.getAccurateLocation = function() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada'));
            return;
        }

        // Mostrar indicador de carga mientras se obtiene ubicación
        showLocationLoading();

        // Opciones para obtener ubicación más precisa
        const options = {
            enableHighAccuracy: true,  // Usar GPS si está disponible
            timeout: 15000,           // 15 segundos de timeout
            maximumAge: 300000        // Cache por 5 minutos
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                console.log(`Ubicación obtenida: ${latitude}, ${longitude} (precisión: ${accuracy}m)`);
                
                resolve({
                    latitude,
                    longitude,
                    accuracy,
                    timestamp: position.timestamp
                });
            },
            (error) => {
                console.error('Error de geolocalización:', error);
                
                let errorMessage = 'Error obteniendo ubicación';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Permisos de ubicación denegados';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Ubicación no disponible';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Timeout obteniendo ubicación';
                        break;
                }
                
                reject(new Error(errorMessage));
            },
            options
        );
    });
};

// Mostrar indicador de carga para ubicación
function showLocationLoading() {
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        weatherInfo.style.display = 'block';
        weatherInfo.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner" style="margin: 0 auto 15px;"></div>
                <div style="color: var(--text-gray);">
                    📍 Obteniendo tu ubicación...
                </div>
                <div style="color: var(--text-gray); font-size: 0.8rem; margin-top: 5px;">
                    Permitir acceso a ubicación para clima local
                </div>
            </div>
        `;
    }
}

// Mostrar indicador de carga para clima
function showWeatherLoading() {
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        weatherInfo.style.display = 'block';
        weatherInfo.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div class="loading-spinner" style="margin: 0 auto 15px;"></div>
                <div style="color: var(--text-gray);">
                    🌤️ Cargando clima local...
                </div>
            </div>
        `;
    }
}

// Mostrar información del clima en la interfaz
function displayWeatherInfo(weatherData, locationData) {
    const weatherInfo = document.getElementById('weatherInfo');
    const weatherContent = document.getElementById('weatherContent');
    
    if (!weatherInfo) {
        console.warn('Elemento weatherInfo no encontrado en el DOM');
        return;
    }
    
    // Extraer datos relevantes
    const temperature = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const humidity = weatherData.main.humidity;
    const windSpeed = Math.round(weatherData.wind.speed * 3.6); // Convertir m/s a km/h
    const feelsLike = Math.round(weatherData.main.feels_like);
    const pressure = weatherData.main.pressure;
    const visibility = weatherData.visibility ? Math.round(weatherData.visibility / 1000) : null;
    
    // Determinar ubicación más precisa
    let cityName = weatherData.name;
    let country = weatherData.sys.country;
    let fullLocation = `${cityName}, ${country}`;
    
    // Si tenemos datos de geocoding, usar información más detallada
    if (locationData) {
        const locationParts = [];
        
        if (locationData.name) locationParts.push(locationData.name);
        if (locationData.state && locationData.state !== locationData.name) {
            locationParts.push(locationData.state);
        }
        if (locationData.country) locationParts.push(locationData.country);
        
        if (locationParts.length > 0) {
            fullLocation = locationParts.join(', ');
        }
    }
    
    // Obtener icono del clima
    const weatherIcon = getWeatherIcon(weatherData.weather[0].main.toLowerCase());
    const timeIcon = getTimeIcon();
    
    // Crear HTML del clima
    const weatherHTML = `
        <div class="weather-container" style="display: flex; align-items: center; justify-content: center; gap: 25px; margin-bottom: 25px;">
            <div style="font-size: 5rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${weatherIcon}</div>
            <div>
                <div class="weather-temp" style="font-size: 2.5rem; font-weight: bold; color: var(--primary-color); margin-bottom: 5px;">
                    ${temperature}°C
                </div>
                <div class="weather-description" style="font-size: 1.1rem; color: var(--text-light); text-transform: capitalize; margin-bottom: 8px;">
                    ${description}
                </div>
                <div style="color: var(--text-gray); font-size: 0.95rem; display: flex; align-items: center; gap: 5px;">
                    📍 ${fullLocation}
                </div>
            </div>
        </div>
        
        <div class="weather-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-top: 20px;">
            <div class="weather-detail" style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
                <div class="weather-detail-label" style="color: var(--text-gray); font-size: 0.8rem; margin-bottom: 5px;">Sensación</div>
                <div class="weather-detail-value" style="color: var(--text-light); font-weight: bold; font-size: 1.1rem;">${feelsLike}°C</div>
            </div>
            
            <div class="weather-detail" style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
                <div class="weather-detail-label" style="color: var(--text-gray); font-size: 0.8rem; margin-bottom: 5px;">Humedad</div>
                <div class="weather-detail-value" style="color: var(--text-light); font-weight: bold; font-size: 1.1rem;">${humidity}%</div>
            </div>
            
            <div class="weather-detail" style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
                <div class="weather-detail-label" style="color: var(--text-gray); font-size: 0.8rem; margin-bottom: 5px;">Viento</div>
                <div class="weather-detail-value" style="color: var(--text-light); font-weight: bold; font-size: 1.1rem;">${windSpeed} km/h</div>
            </div>
            
            <div class="weather-detail" style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
                <div class="weather-detail-label" style="color: var(--text-gray); font-size: 0.8rem; margin-bottom: 5px;">Presión</div>
                <div class="weather-detail-value" style="color: var(--text-light); font-weight: bold; font-size: 1.1rem;">${pressure} hPa</div>
            </div>
            
            ${visibility ? `
                <div class="weather-detail" style="text-align: center; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
                    <div class="weather-detail-label" style="color: var(--text-gray); font-size: 0.8rem; margin-bottom: 5px;">Visibilidad</div>
                    <div class="weather-detail-value" style="color: var(--text-light); font-weight: bold; font-size: 1.1rem;">${visibility} km</div>
                </div>
            ` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: var(--text-gray); font-size: 0.8rem;">
            ${timeIcon} Actualizado: ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
    `;
    
    // Si weatherContent existe, usarlo, sino crear estructura directa
    if (weatherContent) {
        weatherContent.innerHTML = weatherHTML;
    } else {
        weatherInfo.innerHTML = weatherHTML;
    }
    
    // Mostrar el contenedor del clima con animación
    weatherInfo.style.display = 'block';
    weatherInfo.style.opacity = '0';
    weatherInfo.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        weatherInfo.style.transition = 'all 0.6s ease';
        weatherInfo.style.opacity = '1';
        weatherInfo.style.transform = 'translateY(0)';
    }, 100);
    
    console.log('Clima mostrado exitosamente para:', fullLocation);
}

// Obtener emoji del icono según el tipo de clima
function getWeatherIcon(weatherType) {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 20;
    
    const weatherIcons = {
        'clear': isNight ? '🌙' : '☀️',
        'clouds': isNight ? '☁️' : '⛅',
        'rain': '🌧️',
        'drizzle': '🌦️',
        'thunderstorm': '⛈️',
        'snow': '❄️',
        'mist': '🌫️',
        'fog': '🌫️',
        'haze': '🌫️',
        'dust': '🌪️',
        'sand': '🌪️',
        'ash': '🌋',
        'squall': '💨',
        'tornado': '🌪️'
    };
    
    return weatherIcons[weatherType] || '🌤️';
}

// Obtener icono de tiempo según la hora
function getTimeIcon() {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) return '🌅';
    if (hour >= 12 && hour < 17) return '☀️';
    if (hour >= 17 && hour < 21) return '🌇';
    return '🌙';
}

// Mostrar error del clima
function showWeatherError() {
    const weatherInfo = document.getElementById('weatherInfo');
    
    if (!weatherInfo) return;
    
    weatherInfo.innerHTML = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 3rem; margin-bottom: 15px;">🌍</div>
            <div style="color: var(--text-light); font-weight: bold; margin-bottom: 10px;">
                No se pudo obtener el clima
            </div>
            <div style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 20px;">
                Verifica tu conexión a internet o permisos de ubicación
            </div>
            <button onclick="refreshWeather()" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.9rem;">
                🔄 Reintentar
            </button>
        </div>
    `;
    
    weatherInfo.style.display = 'block';
}

// Función para actualizar el clima manualmente
window.refreshWeather = async function() {
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        weatherInfo.style.display = 'none';
    }
    
    try {
        const location = await getAccurateLocation();
        await loadWeatherData(location.latitude, location.longitude);
    } catch (error) {
        console.warn('Error actualizando clima:', error.message);
        // Usar ubicación por defecto (Ciudad Juárez)
        await loadWeatherData(31.6904, -106.4245);
    }
};

// Función para detectar ubicación automáticamente al cargar página
window.autoDetectWeather = async function() {
    try {
        console.log('Iniciando detección automática del clima...');
        const location = await getAccurateLocation();
        await loadWeatherData(location.latitude, location.longitude);
    } catch (error) {
        console.warn('Detección automática fallida:', error.message);
        console.log('Usando ubicación por defecto');
        await loadWeatherData(31.6904, -106.4245);
    }
};

// Agregar estilos CSS para el loading spinner
function addWeatherStyles() {
    if (!document.getElementById('weather-styles')) {
        const style = document.createElement('style');
        style.id = 'weather-styles';
        style.textContent = `
            .loading-spinner {
                width: 30px;
                height: 30px;
                border: 3px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                border-top-color: var(--primary-color);
                animation: spin 1s ease-in-out infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .weather-container {
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
                border-radius: 15px;
                padding: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicialización automática si estamos en la página correcta
document.addEventListener('DOMContentLoaded', function() {
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        console.log('Módulo del clima inicializado');
        addWeatherStyles();
        
        // Auto-detectar clima después de un pequeño delay
        setTimeout(autoDetectWeather, 1000);
    }
});
