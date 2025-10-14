require('dotenv').config();

const { testConnection } = require('./config/db');
const express = require('express');
const cors = require('cors');
const path = require('path');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const stockMoveRoutes = require('./routes/stockMoveRoutes');
const saleRoutes = require('./routes/saleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const errorHandler = require('./middlewares/errorHandler');
const app = express();

//Middleware to handle CORS
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Rutas
app.use('/products', productRoutes);
app.use('/auth', authRoutes);
app.use('/stock-moves', stockMoveRoutes);
app.use('/sales', saleRoutes);
app.use('/categories', categoryRoutes);
app.use('/customers', customerRoutes);

// 404 básico
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await testConnection(); // verifica MySQL al arrancar
  console.log(`API lista en http://localhost:${PORT}`);
});
