const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
    host: 'localhost',
    user: 'root', // Cambia por tu usuario de MySQL
    password: '12345', // Cambia por tu contraseña de MySQL
    database: 'neogaming',
    charset: 'utf8mb4',
    timezone: '+00:00',
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

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
            console.error('🔐 Error de autenticación: Verifica usuario y contraseña en database.js');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('🗄️  Base de datos no existe: Ejecuta el archivo schema.sql primero');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Conexión rechazada: Verifica que MySQL esté ejecutándose');
        }
        
        return false;
    }
};

// Función para inicializar datos de ejemplo si las tablas están vacías
const initializeExampleData = async () => {
    try {
        // Verificar si ya hay productos
        const products = await query('SELECT COUNT(*) as count FROM products');
        
        if (products[0].count === 0) {
            console.log('📦 Insertando productos de ejemplo...');
            
            const exampleProducts = [
                ['Call of Duty: Modern Warfare', 'Shooter táctico de última generación con gráficos realistas', 59.99, 'Shooter / FPS', 'https://image.api.playstation.com/vulcan/ap/rnd/202302/2718/ba706e54d68d10a0334529312681f8991d1dd9bf6fd46231.png'],
                ['Final Fantasy XVI', 'Épica aventura de fantasía con combates dinámicos', 69.99, 'RPG / Fantasía', 'https://image.api.playstation.com/vulcan/ap/rnd/202212/0609/RsEwjXfWmvl3J2u65qgzqHvJ.png'],
                ['FIFA 24', 'La experiencia futbolística más realista del año', 49.99, 'Deportes / Carreras', 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1210/1684a4434e5ceb5c10db17bc7ac32862a59b0e4dcdd46b3a.jpg'],
                ['Minecraft Legends', 'Construye, explora y sobrevive en mundos infinitos', 39.99, 'Estrategia / Simulación', 'https://www.minecraft.net/content/dam/games/minecraft/key-art/legends-keyart.jpg'],
                ['Resident Evil 4 Remake', 'Horror de supervivencia que te mantendrá al borde', 59.99, 'Terror / Suspenso', 'https://image.api.playstation.com/vulcan/ap/rnd/202210/0706/EVWyZBz4gocTdKy00tVKGh3x.png'],
                ['The Legend of Zelda: Tears of the Kingdom', 'La secuela más esperada con nuevas mecánicas de construcción', 59.99, 'Aventura / Acción', null],
                ['Cyberpunk 2077 Ultimate Edition', 'RPG futurista con todas las expansiones incluidas', 79.99, 'RPG / Ciencia Ficción', null],
                ['Grand Theft Auto VI', 'La nueva entrega de la saga más exitosa', 69.99, 'Acción / Aventura', null],
                ['Forza Horizon 5', 'Racing arcade en México con gráficos espectaculares', 59.99, 'Deportes / Carreras', null],
                ['Halo Infinite', 'El Master Chief regresa en una nueva aventura épica', 49.99, 'Shooter / FPS', null]
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

// Inicializar automáticamente
initializeDatabase();

module.exports = {
    query,
    pool,
    testConnection,
    initializeExampleData
};
