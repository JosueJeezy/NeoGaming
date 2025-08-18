const mysql = require('mysql2/promise');

// Configuración de la base de datos - usando variables de entorno
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'neogaming',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    // Configuración SSL para Railway (requerida en producción)
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
};

console.log('🔧 Configuración de base de datos:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    environment: process.env.NODE_ENV,
    ssl: dbConfig.ssl ? 'Habilitado' : 'Deshabilitado'
});

// Crear pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    idleTimeout: 300000,
    acquireTimeout: 60000
});

// Función para ejecutar consultas
const query = async (sql, params = []) => {
    try {
        console.log('Ejecutando consulta SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Error en la consulta SQL:', error.message);
        console.error('SQL:', sql);
        console.error('Params:', params);
        throw error;
    }
};

// Función para probar la conexión
const testConnection = async () => {
    try {
        await query('SELECT 1 as test');
        console.log('✅ Conexión a MySQL establecida correctamente');
        
        // Verificar que las tablas existen
        const tables = await query('SHOW TABLES');
        console.log('📋 Tablas disponibles:', tables.map(t => Object.values(t)[0]).join(', '));
        
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con MySQL:', error.message);
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('🔐 Error de autenticación: Verifica usuario y contraseña');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('🗄️ Base de datos no existe: Verifica el nombre de la base de datos');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error('🔌 Error de conexión: Verifica host, puerto y configuración de red');
        }
        
        return false;
    }
};

// Función para inicializar datos de ejemplo si las tablas están vacías
const initializeExampleData = async () => {
    try {
        // Primero verificar si la tabla products existe
        try {
            const products = await query('SELECT COUNT(*) as count FROM products');
            
            if (products[0].count === 0) {
                console.log('📦 Insertando productos de ejemplo...');
                
                const exampleProducts = [
                    ['Call of Duty: Modern Warfare', 'Shooter táctico de última generación con gráficos realistas', 59.99, 'Shooter / FPS', 'https://image.api.playstation.com/vulcan/ap/rnd/202302/2718/ba706e54d68d10a0334529312681f8991d1dd9bf6fd46231.png'],
                    ['Final Fantasy XVI', 'Épica aventura de fantasía con combates dinámicos', 69.99, 'RPG / Fantasía', 'https://image.api.playstation.com/vulcan/ap/rnd/202212/0609/RsEwjXfWmvl3J2u65qgzqHvJ.png'],
                    ['FIFA 24', 'La experiencia futbolística más realista del año', 49.99, 'Deportes / Carreras', 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1210/1684a4434e5ceb5c10db17bc7ac32862a59b0e4dcdd46b3a.jpg'],
                    ['Minecraft Legends', 'Construye, explora y sobrevive en mundos infinitos', 39.99, 'Estrategia / Simulación', 'https://www.minecraft.net/content/dam/games/minecraft/key-art/legends-keyart.jpg'],
                    ['Resident Evil 4 Remake', 'Horror de supervivencia que te mantendrá al borde', 59.99, 'Terror / Suspenso', 'https://image.api.playstation.com/vulcan/ap/rnd/202210/0706/EVWyZBz4gocTdKy00tVKGh3x.png']
                ];
                
                for (const product of exampleProducts) {
                    await query(
                        'INSERT INTO products (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
                        product
                    );
                }
                
                console.log('✅ Productos de ejemplo insertados correctamente');
            } else {
                console.log('📦 La base de datos ya tiene productos cargados');
            }
        } catch (error) {
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.log('⚠️ La tabla products no existe. Necesitas ejecutar el schema SQL primero.');
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('❌ Error insertando datos de ejemplo:', error.message);
    }
};

// Probar conexión e inicializar datos al cargar el módulo
const initializeDatabase = async () => {
    const isConnected = await testConnection();
    if (isConnected) {
        await initializeExampleData();
    }
};

// Solo inicializar automáticamente en desarrollo
// En producción (Vercel), se inicializará cuando se use por primera vez
if (process.env.NODE_ENV !== 'production') {
    initializeDatabase();
}

module.exports = {
    query,
    pool,
    testConnection,
    initializeExampleData
};
