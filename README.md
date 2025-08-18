# 🎮 NeoGaming - Plataforma de Videojuegos

Una aplicación web híbrida moderna para tienda de videojuegos con funcionalidades completas de e-commerce, geolocalización, integración de pagos y más.

## 📋 Características Principales

- ✅ **Autenticación completa** (Registro/Login)
- 🌍 **Geolocalización** y pronóstico del clima
- 🗺️ **Mapas interactivos** con OpenStreetMap
- 💳 **Integración con PayPal** para pagos
- 📱 **Diseño responsivo** y moderno
- 🎨 **Interfaz estilo gaming** con animaciones
- 🛒 **Catálogo de productos** con filtros
- 🏪 **Búsqueda de tiendas** cercanas

## 🏗️ Estructura del Proyecto

```
neogaming/
├── server/                 # Backend Node.js
│   ├── server.js          # Servidor principal
│   ├── config/
│   │   └── database.js    # Configuración MySQL
│   ├── routes/
│   │   ├── auth.js        # Rutas de autenticación
│   │   └── products.js    # Rutas de productos
│   └── package.json       # Dependencias del servidor
├── public/                # Frontend estático
│   ├── index.html         # Página de bienvenida
│   ├── login.html         # Página de login
│   ├── register.html      # Página de registro
│   ├── home.html          # Página principal (post-login)
│   ├── search.html        # Búsqueda y mapas
│   ├── products.html      # Catálogo completo
│   ├── about.html         # Información de la empresa
│   ├── css/
│   │   └── styles.css     # Estilos principales
│   └── js/
│       ├── auth.js        # Lógica de autenticación
│       ├── main.js        # Funcionalidad principal
│       ├── weather.js     # API del clima
│       ├── maps.js        # Funcionalidad de mapas
│       └── paypal.js      # Integración PayPal
├── database/
│   └── schema.sql         # Esquema de base de datos
└── README.md             # Este archivo
```

## 🚀 Instalación

### Prerrequisitos

- **Node.js** (v14 o superior)
- **MySQL** (v8.0 o superior)
- **Navegador web moderno**

### Paso 1: Configurar la Base de Datos

1. Instala y configura MySQL
2. Ejecuta el archivo `database/schema.sql`:

```sql
mysql -u root -p < database/schema.sql
```

3. Configura las credenciales en `server/config/database.js`:

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'tu_usuario',        // Cambia esto
    password: 'tu_contraseña', // Cambia esto
    database: 'neogaming'
};
```

### Paso 2: Instalar Dependencias del Servidor

```bash
cd server
npm install
```

### Paso 3: Instalar dependencias adicionales

Si no tienes algunas dependencias, instálalas:

```bash
npm install express mysql2 cors body-parser bcrypt
```

### Paso 4: Ejecutar la Aplicación

```bash
cd server
node server.js
```

El servidor estará disponible en: `http://localhost:3000`

## 🔧 Configuración de APIs

### API OpenWeather (Clima)

- **API Key configurada:** `49446b6194238df3739f282ced1e781a`
- Ubicación en código: `js/weather.js`

### API PayPal (Pagos)

- **Client ID configurado:** `AZn9TTNsJ_t-mwZYyePx8mwMELbqSZ1OPcaYOsWhaAJ6yHWewrwe2AdDSAgC74wCMmRtWZrD8Rb1br1X`
- **Cuentas de prueba:**
  - Vendedor: `pinochopillin@business.example.com` (Contraseña: `d!Zb2Y#`)
  - Comprador: `methodman@personal.example.com` (Contraseña: `4@IKq4}#`)

### Mapas (OpenStreetMap)

- Utiliza Leaflet.js con tiles gratuitos de OpenStreetMap
- No requiere API key

## 💻 Uso de la Aplicación

### 1. Página de Bienvenida (`index.html`)
- Diseño inspirado en las imágenes proporcionadas
- Botones para "Iniciar Sesión" y "Registrarse"

### 2. Registro de Usuario (`register.html`)
- Formulario con Username, Email y Contraseña
- Validación del lado cliente y servidor
- Almacenamiento seguro con bcrypt

### 3. Inicio de Sesión (`login.html`)
- Autenticación con email y contraseña
- Redirección automática al home

### 4. Página Principal (`home.html`)
- **Solicita geolocalización** al cargar
- **Muestra clima actual** usando OpenWeather API
- **6 categorías de juegos** como se muestra en las imágenes
- **5 productos destacados** con modals interactivos

### 5. Búsqueda (`search.html`)
- Mapa interactivo con ubicación del usuario
- **5 tiendas ficticias** cerca de Ciudad Juárez
- Botones para direcciones y más información

### 6. Catálogo Completo (`products.html`)
- **10+ productos** con filtros por categoría
- Modals con integración completa de PayPal
- Diseño responsivo con animaciones

### 7. Acerca de (`about.html`)
- Información de la empresa
- Mapa de ubicación de NeoGaming
- Datos de contacto y testimonios

## 🎨 Características de Diseño

### Colores y Estilo
- **Color principal:** Verde neón (`#00ff88`)
- **Fondo:** Negro y grises oscuros
- **Tipografía:** Moderna y gaming-oriented
- **Animaciones:** Smooth transitions y efectos hover

### Responsividad
- Diseño mobile-first
- Breakpoints para tablet y desktop
- Grid system flexible

## 🛠️ Funcionalidades Técnicas

### Autenticación
- Hash de contraseñas con bcrypt
- Sesiones con sessionStorage
- Protección de rutas

### Base de Datos
- Pool de conexiones MySQL
- Consultas preparadas para seguridad
- Manejo de errores robusto

### APIs Externas
1. **OpenWeather:** Clima en tiempo real
2. **PayPal:** Pagos seguros
3. **OpenStreetMap:** Mapas sin costo

### Optimizaciones
- Lazy loading de productos
- Estados de carga y error
- Manejo de conexiones fallidas

## 🐛 Resolución de Problemas

### Error de Conexión MySQL
```bash
Error: ER_ACCESS_DENIED_ERROR
```
**Solución:** Verifica credenciales en `config/database.js`

### PayPal no carga
```bash
PayPal SDK no está disponible
```
**Solución:** Verifica conexión a internet y client ID

### Geolocalización bloqueada
**Solución:** La app usa ubicación por defecto (Ciudad Juárez)

## 🚧 Desarrollo Futuro

### Features Planeadas
- [ ] Sistema de carrito de compras
- [ ] Wishlist de usuarios
- [ ] Reviews y ratings
- [ ] Chat en vivo
- [ ] Programa de lealtad
- [ ] Notificaciones push
- [ ] API REST completa
- [ ] Panel de administración

### Mejoras Técnicas
- [ ] JWT para autenticación
- [ ] Redis para caché
- [ ] Docker containerization
- [ ] Tests automatizados
- [ ] CI/CD pipeline

## 📞 Soporte

- **Email:** soporte@neogaming.mx
- **Teléfono:** +52 (656) 688-3800
- **Dirección:** Av. Tecnológico 1340, Ciudad Juárez, Chih.

## 📄 Licencia

Este proyecto es para fines educativos y demostrativos.

---

## 🎮 ¡Disfruta Gaming!

**NeoGaming** - Tu universo gamer en un solo lugar 🚀
