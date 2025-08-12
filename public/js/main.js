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

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    // Verificar si estamos en una página que requiere autenticación
    const protectedPages = ['home.html', 'search.html', 'products.html', 'about.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        if (!requireAuth()) return;
        currentUser = getCurrentUser();
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
    try {
        // Solicitar geolocalización y mostrar clima
        await requestLocationAndWeather();
        
        // Cargar productos
        await loadProducts();
        
        // Mostrar mensaje de bienvenida
        if (currentUser) {
            console.log(`Bienvenido, ${currentUser.username}!`);
        }
        
    } catch (error) {
        console.error('Error inicializando página de inicio:', error);
    }
}

// Solicitar geolocalización y mostrar clima
async function requestLocationAndWeather() {
    if (!navigator.geolocation) {
        console.warn('Geolocalización no soportada');
        return;
    }
    
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
                timeout: 10000,
                enableHighAccuracy: true
            }
        );
    });
}

// Cargar productos desde la API
async function loadProducts() {
    try {
        console.log('Cargando productos desde:', `${API_BASE_URL}/products`);
        
        const response = await fetch(`${API_BASE_URL}/products`);
        if (response.ok) {
            productsData = await response.json();
            console.log('Productos cargados desde API:', productsData.length);
            displayProducts(productsData);
        } else {
            console.warn('Error cargando productos desde API, usando datos de ejemplo');
            productsData = getExampleProducts();
            displayProducts(productsData);
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        console.log('Usando productos de ejemplo');
        productsData = getExampleProducts();
        displayProducts(productsData);
    }
}

// Mostrar productos en la página
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    productsGrid.innerHTML = '';
    
    // Mostrar solo los primeros 5 productos en la página home
    const productsToShow = products.slice(0, 5);
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Crear tarjeta de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    
    card.innerHTML = `
        <div class="product-image">
            ${product.image_url ? 
                `<img src="${product.image_url}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem;">🎮</div>` 
                : 
                '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem;">🎮</div>'
            }
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-category">${product.category}</p>
            <p class="product-description">${product.description ? product.description.substring(0, 80) + '...' : 'Descripción no disponible'}</p>
            <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
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
    
    modalContent.innerHTML = `
        <div class="modal-image">
            ${product.image_url ? 
                `<img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div style="display: none; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem;">🎮</div>` 
                : 
                '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 4rem;">🎮</div>'
            }
        </div>
        <h2 class="modal-title">${product.name}</h2>
        <p class="modal-category">${product.category}</p>
        <p class="modal-description">${product.description || 'Descripción no disponible'}</p>
        <div class="modal-price">$${parseFloat(product.price).toFixed(2)}</div>
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

// Filtrar productos por categoría
function filterProductsByCategory(category) {
    const filteredProducts = productsData.filter(product => 
        product.category === category
    );
    displayProducts(filteredProducts);
    
    // Scroll hacia la sección de productos
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Productos de ejemplo en caso de que la API no esté disponible
function getExampleProducts() {
    return [
        {
            id: 1,
            name: 'Call of Duty: Modern Warfare',
            description: 'Shooter táctico de última generación con gráficos realistas y combates intensos',
            price: 59.99,
            category: 'Shooter / FPS',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202302/2718/ba706e54d68d10a0334529312681f8991d1dd9bf6fd46231.png'
        },
        {
            id: 2,
            name: 'Final Fantasy XVI',
            description: 'Épica aventura de fantasía con combates dinámicos y una historia envolvente',
            price: 69.99,
            category: 'RPG / Fantasía',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202212/0609/RsEwjXfWmvl3J2u65qgzqHvJ.png'
        },
        {
            id: 3,
            name: 'FIFA 24',
            description: 'La experiencia futbolística más realista del año con nuevas mecánicas',
            price: 49.99,
            category: 'Deportes / Carreras',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1210/1684a4434e5ceb5c10db17bc7ac32862a59b0e4dcdd46b3a.jpg'
        },
        {
            id: 4,
            name: 'Minecraft Legends',
            description: 'Construye, explora y sobrevive en mundos infinitos llenos de posibilidades',
            price: 39.99,
            category: 'Estrategia / Simulación',
            image_url: 'https://www.minecraft.net/content/dam/games/minecraft/key-art/legends-keyart.jpg'
        },
        {
            id: 5,
            name: 'Resident Evil 4 Remake',
            description: 'Horror de supervivencia que te mantendrá al borde del asiento',
            price: 59.99,
            category: 'Terror / Suspenso',
            image_url: 'https://image.api.playstation.com/vulcan/ap/rnd/202210/0706/EVWyZBz4gocTdKy00tVKGh3x.png'
        }
    ];
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