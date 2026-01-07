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
const insightsRoutes = require('./routes/insightsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middlewares/errorHandler');

const aiRoutes = require('./routes/ai');           // <-- NUEVO

const app = express();

// CORS
app.use(cors({
  origin:'*',
  methods: ['GET','POST','PUT','DELETE'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stock-moves', stockMoveRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/insights', insightsRoutes); 
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);                          
// 404 básico
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await testConnection();
  console.log(`API lista en http://localhost:${PORT}`);
});
