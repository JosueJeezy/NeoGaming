// Configuración de la API - Detección automática de host
function getAPIBaseURL() {
    // En producción (Vercel), usar rutas relativas
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return '/api'; // Ruta relativa para Vercel
    }
    // En desarrollo local, usar puerto 3000
    return 'http://localhost:3000/api';
}

const API_BASE_URL = getAPIBaseURL();
console.log('API Base URL configurada:', API_BASE_URL);

// Función para mostrar alertas
function showAlert(elementId, message, type = 'error') {
    const alertElement = document.getElementById(elementId);
    if (alertElement) {
        alertElement.innerHTML = message;
        alertElement.className = `alert alert-${type}`;
        alertElement.style.display = 'block';
        
        // Ocultar la alerta después de 5 segundos
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
}

// Función para mostrar loading en botones
function toggleButtonLoading(buttonId, isLoading = true, originalText = '') {
    const button = document.getElementById(buttonId);
    if (button) {
        if (isLoading) {
            button.innerHTML = '<span class="loading"></span> Procesando...';
            button.disabled = true;
        } else {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}

// Manejo del formulario de registro
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    // Registro de usuario
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Validaciones básicas
            if (!username || !email || !password) {
                showAlert('registerAlert', 'Todos los campos son obligatorios', 'error');
                return;
            }

            if (password.length < 6) {
                showAlert('registerAlert', 'La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }

            if (!/\S+@\S+\.\S+/.test(email)) {
                showAlert('registerAlert', 'Por favor ingresa un email válido', 'error');
                return;
            }

            toggleButtonLoading('registerBtn', true, 'REGISTRARSE');

            try {
                console.log('Enviando registro a:', `${API_BASE_URL}/auth/register`);
                
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();
                console.log('Respuesta del servidor:', data);

                if (response.ok) {
                    showAlert('registerAlert', '¡Registro exitoso! Redirigiendo...', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showAlert('registerAlert', data.error || 'Error en el registro', 'error');
                }
            } catch (error) {
                console.error('Error en registro:', error);
                showAlert('registerAlert', 'Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
            } finally {
                toggleButtonLoading('registerBtn', false, 'REGISTRARSE');
            }
        });
    }

    // Inicio de sesión
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            // Validaciones básicas
            if (!email || !password) {
                showAlert('loginAlert', 'Email y contraseña son obligatorios', 'error');
                return;
            }

            toggleButtonLoading('loginBtn', true, 'INICIAR SESIÓN');

            try {
                console.log('Enviando login a:', `${API_BASE_URL}/auth/login`);
                
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log('Respuesta del servidor:', data);

                if (response.ok) {
                    showAlert('loginAlert', '¡Inicio de sesión exitoso! Redirigiendo...', 'success');
                    
                    // Guardar información del usuario (solo en memoria durante la sesión)
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    sessionStorage.setItem('isLoggedIn', 'true');
                    
                    setTimeout(() => {
                        window.location.href = 'home.html';
                    }, 1500);
                } else {
                    showAlert('loginAlert', data.error || 'Credenciales incorrectas', 'error');
                }
            } catch (error) {
                console.error('Error en login:', error);
                showAlert('loginAlert', 'Error de conexión. Verifica que el servidor esté ejecutándose.', 'error');
            } finally {
                toggleButtonLoading('loginBtn', false, 'INICIAR SESIÓN');
            }
        });
    }
});

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

// Función para obtener información del usuario
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Función para cerrar sesión
function logout() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// Proteger páginas que requieren autenticación
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Redirigir usuarios autenticados desde páginas de auth
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'home.html';
    }
}

// Función para probar conexión con el servidor
async function testServerConnection() {
    try {
        console.log('Probando conexión con servidor...');
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
            console.log('✅ Conexión con servidor exitosa');
            return true;
        } else {
            console.warn('⚠️ Servidor responde pero con error:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error conectando con servidor:', error);
        return false;
    }
}

// Probar conexión al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    testServerConnection();
});
