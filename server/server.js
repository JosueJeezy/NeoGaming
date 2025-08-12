const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración CORS mejorada para VM
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Postman) y de cualquier origen para desarrollo
        if (!origin) return callback(null, true);
        
        // Permitir localhost y cualquier IP de red local
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];
        
        // Permitir cualquier IP local (192.168.x.x, 10.x.x.x, etc.)
        const isLocalNetwork = origin.match(/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/);
        
        if (allowedOrigins.includes(origin) || isLocalNetwork) {
            callback(null, true);
        } else {
            console.log('Origen permitido para desarrollo:', origin);
            callback(null, true); // Para desarrollo, permitir todos los orígenes
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'No origin'}`);
    next();
});

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Ruta de salud para verificar que el servidor funciona
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor NeoGaming funcionando correctamente',
        timestamp: new Date().toISOString() 
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error en servidor:', err.stack);
    res.status(500).json({ error: 'Algo salió mal en el servidor!' });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        res.status(404).json({ error: 'Endpoint de API no encontrado' });
    } else {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log('🎮 SERVIDOR NEOGAMING INICIADO');
    console.log('='.repeat(50));
    console.log(`🌐 URL Local: http://localhost:${PORT}`);
    console.log(`🌐 URL VM: http://[IP_DE_TU_VM]:${PORT}`);
    console.log(`📡 API Base: http://[IP_DE_TU_VM]:${PORT}/api`);
    console.log(`❤️  Health Check: http://[IP_DE_TU_VM]:${PORT}/api/health`);
    console.log('='.repeat(50));
    console.log('Para obtener la IP de tu VM ejecuta: ip addr show');
    console.log('='.repeat(50));
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT recibido, cerrando servidor...');
    server.close(() => {
        console.log('Servidor cerrado.');
        process.exit(0);
    });
});

module.exports = app;