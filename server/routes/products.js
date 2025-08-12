const express = require('express');
const { query } = require('../config/database');

const router = express.Router();

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const products = await query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(products);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener productos por categoría
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const products = await query(
            'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC',
            [category]
        );
        res.json(products);
    } catch (error) {
        console.error('Error al obtener productos por categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener un producto específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const products = await query('SELECT * FROM products WHERE id = ?', [id]);
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(products[0]);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener categorías disponibles
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await query('SELECT DISTINCT category FROM products');
        res.json(categories.map(cat => cat.category));
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;