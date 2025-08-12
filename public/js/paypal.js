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
    
    // Limpiar container anterior
    container.innerHTML = '';
    
    // Verificar que PayPal esté cargado
    if (typeof paypal === 'undefined') {
        console.error('PayPal SDK no está cargado');
        container.innerHTML = `
            <div style="text-align: center; color: var(--accent-red);">
                Error: PayPal no disponible
            </div>
        `;
        return;
    }
    
    // Configurar botón de PayPal
    paypal.Buttons({
        // Estilo del botón
        style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 45
        },
        
        // Crear orden
        createOrder: function(data, actions) {
            console.log('Creando orden para producto:', product);
            
            return actions.order.create({
                purchase_units: [{
                    reference_id: `game_${product.id}`,
                    amount: {
                        currency_code: 'USD',
                        value: product.price.toFixed(2)
                    },
                    description: `${product.name} - ${product.category}`,
                    custom_id: `neogaming_${product.id}_${Date.now()}`,
                    soft_descriptor: 'NEOGAMING'
                }],
                application_context: {
                    brand_name: 'NeoGaming',
                    locale: 'es-MX',
                    landing_page: 'BILLING',
                    user_action: 'PAY_NOW'
                }
            });
        },
        
        // Manejar aprobación del pago
        onApprove: function(data, actions) {
            console.log('Pago aprobado:', data);
            
            return actions.order.capture().then(function(details) {
                console.log('Detalles del pago:', details);
                handlePaymentSuccess(product, details);
            });
        },
        
        // Manejar cancelación
        onCancel: function(data) {
            console.log('Pago cancelado:', data);
            handlePaymentCancel(product);
        },
        
        // Manejar errores
        onError: function(err) {
            console.error('Error en PayPal:', err);
            handlePaymentError(product, err);
        }
        
    }).render(`#${containerId}`).catch(function(error) {
        console.error('Error renderizando botón PayPal:', error);
        container.innerHTML = `
            <div style="text-align: center; color: var(--accent-red); padding: 20px;">
                <p>Error cargando opciones de pago</p>
                <button onclick="location.reload()" class="btn btn-secondary" style="margin-top: 10px;">
                    Reintentar
                </button>
            </div>
        `;
    });
};

// Manejar pago exitoso
function handlePaymentSuccess(product, paymentDetails) {
    console.log('Pago completado exitosamente:', paymentDetails);
    
    // Cerrar modal actual
    closeModal();
    
    // Mostrar modal de éxito
    showSuccessModal(product, paymentDetails);
    
    // Opcional: Enviar información al servidor
    recordPurchase(product, paymentDetails);
}

// Mostrar modal de éxito
function showSuccessModal(product, paymentDetails) {
    // Crear modal de éxito
    const successModal = document.createElement('div');
    successModal.className = 'modal show';
    successModal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 450px;">
            <div style="font-size: 4rem; color: var(--primary-color); margin-bottom: 20px;">🎉</div>
            <h2 style="color: var(--primary-color); margin-bottom: 15px;">¡Compra Exitosa!</h2>
            
            <div style="background: var(--background-gray); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: var(--text-light); margin-bottom: 10px;">${product.name}</h3>
                <p style="color: var(--text-gray); margin-bottom: 15px;">${product.category}</p>
                <div style="color: var(--primary-color); font-size: 1.5rem; font-weight: bold;">
                    $${product.price.toFixed(2)} USD
                </div>
            </div>
            
            <div style="background: var(--background-card); padding: 15px; border-radius: 10px; margin: 15px 0;">
                <p style="color: var(--text-gray); font-size: 0.9rem; margin-bottom: 5px;">
                    ID de Transacción: ${paymentDetails.id}
                </p>
                <p style="color: var(--text-gray); font-size: 0.9rem;">
                    Estado: ${paymentDetails.status}
                </p>
            </div>
            
            <div style="margin-top: 30px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="btn btn-primary" style="margin-right: 10px;">
                    ¡Genial!
                </button>
                <button onclick="window.location.href='products.html'" 
                        class="btn btn-secondary">
                    Ver más juegos
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(successModal);
    
    // Auto remover después de 10 segundos
    setTimeout(() => {
        if (successModal.parentNode) {
            successModal.remove();
        }
    }, 10000);
}

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
    
    const alertColor = type === 'error' ? 'var(--accent-red)' : 
                     type === 'info' ? 'var(--accent-purple)' : 
                     'var(--primary-color)';
    
    const alertIcon = type === 'error' ? '❌' : 
                     type === 'info' ? 'ℹ️' : 
                     '✅';
    
    alertModal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 400px;">
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

