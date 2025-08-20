// Configuración de PayPal
const PAYPAL_CLIENT_ID = 'AZn9TTNsJ_t-mwZYyePx8mwMELbqSZ1OPcaYOsWhaAJ6yHWewrwe2AdDSAgC74wCMmRtWZrD8Rb1br1X';

// Función principal para inicializar botón de PayPal
window.initPayPalButton = function(product) {
    const containerId = `paypal-button-container-${product.id}`;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container ${containerId} no encontrado`);
        return;
    }
    
    console.log('Inicializando PayPal para producto:', product.name, 'Precio:', product.price);
    
    // Limpiar container anterior
    container.innerHTML = '';
    
    // Mostrar formulario de pago simplificado para demostración
    showSimplePaymentForm(product, containerId);
};

// Mostrar formulario de pago simplificado
function showSimplePaymentForm(product, containerId) {
    const container = document.getElementById(containerId);
    const price = parseFloat(product.price) || 0;
    
    container.innerHTML = `
        <div style="background: var(--background-card); padding: 20px; border-radius: 10px; border: 2px solid var(--primary-color);">
            <div style="text-align: center; margin-bottom: 20px;">
                <h4 style="color: var(--primary-color); margin-bottom: 5px;">💳 Pago Rápido</h4>
                <p style="color: var(--text-gray); font-size: 0.9rem;">Simulación de pago - Demo</p>
            </div>
            
            <form id="paymentForm-${product.id}" onsubmit="processQuickPayment(event, ${product.id})">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <input type="text" placeholder="Nombre completo" required 
                           style="padding: 10px; border: 1px solid var(--background-gray); border-radius: 5px; background: var(--background-dark); color: var(--text-light);">
                    <input type="email" placeholder="Email" required
                           style="padding: 10px; border: 1px solid var(--background-gray); border-radius: 5px; background: var(--background-dark); color: var(--text-light);">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <input type="text" placeholder="**** **** **** 1234" maxlength="19" required
                           style="width: 100%; padding: 10px; border: 1px solid var(--background-gray); border-radius: 5px; background: var(--background-dark); color: var(--text-light);"
                           oninput="formatCardNumber(this)">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <input type="text" placeholder="MM/AA" maxlength="5" required
                           style="padding: 10px; border: 1px solid var(--background-gray); border-radius: 5px; background: var(--background-dark); color: var(--text-light);"
                           oninput="formatExpiry(this)">
                    <input type="text" placeholder="CVV" maxlength="3" required
                           style="padding: 10px; border: 1px solid var(--background-gray); border-radius: 5px; background: var(--background-dark); color: var(--text-light);">
                </div>
                
                <div style="background: var(--background-gray); padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
                    <div style="color: var(--text-light); font-size: 1.1rem; margin-bottom: 5px;">
                        Total a pagar
                    </div>
                    <div style="color: var(--primary-color); font-size: 1.5rem; font-weight: bold;">
                        $${price.toFixed(2)} USD
                    </div>
                </div>
                
                <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1.1rem;">
                    🚀 Pagar Ahora - $${price.toFixed(2)}
                </button>
            </form>
            
            <div style="text-align: center; margin-top: 15px;">
                <p style="color: var(--text-gray); font-size: 0.8rem;">
                    🔐 Pago seguro - Simulación para demostración
                </p>
            </div>
        </div>
    `;
}

// Procesar pago rápido - VERSIÓN CORREGIDA
window.processQuickPayment = function(event, productId) {
    event.preventDefault();
    
    console.log('🔍 Iniciando búsqueda de producto con ID:', productId, typeof productId);
    
    // Encontrar el producto por ID con búsqueda mejorada
    let product = null;
    
    // Función helper para comparar IDs de forma robusta
    const compareIds = (id1, id2) => {
        // Convertir ambos a string para comparación consistente
        return String(id1) === String(id2);
    };
    
    // 1. Primero buscar en productsData global (productos de la base de datos)
    if (window.productsData && window.productsData.length > 0) {
        console.log('🔍 Buscando en productsData (BD):', window.productsData.length, 'productos');
        product = window.productsData.find(p => compareIds(p.id, productId));
        if (product) {
            console.log('✅ Producto encontrado en BD:', product.name, 'ID:', product.id);
        }
    }
    
    // 2. Si no se encuentra, buscar en currentCategoryProducts (productos de categoría actual)
    if (!product && window.currentCategoryProducts && window.currentCategoryProducts.length > 0) {
        console.log('🔍 Buscando en currentCategoryProducts:', window.currentCategoryProducts.length, 'productos');
        product = window.currentCategoryProducts.find(p => compareIds(p.id, productId));
        if (product) {
            console.log('✅ Producto encontrado en categoría actual:', product.name, 'ID:', product.id);
        }
    }
    
    // 3. Como último recurso, buscar en productos de ejemplo (SOLO si no se encontró antes)
    if (!product) {
        console.log('🔍 Buscando en productos de ejemplo...');
        const exampleProducts = getExampleProductsForPayment();
        product = exampleProducts.find(p => compareIds(p.id, productId));
        if (product) {
            console.log('✅ Producto encontrado en ejemplos:', product.name, 'ID:', product.id);
        }
    }
    
    // 4. Si aún no se encuentra, crear un producto genérico con la información del modal actual
    if (!product) {
        console.warn('⚠️ Producto no encontrado, intentando extraer info del modal...');
        
        // Intentar obtener información del modal actual
        const modal = document.getElementById('productModal');
        const modalTitle = modal ? modal.querySelector('.modal-title')?.textContent : null;
        const modalPrice = modal ? modal.querySelector('.modal-price')?.textContent : null;
        const modalCategory = modal ? modal.querySelector('.modal-category')?.textContent : null;
        
        if (modalTitle) {
            // Extraer precio del texto (ej: "$59.99 USD" -> 59.99)
            let price = 29.99; // precio por defecto
            if (modalPrice) {
                const priceMatch = modalPrice.match(/\$(\d+\.?\d*)/);
                if (priceMatch) {
                    price = parseFloat(priceMatch[1]);
                }
            }
            
            product = {
                id: productId,
                name: modalTitle,
                price: price,
                category: modalCategory || 'Juego',
                description: `Producto con ID: ${productId}`
            };
            
            console.log('✅ Producto genérico creado desde modal:', product.name, 'Precio:', product.price);
        } else {
            // Crear producto completamente genérico
            product = {
                id: productId,
                name: 'Producto Desconocido',
                price: 29.99,
                category: 'Juego',
                description: `Producto no identificado con ID: ${productId}`
            };
            console.warn('⚠️ Producto genérico creado:', product);
        }
    }
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    console.log('💳 Procesando pago para:', product.name, 'Precio:', product.price, 'ID original:', productId);
    
    // Mostrar estado de carga
    submitBtn.innerHTML = '<div class="loading" style="display: inline-block; width: 20px; height: 20px; margin-right: 10px;"></div> Procesando...';
    submitBtn.disabled = true;
    
    // Simular procesamiento de pago (2 segundos)
    setTimeout(() => {
        try {
            // Simular pago exitoso
            const mockPaymentDetails = {
                id: `DEMO_${Date.now()}`,
                status: 'COMPLETED',
                amount: parseFloat(product.price) || 0,
                timestamp: new Date().toISOString(),
                card: '**** **** **** 1234'
            };
            
            console.log('✅ Pago completado exitosamente:', mockPaymentDetails);
            console.log('🎮 Producto procesado:', {
                id: product.id,
                name: product.name,
                price: product.price
            });
            
            handlePaymentSuccess(product, mockPaymentDetails);
        } catch (error) {
            console.error('❌ Error procesando pago:', error);
            // Restaurar botón en caso de error
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            handlePaymentError(product, error);
        }
    }, 2000);
};

// Formatear número de tarjeta
window.formatCardNumber = function(input) {
    let value = input.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue.substr(0, 19); // Limitar a 19 caracteres (16 números + 3 espacios)
};

// Formatear fecha de expiración
window.formatExpiry = function(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0,2) + '/' + value.substring(2,4);
    }
    input.value = value;
};

// Manejar pago exitoso
function handlePaymentSuccess(product, paymentDetails) {
    console.log('Ejecutando handlePaymentSuccess para:', product.name);
    
    // Cerrar modal actual
    closeModalSafely();
    
    // Esperar un poco para que se cierre el modal anterior
    setTimeout(() => {
        // Mostrar modal de éxito
        showSuccessModal(product, paymentDetails);
        
        // Registrar compra
        recordPurchase(product, paymentDetails);
    }, 300);
}

// Cerrar modal de forma segura
function closeModalSafely() {
    try {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('show');
            console.log('Modal cerrado exitosamente');
        }
    } catch (error) {
        console.error('Error cerrando modal:', error);
    }
}

// Mostrar modal de éxito
function showSuccessModal(product, paymentDetails) {
    console.log('Mostrando modal de éxito para:', product.name);
    
    // Remover modal de éxito anterior si existe
    const existingSuccessModal = document.querySelector('.success-modal');
    if (existingSuccessModal) {
        existingSuccessModal.remove();
    }
    
    const successModal = document.createElement('div');
    successModal.className = 'modal show success-modal';
    successModal.style.zIndex = '10001'; // Asegurar que esté encima de otros modales
    
    successModal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 500px; background: var(--background-dark); border: 2px solid var(--primary-color);">
            <div style="font-size: 5rem; color: var(--primary-color); margin-bottom: 20px;">🎉</div>
            <h2 style="color: var(--primary-color); margin-bottom: 15px; font-size: 2rem;">¡Pago Exitoso!</h2>
            
            <div style="background: var(--background-gray); padding: 25px; border-radius: 15px; margin: 25px 0;">
                <h3 style="color: var(--text-light); margin-bottom: 10px; font-size: 1.3rem;">${product.name}</h3>
                <p style="color: var(--text-gray); margin-bottom: 15px; font-style: italic;">${product.category || 'Juego'}</p>
                <div style="color: var(--primary-color); font-size: 1.8rem; font-weight: bold;">
                    $${paymentDetails.amount.toFixed(2)} USD
                </div>
            </div>
            
            <div style="background: var(--background-card); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid var(--primary-color);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
                    <div>
                        <p style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 5px;">ID de Transacción:</p>
                        <p style="color: var(--text-light); font-size: 0.9rem; font-weight: bold;">${paymentDetails.id}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 5px;">Estado:</p>
                        <p style="color: var(--primary-color); font-size: 0.9rem; font-weight: bold;">✅ ${paymentDetails.status}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 5px;">Tarjeta:</p>
                        <p style="color: var(--text-light); font-size: 0.9rem;">${paymentDetails.card}</p>
                    </div>
                    <div>
                        <p style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 5px;">Fecha:</p>
                        <p style="color: var(--text-light); font-size: 0.9rem;">${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            
            <div style="background: linear-gradient(135deg, var(--primary-color), var(--accent-purple)); padding: 20px; border-radius: 15px; margin: 25px 0;">
                <h4 style="color: white; margin-bottom: 10px; font-size: 1.2rem;">🎮 ¡Disfruta tu juego!</h4>
                <p style="color: white; font-size: 0.95rem; opacity: 0.9;">
                    Tu compra se ha procesado correctamente. El juego estará disponible en tu biblioteca.
                </p>
            </div>
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                <button onclick="closeSuccessModal()" 
                        class="btn btn-primary" style="padding: 12px 25px; font-size: 1rem;">
                    🚀 ¡Genial!
                </button>
                <button onclick="closeSuccessModalAndNavigate('products.html')" 
                        class="btn btn-secondary" style="padding: 12px 25px; font-size: 1rem;">
                    🛒 Ver más juegos
                </button>
            </div>
        </div>
    `;
    
    // Agregar event listener para cerrar al hacer clic fuera
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            closeSuccessModal();
        }
    });
    
    document.body.appendChild(successModal);
    console.log('Modal de éxito agregado al DOM');
    
    // Auto remover después de 15 segundos
    setTimeout(() => {
        if (successModal.parentNode) {
            successModal.remove();
            console.log('Modal de éxito removido automáticamente');
        }
    }, 15000);
}

