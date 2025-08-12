-- Crear base de datos
CREATE DATABASE IF NOT EXISTS neogaming;
USE neogaming;

-- Tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos/juegos
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar algunos juegos de ejemplo
INSERT INTO products (name, description, price, category, image_url) VALUES
('Call of Duty: Modern Warfare', 'Shooter táctico de última generación con gráficos realistas', 59.99, 'Shooter / FPS', 'https://image.api.playstation.com/vulcan/ap/rnd/202302/2718/ba706e54d68d10a0334529312681f8991d1dd9bf6fd46231.png'),
('Final Fantasy XVI', 'Épica aventura de fantasía con combates dinámicos', 69.99, 'RPG / Fantasía', 'https://image.api.playstation.com/vulcan/ap/rnd/202212/0609/RsEwjXfWmvl3J2u65qgzqHvJ.png'),
('FIFA 24', 'La experiencia futbolística más realista del año', 49.99, 'Deportes / Carreras', 'https://image.api.playstation.com/vulcan/ap/rnd/202305/1210/1684a4434e5ceb5c10db17bc7ac32862a59b0e4dcdd46b3a.jpg'),
('Minecraft Legends', 'Construye, explora y sobrevive en mundos infinitos', 39.99, 'Estrategia / Simulación', 'https://www.minecraft.net/content/dam/games/minecraft/key-art/legends-keyart.jpg'),
('Resident Evil 4 Remake', 'Horror de supervivencia que te mantendrá al borde', 59.99, 'Terror / Suspenso', 'https://image.api.playstation.com/vulcan/ap/rnd/202210/0706/EVWyZBz4gocTdKy00tVKGh3x.png');

-- Crear índices para mejor rendimiento
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_category ON products(category);