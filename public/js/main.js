// Configuración global - Detección automática de host
function getAPIBaseURL() {
    // Obtener el host actual (IP de la VM)
    const currentHost = window.location.host;
    const protocol = window.location.protocol;
    
    // Si estamos en localhost, usar localhost, sino usar la IP actual
    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
        return 'http://localhost:3000/api';
    } else {
        // Usar la misma IP pero puerto 3000 para la API
        const hostIP = currentHost.split(':')[0]; // Remover puerto si existe
        return `${protocol}//${hostIP}:3000/api`;
    }
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
        // Comentar la verificación de auth por ahora para testing
        // if (!requireAuth()) return;
        
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
        // Cargar productos PRIMERO (más importante)
        await loadProducts();
        
        // Solicitar geolocalización y mostrar clima (secundario)
        await requestLocationAndWeather();
        
        // Mostrar mensaje de bienvenida
        if (currentUser) {
            console.log(`Bienvenido, ${currentUser.username}!`);
        }
        
    } catch (error) {
        console.error('Error inicializando página de inicio:', error);
        // Asegurar que al menos se muestren productos de ejemplo
        if (productsData.length === 0) {
            console.log('Cargando productos de ejemplo como fallback...');
            productsData = getExampleProducts();
            displayProducts(productsData);
        }
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

// Cargar productos desde la API
async function loadProducts() {
    console.log('Iniciando carga de productos...');
    
    try {
        console.log('Intentando cargar productos desde:', `${API_BASE_URL}/products`);
        
        // Timeout para la petición API
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout de API')), 5000)
        );
        
        const fetchPromise = fetch(`${API_BASE_URL}/products`);
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (response.ok) {
            productsData = await response.json();
            console.log('Productos cargados desde API:', productsData.length);
            displayProducts(productsData);
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.warn('Error cargando productos desde API:', error.message);
        console.log('Usando productos de ejemplo');
        productsData = getExampleProducts();
        displayProducts(productsData);
    }
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
    const productsToShow = products.slice(0, 8);
    console.log('Productos a mostrar:', productsToShow.length);
    
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-gray);">
                <div style="font-size: 3rem; margin-bottom: 20px;">🎮</div>
                <h3>No hay productos disponibles</h3>
                <p>Intenta recargar la página</p>
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
    
    // Obtener productos de la categoría
    let categoryProducts = productsData.filter(product => 
        product.category === category
    );
    
    // Si no hay productos de esa categoría, generar productos específicos
    if (categoryProducts.length === 0) {
        categoryProducts = generateProductsForCategory(category);
    }
    
    // Mostrar página de categoría con máximo 3 productos
    showCategoryPage(category, categoryProducts.slice(0, 3));
}

