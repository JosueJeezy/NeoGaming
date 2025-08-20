// Configuración global - Detección automática de host
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

let productsData = [];
let currentUser = null;
let currentCategoryProducts = []; // Variable para almacenar productos de categoría actual

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('Inicializando aplicación...');
    
    // Verificar si estamos en una página que requiere autenticación
    const protectedPages = ['home.html', 'search.html', 'products.html', 'about.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    
    console.log('Página actual:', currentPage);
    
    if (protectedPages.includes(currentPage)) {
        // Obtener usuario actual si existe
        currentUser = getCurrentUser();
        console.log('Usuario actual:', currentUser);
        
        await initializeHomePage();
    }
    
    // Configurar event listeners globales
    setupGlobalEventListeners();
}

// Configurar event listeners globales
function setupGlobalEventListeners() {
    // Botón de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Cerrar modal al hacer clic en X o fuera del modal
    const modal = document.getElementById('productModal');
    if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Event listener para categorías
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });
}

// Inicializar página de inicio
async function initializeHomePage() {
    console.log('Inicializando página de inicio...');
    
    try {
        // Cargar productos de la base de datos OBLIGATORIAMENTE
        await loadProducts();
        
        // Solicitar geolocalización y mostrar clima (secundario)
        await requestLocationAndWeather();
        
        // Mostrar mensaje de bienvenida
        if (currentUser) {
            console.log(`Bienvenido, ${currentUser.username}!`);
        }
        
    } catch (error) {
        console.error('Error inicializando página de inicio:', error);
        // Mostrar mensaje de error si no se pueden cargar productos de BD
        showProductsError();
    }
}

// Solicitar geolocalización y mostrar clima
async function requestLocationAndWeather() {
    if (!navigator.geolocation) {
        console.warn('Geolocalización no soportada');
        return;
    }
    
    try {
        console.log('Solicitando ubicación precisa...');
        
        // Usar la función mejorada de weather.js
        if (window.autoDetectWeather) {
            await window.autoDetectWeather();
        } else {
            // Fallback al método anterior
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log('Ubicación obtenida:', latitude, longitude);
                        
                        // Cargar información del clima
                        if (window.loadWeatherData) {
                            await window.loadWeatherData(latitude, longitude);
                        }
                        resolve();
                    },
                    (error) => {
                        console.warn('Error obteniendo geolocalización:', error.message);
                        // Usar ubicación por defecto (Ciudad Juárez)
                        if (window.loadWeatherData) {
                            window.loadWeatherData(31.6904, -106.4245);
                        }
                        resolve();
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 300000
                    }
                );
            });
        }
    } catch (error) {
        console.error('Error en requestLocationAndWeather:', error);
    }
}

// Cargar productos desde la API (SOLO BASE DE DATOS)
async function loadProducts() {
    console.log('Iniciando carga de productos desde base de datos...');
    
    try {
        console.log('Cargando productos desde:', `${API_BASE_URL}/products`);
        
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            productsData = await response.json();
            console.log('✅ Productos cargados desde base de datos:', productsData.length);
            displayProducts(productsData);
        } else {
            throw new Error(`HTTP ${response.status} - No se pudieron cargar los productos`);
        }
    } catch (error) {
        console.error('❌ Error cargando productos desde base de datos:', error.message);
        throw error; // Re-lanzar el error para que initializeHomePage lo capture
    }
}

