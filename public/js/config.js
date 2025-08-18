// Configuración global - Detección automática de host para Vercel
function getAPIBaseURL() {
    // En producción (Vercel), usar rutas relativas
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return '/api'; // Ruta relativa para Vercel
    }
    
    // En desarrollo local, usar puerto 3000
    return 'http://localhost:3000/api';
}

const API_BASE_URL = getAPIBaseURL();
console.log('🔧 API Base URL configurada:', API_BASE_URL);

// Función helper para hacer peticiones API
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Importante para CORS
    };

    // Agregar token si existe
    const token = localStorage.getItem('token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);

    try {
        const response = await fetch(url, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            console.error(`❌ API Error ${response.status}:`, errorData);
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ API Response:`, data);
        return data;
    } catch (error) {
        console.error('💥 API Request Error:', error);
        throw error;
    }
}

// Test de conectividad de la API
async function testAPIConnection() {
    try {
        console.log('🧪 Probando conexión API...');
        const response = await apiRequest('/health');
        console.log('✅ API conectada exitosamente:', response);
        return true;
    } catch (error) {
        console.warn('⚠️ API no disponible:', error.message);
        return false;
    }
}

// Exportar para usar en otros archivos
if (typeof window !== 'undefined') {
    window.API_BASE_URL = API_BASE_URL;
    window.apiRequest = apiRequest;
    window.testAPIConnection = testAPIConnection;
}

// Si estamos en el contexto del main.js original, mantener la funcionalidad existente
if (typeof window !== 'undefined' && window.location) {
    // Reemplazar la función getAPIBaseURL original en main.js
    if (typeof getAPIBaseURL === 'undefined') {
        window.getAPIBaseURL = getAPIBaseURL;
    }
}