// Generar productos específicos para cada categoría
function generateProductsForCategory(category) {
    const categoryGames = {
        'Shooter / FPS': [
            {
                id: 'fps1',
                name: 'Counter-Strike 2',
                description: 'El shooter táctico competitivo más jugado del mundo con mecánicas renovadas y gráficos de nueva generación',
                price: 0,
                category: 'Shooter / FPS',
                image_url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg'
            },
            {
                id: 'fps2', 
                name: 'Valorant',
                description: 'Shooter táctico 5v5 con habilidades únicas que combina precisión y estrategia en cada ronda',
                price: 0,
                category: 'Shooter / FPS',
                image_url: 'https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt6fb8502c3555ad29/620b80369f9ede2e8f0f5bb6/VAL_Console_Announce_KeyArt_TextlessLogo_2560x1440_v001.jpg'
            },
            {
                id: 'fps3',
                name: 'Overwatch 2', 
                description: 'Hero shooter dinámico con héroes únicos, combates 6v6 y modos de juego emocionantes',
                price: 0,
                category: 'Shooter / FPS',
                image_url: 'https://images.blz-contentstack.com/v3/assets/blt2477dcaf4ebd440c/blt3b1678b7d3e8bee5/62e968b86dbb5b4d5cddc75e/OW2_SeasonOne_PressKit_FullLaunch_002.jpg'
            }
        ],
        'RPG / Fantasía': [
            {
                id: 'rpg1',
                name: 'The Witcher 3: Wild Hunt',
                description: 'RPG épico de mundo abierto con decisiones que importan y batallas contra criaturas fantásticas',
                price: 29.99,
                category: 'RPG / Fantasía',
                image_url: 'https://image.api.playstation.com/vulcan/img/rnd/202211/0711/kh4MrqLiYLE00AEbAuKBgbEt.png'
            },
            {
                id: 'rpg2',
                name: 'Elden Ring',
                description: 'Obra maestra de FromSoftware que combina mundo abierto con combates desafiantes y lore profundo',
                price: 49.99,
                category: 'RPG / Fantasía', 
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202110/2000/phvVT0qZfcRms5qDAk0SI3CM.png'
            },
            {
                id: 'rpg3',
                name: 'Skyrim Anniversary Edition',
                description: 'El RPG definitivo con cientos de horas de aventura, mods y libertad total de exploración',
                price: 39.99,
                category: 'RPG / Fantasía',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202108/0410/0Jz6uJLxOK7JOMMfcfHFBi1D.png'
            }
        ],
        'Deportes / Carreras': [
            {
                id: 'sports1',
                name: 'Gran Turismo 7',
                description: 'Simulador de carreras definitivo con más de 400 autos y circuitos icónicos del mundo',
                price: 54.99,
                category: 'Deportes / Carreras',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/1018/OFgROKqv2bBEP8vP7Qa3xqAj.png'
            },
            {
                id: 'sports2',
                name: 'NBA 2K24',
                description: 'La experiencia de baloncesto más auténtica con modos MyCareer, MyTeam y juego online',
                price: 44.99,
                category: 'Deportes / Carreras',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202305/0920/1f8f6b6bc97dc1c8f6bcc69e2a53949df7e0bc55dca0b4e8.png'
            },
            {
                id: 'sports3',
                name: 'F1 23',
                description: 'Vive la emoción de la Fórmula 1 con todos los circuitos oficiales y modo carrera inmersivo',
                price: 49.99,
                category: 'Deportes / Carreras',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1611/f63cf6c5bb2566636708b1babfefa9479b8a2b8524d1e8d8.png'
            }
        ],
        'Estrategia / Simulación': [
            {
                id: 'strategy1',
                name: 'Civilization VI',
                description: 'Construye un imperio que resistirá la prueba del tiempo en este clásico juego de estrategia por turnos',
                price: 34.99,
                category: 'Estrategia / Simulación',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/0822/cGq2uKYCRqbVwLKwO6b4qY65.png'
            },
            {
                id: 'strategy2',
                name: 'Anno 1800',
                description: 'Construye ciudades prósperas durante la revolución industrial con comercio y diplomacia complejos',
                price: 39.99,
                category: 'Estrategia / Simulación',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202203/1500/wrKIqrrSXr0WgBQ6kS8P04gA.png'
            },
            {
                id: 'strategy3',
                name: 'Total War: Rome II',
                description: 'Conquista el mundo antiguo combinando estrategia por turnos con batallas épicas en tiempo real',
                price: 29.99,
                category: 'Estrategia / Simulación',
                image_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/214950/header.jpg'
            }
        ],
        'Terror / Suspenso': [
            {
                id: 'horror1',
                name: 'Phasmophobia',
                description: 'Investigación paranormal cooperativa que te hará saltar del asiento con amigos',
                price: 13.99,
                category: 'Terror / Suspenso',
                image_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/739630/header.jpg'
            },
            {
                id: 'horror2',
                name: 'The Dark Pictures: The Devil in Me',
                description: 'Terror cinematográfico con decisiones que determinan quién vive y quién muere',
                price: 39.99,
                category: 'Terror / Suspenso',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202209/2917/eaZtI8EG6VLKLyYBSt9KEG52.png'
            },
            {
                id: 'horror3',
                name: 'Outlast Trinity',
                description: 'Trilogía completa del horror psicológico más intenso sin posibilidad de defenderte',
                price: 24.99,
                category: 'Terror / Suspenso',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202104/0517/XMmZH6HlTw0V3KMT8M0CjY1O.png'
            }
        ],
        'Indie / Creativos': [
            {
                id: 'indie1',
                name: 'Hollow Knight',
                description: 'Metroidvania indie con arte espectacular, combates precisos y mundo interconectado',
                price: 14.99,
                category: 'Indie / Creativos',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/0711/0DPn2ZMNEgLWqMbv9qjgdz7n.png'
            },
            {
                id: 'indie2',
                name: 'Stardew Valley',
                description: 'Simulación de granja relajante con elementos de RPG, crafting y relaciones sociales',
                price: 12.99,
                category: 'Indie / Creativos',
                image_url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413150/header.jpg'
            },
            {
                id: 'indie3',
                name: 'Celeste',
                description: 'Plataformas desafiante con una historia emotiva sobre salud mental y superación personal',
                price: 19.99,
                category: 'Indie / Creativos',
                image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202111/0711/LCaG7AaQsKdHXKEKlKfHLlr9.png'
            }
        ]
    };
    
    return categoryGames[category] || [];
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
                        ${products.length} juegos seleccionados
                    </span>
                </div>
            </div>
            
            <!-- Productos de la categoría -->
            <div class="category-products" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-bottom: 50px;">
                ${products.map(product => createCategoryProductCard(product)).join('')}
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

// Crear tarjeta de producto para página de categoría (CORREGIDA)
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
        'Deportes / Carreras': '🏎️',
        'Estrategia / Simulación': '🏗️',
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

// Productos de ejemplo en caso de que la API no esté disponible
function getExampleProducts() {
    return [
        {
            id: 1,
            name: 'Call of Duty: Modern Warfare III',
            description: 'El shooter táctico más intenso del año con gráficos de última generación y combates multijugador épicos',
            price: 69.99,
            category: 'Shooter / FPS',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202310/0410/c90521de8a000b1b68e0b20237ba88fe8e49cfc3a3ac2f58.png'
        },
        {
            id: 2,
            name: 'The Legend of Zelda: Tears of the Kingdom',
            description: 'Épica aventura de fantasía con un mundo abierto masivo lleno de secretos por descubrir',
            price: 59.99,
            category: 'RPG / Fantasía',
            image_url: 'https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000063714/58fa8e90b0ee4b894b2e21ac97b59a84f1e1d3d8a8c59ea2acf5b9b89a3cac5a'
        },
        {
            id: 3,
            name: 'EA Sports FC 24',
            description: 'La experiencia futbolística más realista con mecánicas mejoradas y modos de juego innovadores',
            price: 49.99,
            category: 'Deportes / Carreras',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1210/1684a4434e5ceb5c10db17bc7ac32862a59b0e4dcdd46b3a.jpg'
        },
        {
            id: 4,
            name: 'Cities: Skylines II',
            description: 'Construye y gestiona la ciudad de tus sueños con herramientas de simulación avanzadas',
            price: 44.99,
            category: 'Estrategia / Simulación',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/48c673a6b90e3e5bd6e1fcc0606dcba40ad43b3b69f5a2f6.png'
        },
        {
            id: 5,
            name: 'Alan Wake 2',
            description: 'Horror psicológico que combina realidad y pesadilla en una experiencia única y aterrorizante',
            price: 59.99,
            category: 'Terror / Suspenso',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1719/caedc8ceb709d0b2e2b71549be9b6cff2e95bbff59e92f3e.png'
        },
        {
            id: 6,
            name: 'Pizza Tower',
            description: 'Plataformas indie lleno de creatividad, humor y mecánicas innovadoras que te sorprenderán',
            price: 19.99,
            category: 'Indie / Creativos',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202212/1315/2nXUeKVLNFMqYTfRQrCfHRMh.png'
        },
        {
            id: 7,
            name: 'Forza Horizon 5',
            description: 'Carreras arcade en mundo abierto con los autos más espectaculares en paisajes de México',
            price: 39.99,
            category: 'Deportes / Carreras',
            image_url: 'https://compass-ssl.xbox.com/assets/d2/90/d2909e95-6f74-46c2-baa6-6d34a4d9a8a8.jpg'
        },
        {
            id: 8,
            name: 'Baldurs Gate 3',
            description: 'RPG épico con decisiones que importan, combates tácticos y una historia inolvidable',
            price: 59.99,
            category: 'RPG / Fantasía',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202302/2321/ba706e54d68d10a0334529312681f8991d1dd9bf6fd46231.png'
        },
        {
            id: 9,
            name: 'Hades II',
            description: 'Roguelike indie con combates fluidos, arte espectacular y narrativa mitológica envolvente',
            price: 29.99,
            category: 'Indie / Creativos',
            image_url: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145350/header.jpg'
        },
        {
            id: 10,
            name: 'Dead Space (2023)',
            description: 'Remake del clásico horror espacial con gráficos renovados y terror más intenso que nunca',
            price: 49.99,
            category: 'Terror / Suspenso',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202208/1017/RoVYjLkdKqzWQ6Q8AIrAxM6O.png'
        }
    ];
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

window.debugCategories = function() {
    console.log('=== DEBUG CATEGORÍAS ===');
    
    const categories = ['Shooter / FPS', 'RPG / Fantasía', 'Deportes / Carreras', 'Estrategia / Simulación', 'Terror / Suspenso', 'Indie / Creativos'];
    
    categories.forEach(category => {
        console.log(`\n--- ${category} ---`);
        const products = generateProductsForCategory(category);
        console.log(`Productos generados: ${products.length}`);
        products.forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.name} - ${product.price}`);
        });
    });
    
    console.log('\n======================');
};

window.testCategory = function(category) {
    console.log(`Probando categoría: ${category}`);
    const products = generateProductsForCategory(category);
    console.log('Productos:', products);
    filterProductsByCategory(category);
};
