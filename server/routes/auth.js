const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../config/database');

const router = express.Router();
const saltRounds = 10;

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validar datos
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await query(
            'SELECT id FROM users WHERE email = ? OR username = ?', 
            [email, username]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ 
                error: 'El usuario o email ya existe' 
            });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar nuevo usuario
        const result = await query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar datos
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email y contraseña son obligatorios' 
            });
        }

        // Buscar usuario
        const users = await query(
            'SELECT id, username, email, password FROM users WHERE email = ?', 
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        const user = users[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ 
                error: 'Credenciales inválidas' 
            });
        }

        // Enviar respuesta exitosa (sin contraseña)
        res.json({ 
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;