// Registrar compra (opcional - para analytics o historial)
async function recordPurchase(product, paymentDetails) {
    try {
        const purchaseData = {
            productId: product.id,
            productName: product.name,
            price: product.price,
            currency: 'USD',
            transactionId: paymentDetails.id,
            paymentStatus: paymentDetails.status,
            timestamp: new Date().toISOString(),
            userId: getCurrentUser()?.id || 'anonymous'
        };
        
        console.log('Registrando compra:', purchaseData);
        
        // Aquí podrías enviar los datos al servidor
        // await fetch(`${API_BASE_URL}/purchases`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(purchaseData)
        // });
        
        // Por ahora solo guardamos en sessionStorage para la demo
        const purchases = JSON.parse(sessionStorage.getItem('purchases') || '[]');
        purchases.push(purchaseData);
        sessionStorage.setItem('purchases', JSON.stringify(purchases));
        
    } catch (error) {
        console.error('Error registrando compra:', error);
    }
}

// Función para obtener historial de compras (demo)
window.getPurchaseHistory = function() {
    return JSON.parse(sessionStorage.getItem('purchases') || '[]');
};

// Función para validar disponibilidad de PayPal
function validatePayPalAvailability() {
    if (typeof paypal === 'undefined') {
        console.warn('PayPal SDK no está disponible');
        return false;
    }
    
    if (!PAYPAL_CLIENT_ID) {
        console.error('Client ID de PayPal no configurado');
        return false;
    }
    
    return true;
}

// Función alternativa para mostrar botón manual si PayPal falla
function showManualPaymentButton(product, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="margin-bottom: 15px; color: var(--text-gray);">
                💳 Pago con PayPal
            </div>
            <button onclick="simulatePayment(${JSON.stringify(product).replace(/"/g, '&quot;')})" 
                    class="btn btn-primary" style="width: 100%;">
                Pagar ${product.price.toFixed(2)} USD
            </button>
            <div style="margin-top: 10px; font-size: 0.8rem; color: var(--text-gray);">
                Modo demostración
            </div>
        </div>
    `;
}

// Simular pago para demostración
window.simulatePayment = function(product) {
    console.log('Simulando pago para:', product);
    
    // Simular delay de procesamiento
    const originalContent = document.getElementById(`paypal-button-container-${product.id}`).innerHTML;
    document.getElementById(`paypal-button-container-${product.id}`).innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="loading" style="margin: 0 auto 10px;"></div>
            <div style="color: var(--text-gray);">Procesando pago...</div>
        </div>
    `;
    
    setTimeout(() => {
        // Simular pago exitoso
        const mockPaymentDetails = {
            id: `DEMO_${Date.now()}`,
            status: 'COMPLETED',
            purchase_units: [{
                amount: {
                    value: product.price.toFixed(2),
                    currency_code: 'USD'
                }
            }]
        };
        
        handlePaymentSuccess(product, mockPaymentDetails);
    }, 2000);
};

// Función para reinicializar PayPal si es necesario
window.reinitializePayPal = function(product) {
    const containerId = `paypal-button-container-${product.id}`;
    const container = document.getElementById(containerId);
    
    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="loading"></div></div>';
        
        setTimeout(() => {
            if (validatePayPalAvailability()) {
                initPayPalButton(product);
            } else {
                showManualPaymentButton(product, containerId);
            }
        }, 1000);
    }
};

// Inicialización del módulo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Módulo PayPal inicializado');
    
    // Verificar disponibilidad de PayPal
    if (!validatePayPalAvailability()) {
        console.warn('PayPal no está completamente disponible - usando modo demostración');
    }
});

// Función auxiliar para cerrar modal (referencia externa)
function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Función auxiliar para obtener usuario actual
function getCurrentUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}