// Mostrar error cuando no se pueden cargar productos
function showProductsError() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('Elemento productsGrid no encontrado');
        return;
    }
    
    productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-gray);">
            <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
            <h3>Error al cargar productos</h3>
            <p>No se pudieron cargar los productos desde la base de datos.</p>
            <p>Por favor, verifica la conexión con el servidor.</p>
            <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 20px;">
                🔄 Intentar de nuevo
            </button>
        </div>
    `;
}

// Mostrar productos en la página
function displayProducts(products) {
    console.log('Mostrando productos:', products.length);
    
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
        console.error('Elemento productsGrid no encontrado');
        return;
    }
    
    productsGrid.innerHTML = '';
    
    // Mostrar solo los primeros 8 productos en la página home
    const productsToShow = products.slice(0, 12);
    console.log('Productos a mostrar:', productsToShow.length);
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-gray);">
                <div style="font-size: 3rem; margin-bottom: 20px;">📦</div>
                <h3>No hay productos disponibles</h3>
                <p>La base de datos está vacía</p>
            </div>
        `;
        return;
    }
    
    productsToShow.forEach((product, index) => {
        console.log(`Creando tarjeta para producto ${index + 1}:`, product.name);
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
    
    console.log('Productos mostrados exitosamente');
}

// Crear tarjeta de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    
    // Asegurar que el precio sea un número válido
    const price = parseFloat(product.price) || 0;
    
    card.innerHTML = `
        <div class="product-image">
            ${product.image_url ? 
                `<img src="${product.image_url}" alt="${product.name}" 
                     loading="lazy"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem; background: var(--background-gray);">🎮</div>` 
                : 
                '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem; background: var(--background-gray);">🎮</div>'
            }
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-category">${product.category}</p>
            <p class="product-description">${product.description ? product.description.substring(0, 80) + '...' : 'Descripción no disponible'}</p>
            <div class="product-price">$${price.toFixed(2)} USD</div>
        </div>
    `;
    
    card.addEventListener('click', () => showProductModal(product));
    
    return card;
}

// Mostrar modal del producto
function showProductModal(product) {
    const modal = document.getElementById('productModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) return;
    
    const price = parseFloat(product.price) || 0;
    
    modalContent.innerHTML = `
        <div class="modal-image">
            ${product.image_url ? 
                `<img src="${product.image_url}" alt="${product.name}" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem; background: var(--background-gray);">🎮</div>` 
                : 
                '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem; background: var(--background-gray);">🎮</div>'
            }
        </div>
        <h2 class="modal-title">${product.name}</h2>
        <p class="modal-category">${product.category}</p>
        <p class="modal-description">${product.description || 'Descripción no disponible'}</p>
        <div class="modal-price">$${price.toFixed(2)} USD</div>
        <div class="modal-actions">
            <div id="paypal-button-container-${product.id}" class="paypal-button-container"></div>
        </div>
    `;
    
    modal.classList.add('show');
    
    // Inicializar botón de PayPal
    if (window.initPayPalButton) {
        setTimeout(() => {
            window.initPayPalButton(product);
        }, 100);
    }
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Filtrar productos por categoría y mostrar página dinámica
function filterProductsByCategory(category) {
    console.log('Filtrando por categoría:', category);
    
    // Obtener productos de la categoría desde la base de datos
    let categoryProducts = productsData.filter(product => 
        product.category === category
    );
    
    // Si no hay productos de esa categoría en BD, mostrar mensaje
    if (categoryProducts.length === 0) {
        showCategoryPage(category, []);
        return;
    }
    
    // Mostrar página de categoría con máximo 3 productos
    showCategoryPage(category, categoryProducts.slice(0, 3));
}

// Mostrar página dinámica de categoría
function showCategoryPage(category, products) {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Guardar productos actuales para el modal
    currentCategoryProducts = products;
    console.log(`Mostrando categoría "${category}" con productos:`, products);
    
    // Crear contenido de la página de categoría
    const categoryPageHTML = `
        <div id="categoryPage" class="category-page" style="margin-top: 100px;">
            <!-- Botón de regreso -->
            <div style="margin-bottom: 30px;">
                <button onclick="returnToHome()" class="btn btn-secondary" style="display: flex; align-items: center; gap: 10px;">
                    ← Volver al inicio
                </button>
            </div>
            
            <!-- Header de categoría -->
            <div class="category-header" style="text-align: center; margin-bottom: 50px;">
                <h1 style="color: var(--primary-color); font-size: 2.5rem; margin-bottom: 15px;">
                    ${getCategoryIcon(category)} ${category}
                </h1>
                <p style="color: var(--text-gray); font-size: 1.1rem; max-width: 600px; margin: 0 auto;">
                    ${getCategoryDescription(category)}
                </p>
                <div style="margin-top: 20px; color: var(--text-light);">
                    <span style="background: var(--primary-color); padding: 5px 15px; border-radius: 20px; font-size: 0.9rem;">
                        ${products.length} juegos disponibles
                    </span>
                </div>
            </div>
            
            <!-- Productos de la categoría -->
            <div class="category-products" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-bottom: 50px;">
                ${products.length > 0 ? 
                    products.map(product => createCategoryProductCard(product)).join('') : 
                    '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-gray);"><h3>No hay productos disponibles en esta categoría</h3></div>'
                }
            </div>
            
            <!-- Call to action -->
            <div style="text-align: center; padding: 40px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                <h3 style="color: var(--text-light); margin-bottom: 15px;">
                    ¿Te interesan más juegos de ${category}?
                </h3>
                <p style="color: var(--text-gray); margin-bottom: 25px;">
                    Explora nuestra colección completa o descubre otras categorías
                </p>
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="returnToHome()" class="btn btn-primary">
                        Ver todas las categorías
                    </button>
                    <button onclick="showAllProducts()" class="btn btn-secondary">
                        Explorar catálogo completo
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Ocultar contenido principal y mostrar página de categoría
    hideMainContent();
    container.insertAdjacentHTML('beforeend', categoryPageHTML);
    
    // Scroll suave al inicio de la página de categoría
    setTimeout(() => {
        document.getElementById('categoryPage').scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    console.log(`Página de categoría "${category}" mostrada con ${products.length} productos`);
}

// Crear tarjeta de producto para página de categoría
function createCategoryProductCard(product) {
    const price = parseFloat(product.price) || 0;
    const priceText = price === 0 ? 'Gratis' : `$${price.toFixed(2)} USD`;
    
    return `
        <div class="category-product-card" style="background: var(--background-card); border-radius: 15px; overflow: hidden; transition: all 0.3s ease; cursor: pointer; border: 2px solid transparent;" 
             onclick="showProductModalById('${product.id}')"
             onmouseover="this.style.border='2px solid var(--primary-color)'; this.style.transform='translateY(-5px)'"
             onmouseout="this.style.border='2px solid transparent'; this.style.transform='translateY(0)'">
            
            <!-- Imagen del producto -->
            <div style="height: 200px; overflow: hidden; position: relative;">
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.name}" 
                         style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;"
                         onmouseover="this.style.transform='scale(1.05)'"
                         onmouseout="this.style.transform='scale(1)'"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem; background: var(--background-gray);">🎮</div>` 
                    : 
                    '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem; background: var(--background-gray);">🎮</div>'
                }
                
                <!-- Badge de precio -->
                <div style="position: absolute; top: 15px; right: 15px; background: var(--primary-color); color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem;">
                    ${priceText}
                </div>
            </div>
            
            <!-- Información del producto -->
            <div style="padding: 25px;">
                <h3 style="color: var(--text-light); font-size: 1.3rem; margin-bottom: 10px; line-height: 1.3;">
                    ${product.name}
                </h3>
                <p style="color: var(--text-gray); line-height: 1.5; margin-bottom: 20px; font-size: 0.95rem;">
                    ${product.description}
                </p>
                
                <!-- Botón de acción -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: var(--primary-color); font-size: 1.1rem; font-weight: bold;">
                        ${priceText}
                    </span>
                    <button onclick="event.stopPropagation(); showProductModalById('${product.id}')" 
                            class="btn btn-primary" style="padding: 8px 20px; font-size: 0.9rem;">
                        ${price === 0 ? 'Jugar ahora' : 'Comprar'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Nueva función para mostrar modal por ID
function showProductModalById(productId) {
    // Buscar el producto en el array actual de productos de la categoría
    let product = currentCategoryProducts.find(p => p.id === productId);
    
    // Si no se encuentra, buscar en todos los productos
    if (!product) {
        product = productsData.find(p => p.id === productId);
    }
    
    if (product) {
        showProductModal(product);
    } else {
        console.error('Producto no encontrado:', productId);
    }
}

// Obtener icono para cada categoría
function getCategoryIcon(category) {
    const icons = {
        'Shooter / FPS': '🔫',
        'RPG / Fantasía': '⚔️',
        'Deportes / Carreras': '🎯',
        'Estrategia / Simulación': '🗺️',
        'Terror / Suspenso': '👻',
        'Indie / Creativos': '🎨'
    };
    return icons[category] || '🎮';
}

// Obtener descripción para cada categoría
function getCategoryDescription(category) {
    const descriptions = {
        'Shooter / FPS': 'Experimenta la adrenalina pura con los mejores shooters en primera persona. Combates intensos, armas variadas y acción sin límites.',
        'RPG / Fantasía': 'Sumérgete en mundos fantásticos llenos de aventuras épicas, magia poderosa y personajes inolvidables.',
        'Deportes / Carreras': 'Siente la velocidad y la competición con simuladores deportivos y juegos de carreras ultra-realistas.',
        'Estrategia / Simulación': 'Pon a prueba tu mente táctica construyendo imperios, gestionando recursos y conquistando territorios.',
        'Terror / Suspenso': 'Prepárate para experiencias escalofriantes que pondrán a prueba tus nervios y acelerar tu corazón.',
        'Indie / Creativos': 'Descubre joyas creativas e innovadoras creadas por desarrolladores independientes con visiones únicas.'
    };
    return descriptions[category] || 'Explora una selección cuidadosamente curada de los mejores juegos de esta categoría.';
}

// Ocultar contenido principal
function hideMainContent() {
    const mainSections = document.querySelectorAll('.hero, .categories-section, .products-section');
    mainSections.forEach(section => {
        section.style.display = 'none';
    });
}

// Mostrar contenido principal
function showMainContent() {
    const mainSections = document.querySelectorAll('.hero, .categories-section, .products-section');
    mainSections.forEach(section => {
        section.style.display = 'block';
    });
}

// Volver a la página principal
function returnToHome() {
    // Eliminar página de categoría si existe
    const categoryPage = document.getElementById('categoryPage');
    if (categoryPage) {
        categoryPage.remove();
    }
    
    // Mostrar contenido principal
    showMainContent();
    
    // Scroll suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('Regresando a la página principal');
}

// Mostrar todos los productos
function showAllProducts() {
    // Volver a home primero
    returnToHome();
    
    // Luego mostrar todos los productos
    setTimeout(() => {
        displayProducts(productsData);
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
}

// Función para obtener usuario actual
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Función de logout
function logout() {
    sessionStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Función para smooth scrolling
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Event listener para links de smooth scroll
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        smoothScrollTo(targetId);
    }
});

// Efectos de animación al hacer scroll
function handleScrollAnimations() {
    const elements = document.querySelectorAll('.slide-in-left, .slide-in-right, .fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
            }
        });
    });
    
    elements.forEach(element => {
        observer.observe(element);
    });
}

// Inicializar animaciones cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleScrollAnimations);
} else {
    handleScrollAnimations();
}

// Funciones para debugging
window.debugProducts = function() {
    console.log('=== DEBUG PRODUCTOS ===');
    console.log('Productos cargados:', productsData.length);
    console.log('Productos:', productsData);
    console.log('Grid element:', document.getElementById('productsGrid'));
    console.log('======================');
};

window.testCategory = function(category) {
    console.log(`Probando categoría: ${category}`);
    const products = productsData.filter(p => p.category === category);
    console.log('Productos:', products);
    filterProductsByCategory(category);
};
