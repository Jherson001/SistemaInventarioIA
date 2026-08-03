require('dotenv').config();

const { testConnection } = require('./config/db');
const { ensureSchema } = require('./migrations/ensureSchema');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const stockMoveRoutes = require('./routes/stockMoveRoutes');
const saleRoutes = require('./routes/saleRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middlewares/errorHandler');
const aiRoutes = require('./routes/ai');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos.' }
});

app.get('/health', (req, res) =>
  res.json({ ok: true, mode: 'inventory', api: 'users-v1' })
);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/products', productRoutes);
app.use('/api/stock-moves', stockMoveRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await testConnection();
  await ensureSchema();
  console.log(`API inventario lista en http://localhost:${PORT}`);
});