// Cerrar modal de éxito
window.closeSuccessModal = function() {
    const successModal = document.querySelector('.success-modal');
    if (successModal) {
        successModal.remove();
        console.log('Modal de éxito cerrado manualmente');
    }
};

// Cerrar modal de éxito y navegar
window.closeSuccessModalAndNavigate = function(url) {
    closeSuccessModal();
    window.location.href = url;
};

// Manejar cancelación del pago
function handlePaymentCancel(product) {
    console.log('Pago cancelado para producto:', product.name);
    showPaymentAlert('Pago cancelado', 'El pago ha sido cancelado. Puedes intentar nuevamente cuando gustes.', 'info');
}

// Manejar errores de pago
function handlePaymentError(product, error) {
    console.error('Error en pago para producto:', product.name, error);
    showPaymentAlert(
        'Error en el pago', 
        'Hubo un problema procesando tu pago. Por favor intenta nuevamente.', 
        'error'
    );
}

// Mostrar alertas de pago
function showPaymentAlert(title, message, type) {
    const alertModal = document.createElement('div');
    alertModal.className = 'modal show';
    alertModal.style.zIndex = '10002'; // Encima de otros modales
    
    const alertColor = type === 'error' ? 'var(--accent-red)' : 
                     type === 'info' ? 'var(--accent-purple)' : 
                     'var(--primary-color)';
    
    const alertIcon = type === 'error' ? '⚠️' : 
                     type === 'info' ? 'ℹ️' : 
                     '✅';
    
    alertModal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 400px; background: var(--background-dark); border: 2px solid ${alertColor};">
            <div style="font-size: 3rem; margin-bottom: 20px;">${alertIcon}</div>
            <h3 style="color: ${alertColor}; margin-bottom: 15px;">${title}</h3>
            <p style="color: var(--text-gray); line-height: 1.6; margin-bottom: 25px;">
                ${message}
            </p>
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="btn btn-primary">
                Entendido
            </button>
        </div>
    `;
    
    document.body.appendChild(alertModal);
    
    // Auto remover después de 8 segundos
    setTimeout(() => {
        if (alertModal.parentNode) {
            alertModal.remove();
        }
    }, 8000);
}

// Registrar compra (para historial)
function recordPurchase(product, paymentDetails) {
    try {
        const purchaseData = {
            productId: product.id,
            productName: product.name,
            price: paymentDetails.amount,
            currency: 'USD',
            transactionId: paymentDetails.id,
            paymentStatus: paymentDetails.status,
            timestamp: new Date().toISOString(),
            userId: getCurrentUser()?.id || 'demo_user'
        };
        
        console.log('Registrando compra:', purchaseData);
        
        // Guardar en sessionStorage para la demo
        const purchases = JSON.parse(sessionStorage.getItem('purchases') || '[]');
        purchases.push(purchaseData);
        sessionStorage.setItem('purchases', JSON.stringify(purchases));
        
        console.log('Compra registrada exitosamente');
        
    } catch (error) {
        console.error('Error registrando compra:', error);
    }
}

// Obtener productos de ejemplo para pagos
function getExampleProductsForPayment() {
    return [
        {
            id: 1,
            name: 'Call of Duty: Modern Warfare III',
            description: 'El shooter táctico más intenso del año',
            price: 69.99,
            category: 'Shooter / FPS'
        },
        {
            id: 2,
            name: 'The Legend of Zelda: Tears of the Kingdom',
            description: 'Épica aventura de fantasía',
            price: 59.99,
            category: 'RPG / Fantasía'
        },
        {
            id: 3,
            name: 'EA Sports FC 24',
            description: 'La experiencia futbolística más realista',
            price: 49.99,
            category: 'Deportes / Carreras'
        },
        {
            id: 4,
            name: 'Cities: Skylines II',
            description: 'Construye y gestiona la ciudad de tus sueños',
            price: 44.99,
            category: 'Estrategia / Simulación'
        },
        {
            id: 5,
            name: 'Alan Wake 2',
            description: 'Horror psicológico que combina realidad y pesadilla',
            price: 59.99,
            category: 'Terror / Suspenso'
        },
        {
            id: 6,
            name: 'Pizza Tower',
            description: 'Plataformas indie lleno de creatividad',
            price: 19.99,
            category: 'Indie / Creativos'
        },
        {
            id: 7,
            name: 'Forza Horizon 5',
            description: 'Carreras arcade en mundo abierto',
            price: 39.99,
            category: 'Deportes / Carreras'
        },
        {
            id: 8,
            name: 'Baldurs Gate 3',
            description: 'RPG épico con decisiones que importan',
            price: 59.99,
            category: 'RPG / Fantasía'
        },
        {
            id: 9,
            name: 'Hades II',
            description: 'Roguelike indie con combates fluidos',
            price: 29.99,
            category: 'Indie / Creativos'
        },
        {
            id: 10,
            name: 'Dead Space (2023)',
            description: 'Remake del clásico horror espacial',
            price: 49.99,
            category: 'Terror / Suspenso'
        },
        // Productos específicos por categoría
        {
            id: 'fps1',
            name: 'Counter-Strike 2',
            description: 'El shooter táctico competitivo más jugado del mundo',
            price: 0,
            category: 'Shooter / FPS'
        },
        {
            id: 'fps2',
            name: 'Valorant',
            description: 'Shooter táctico 5v5 con habilidades únicas',
            price: 0,
            category: 'Shooter / FPS'
        },
        {
            id: 'fps3',
            name: 'Overwatch 2',
            description: 'Hero shooter dinámico con héroes únicos',
            price: 0,
            category: 'Shooter / FPS'
        },
        {
            id: 'rpg1',
            name: 'The Witcher 3: Wild Hunt',
            description: 'RPG épico de mundo abierto',
            price: 29.99,
            category: 'RPG / Fantasía'
        },
        {
            id: 'rpg2',
            name: 'Elden Ring',
            description: 'Obra maestra de FromSoftware',
            price: 49.99,
            category: 'RPG / Fantasía'
        },
        {
            id: 'rpg3',
            name: 'Skyrim Anniversary Edition',
            description: 'El RPG definitivo con cientos de horas de aventura',
            price: 39.99,
            category: 'RPG / Fantasía'
        },
        {
            id: 'sports1',
            name: 'Gran Turismo 7',
            description: 'Simulador de carreras definitivo',
            price: 54.99,
            category: 'Deportes / Carreras'
        },
        {
            id: 'sports2',
            name: 'NBA 2K24',
            description: 'La experiencia de baloncesto más auténtica',
            price: 44.99,
            category: 'Deportes / Carreras'
        },
        {
            id: 'sports3',
            name: 'F1 23',
            description: 'Vive la emoción de la Fórmula 1',
            price: 49.99,
            category: 'Deportes / Carreras'
        },
        {
            id: 'strategy1',
            name: 'Civilization VI',
            description: 'Construye un imperio que resistirá la prueba del tiempo',
            price: 34.99,
            category: 'Estrategia / Simulación'
        },
        {
            id: 'strategy2',
            name: 'Anno 1800',
            description: 'Construye ciudades prósperas durante la revolución industrial',
            price: 39.99,
            category: 'Estrategia / Simulación'
        },
        {
            id: 'strategy3',
            name: 'Total War: Rome II',
            description: 'Conquista el mundo antiguo',
            price: 29.99,
            category: 'Estrategia / Simulación'
        },
        {
            id: 'horror1',
            name: 'Phasmophobia',
            description: 'Investigación paranormal cooperativa',
            price: 13.99,
            category: 'Terror / Suspenso'
        },
        {
            id: 'horror2',
            name: 'The Dark Pictures: The Devil in Me',
            description: 'Terror cinematográfico con decisiones críticas',
            price: 39.99,
            category: 'Terror / Suspenso'
        },
        {
            id: 'horror3',
            name: 'Outlast Trinity',
            description: 'Trilogía completa del horror psicológico más intenso',
            price: 24.99,
            category: 'Terror / Suspenso'
        },
        {
            id: 'indie1',
            name: 'Hollow Knight',
            description: 'Metroidvania indie con arte espectacular',
            price: 14.99,
            category: 'Indie / Creativos'
        },
        {
            id: 'indie2',
            name: 'Stardew Valley',
            description: 'Simulación de granja relajante',
            price: 12.99,
            category: 'Indie / Creativos'
        },
        {
            id: 'indie3',
            name: 'Celeste',
            description: 'Plataformas desafiante con historia emotiva',
            price: 19.99,
            category: 'Indie / Creativos'
        }
    ];
}

// Función para obtener historial de compras
window.getPurchaseHistory = function() {
    return JSON.parse(sessionStorage.getItem('purchases') || '[]');
};

// Funciones auxiliares
function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : { id: 'demo_user', username: 'Usuario Demo' };
}

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo PayPal simplificado inicializado');
});

// Función adicional para mostrar historial de compras (debugging)
window.showPurchaseHistory = function() {
    const purchases = getPurchaseHistory();
    console.log('=== HISTORIAL DE COMPRAS ===');
    console.log(`Total de compras: ${purchases.length}`);
    purchases.forEach((purchase, index) => {
        console.log(`${index + 1}. ${purchase.productName} - ${purchase.price} USD - ${purchase.timestamp}`);
    });
    console.log('============================');
};
