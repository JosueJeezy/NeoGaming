const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();

// Configuración CORS para producción y desarrollo
const corsOptions = {
    origin: function (origin, callback) {
        // En producción, permitir solo dominios específicos
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigins = [
                'https://tu-dominio.vercel.app', // Reemplaza con tu dominio real
                /https:\/\/.*\.vercel\.app$/ // Permitir subdominios de Vercel
            ];
            
            if (!origin || allowedOrigins.some(allowedOrigin => {
                if (allowedOrigin instanceof RegExp) {
                    return allowedOrigin.test(origin);
                }
                return allowedOrigin === origin;
            })) {
                callback(null, true);
            } else {
                callback(new Error('No permitido por CORS'));
            }
        } else {
            // En desarrollo, permitir cualquier origen
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Rutas API - IMPORTANTE: todas las rutas deben empezar con /api/
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Ruta de salud para verificar que el servidor funciona
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor NeoGaming funcionando en Vercel',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en servidor:', err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Manejo de rutas API no encontradas
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint de API no encontrado' });
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🎮 Servidor NeoGaming corriendo en puerto ${PORT}`);
        console.log(`📡 API disponible en: http://localhost:${PORT}/api`);
    });
}

// Exportar para Vercel
module.exports = app;
