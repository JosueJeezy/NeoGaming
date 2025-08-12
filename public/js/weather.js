// Configuración de la API del clima
const WEATHER_API_KEY = '49446b6194238df3739f282ced1e781a';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

// Función principal para cargar datos del clima
window.loadWeatherData = async function(lat, lon) {
    try {
        console.log(`Cargando clima para coordenadas: ${lat}, ${lon}`);
        
        const weatherData = await fetchWeatherData(lat, lon);
        if (weatherData) {
            displayWeatherInfo(weatherData);
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

// Mostrar información del clima en la interfaz
function displayWeatherInfo(weatherData) {
    const weatherInfo = document.getElementById('weatherInfo');
    const weatherContent = document.getElementById('weatherContent');
    
    if (!weatherInfo || !weatherContent) {
        console.warn('Elementos de clima no encontrados en el DOM');
        return;
    }
    
    // Extraer datos relevantes
    const temperature = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const humidity = weatherData.main.humidity;
    const windSpeed = Math.round(weatherData.wind.speed * 3.6); // Convertir m/s a km/h
    const feelsLike = Math.round(weatherData.main.feels_like);
    const cityName = weatherData.name;
    const country = weatherData.sys.country;
    
    // Obtener icono del clima
    const weatherIcon = getWeatherIcon(weatherData.weather[0].main.toLowerCase());
    
    // Crear HTML del clima
    weatherContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px;">
            <div style="font-size: 4rem;">${weatherIcon}</div>
            <div>
                <div class="weather-temp">${temperature}°C</div>
                <div class="weather-description">${description.charAt(0).toUpperCase() + description.slice(1)}</div>
                <div style="color: var(--text-gray); font-size: 0.9rem;">
                    📍 ${cityName}, ${country}
                </div>
            </div>
        </div>
        
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-label">Sensación térmica</div>
                <div class="weather-detail-value">${feelsLike}°C</div>
            </div>
            
            <div class="weather-detail">
                <div class="weather-detail-label">Humedad</div>
                <div class="weather-detail-value">${humidity}%</div>
            </div>
            
            <div class="weather-detail">
                <div class="weather-detail-label">Viento</div>
                <div class="weather-detail-value">${windSpeed} km/h</div>
            </div>
        </div>
    `;
    
    // Mostrar el contenedor del clima con animación
    weatherInfo.style.display = 'block';
    weatherInfo.style.opacity = '0';
    weatherInfo.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        weatherInfo.style.transition = 'all 0.5s ease';
        weatherInfo.style.opacity = '1';
        weatherInfo.style.transform = 'translateY(0)';
    }, 100);
}

// Obtener emoji del icono según el tipo de clima
function getWeatherIcon(weatherType) {
    const weatherIcons = {
        'clear': '☀️',
        'clouds': '☁️',
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

// Mostrar error del clima
function showWeatherError() {
    const weatherInfo = document.getElementById('weatherInfo');
    const weatherContent = document.getElementById('weatherContent');
    
    if (!weatherInfo || !weatherContent) return;
    
    weatherContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 3rem; margin-bottom: 15px;">🌍</div>
            <div style="color: var(--text-gray);">
                No se pudo obtener información del clima
            </div>
            <div style="color: var(--text-gray); font-size: 0.9rem; margin-top: 5px;">
                Verifica tu conexión a internet
            </div>
        </div>
    `;
    
    weatherInfo.style.display = 'block';
}

// Función para actualizar el clima manualmente
window.refreshWeather = function() {
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        weatherInfo.style.display = 'none';
    }
    
    // Volver a solicitar geolocalización
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                loadWeatherData(latitude, longitude);
            },
            (error) => {
                console.warn('Error obteniendo geolocalización:', error.message);
                // Usar ubicación por defecto
                loadWeatherData(31.6904, -106.4245);
            }
        );
    }
};

// Función para formatear fecha y hora
function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para obtener pronóstico extendido (opcional)
async function getWeatherForecast(lat, lon) {
    try {
        const url = `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error obteniendo pronóstico:', error);
        return null;
    }
}

// Inicialización automática si estamos en la página correcta
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página home y hay elementos de clima
    const weatherInfo = document.getElementById('weatherInfo');
    if (weatherInfo) {
        console.log('Módulo del clima inicializado');
    }
});