# Sistema de inventario y ventas

Sistema web full stack para gestionar **productos, stock, ventas, clientes, usuarios por rol y un dashboard de métricas**. Incluye un servicio aparte en Python que detecta productos de **baja rotación** mediante reglas heurísticas y un score ponderado (no utiliza un modelo de lenguaje / ChatGPT).

El módulo de frontend de clientes/ventas relacionado está también en [Modulo-customers-Listo](https://github.com/Jherson001/Modulo-customers-Listo) ([demo en vivo](https://modulo-customers-listo.vercel.app)).

## Qué hace

- **Autenticación y seguridad:** Login con JWT, contraseñas encriptadas (`bcryptjs`), `helmet` y rate limit en `/api/auth`
- **Control de roles:** Permisos diferenciados para **Admin** (gestión de usuarios/personal y configuración) y **Cajero** (operación limitada)
- **Inventario y mostrador:** CRUD de productos, categorías y clientes; movimientos de stock y pantalla **QuickStock** compatible con **lectores de código de barras USB**
- **Ventas y reportes:** Registro de ventas, dashboard con gráficos e insights y exportación a Excel (`exceljs`)
- **Detección de baja rotación (`ai:job`):** Job programable en Node que lee ventas/stock en MySQL, consulta el servicio en Python y guarda las alertas de rotación

## Cómo funciona la “IA” (Motor de reglas)

En `ai-service/app/rules.py`, el servicio calcula tres métricas a partir de los últimos 30 y 90 días (`days_since_last_sale`, `days_of_inventory` y unidades por semana) y obtiene un score entre `0` y `1`:

- `0.45 ×` días sin venta + `0.40 ×` días de inventario + `0.15 ×` baja rotación semanal
- Si el **score ≥ 0.6**, etiqueta el producto como `low_rotation` y genera el motivo legible (por ejemplo: `≥45 días sin venta`, `≥60 días de inventario` o `<1 u/sem (90d)`).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router, Recharts, lector de QR/código de barras |
| Backend / API | Node.js, Express 5, MySQL (`mysql2`), JWT, Helmet, `express-rate-limit`, Multer, ExcelJS |
| Servicio de reglas | Python (`ai-service/app/rules.py`) + Dockerfile |
| Deploy | API en Render (`keep-render-awake.yml` para el plan gratuito) |

## Estructura

```text
backend/
  config/         configuración de base de datos y entorno
  controllers/    lógica de endpoints
  routes/         productos, ventas, stock, clientes, usuarios, auth, insights
  models/         consultas a MySQL
  middlewares/    JWT, roles y validaciones
  migrations/     migraciones de esquema
  jobs/           lowRotationJob.js (ejecutado con npm run ai:job)
  server.js       servidor Express
ai-service/
  app/rules.py    motor de reglas y score de baja rotación
  Dockerfile      imagen del servicio Python
frontend/
  SistemaVentasIA aplicación React + Vite
db/               scripts SQL de base de datos
.github/workflows/ keep-render-awake.yml
```

## Cómo correrlo en local

**1. API (Backend)**

```bash
cd backend
cp .env.example .env
# Configura tus credenciales de MySQL y JWT en .env
npm install
npm run dev
```

*(Opcional) Ejecutar el job de baja rotación:*
```bash
npm run ai:job
```

**2. Frontend**

```bash
cd frontend/SistemaVentasIA
npm install
npm run dev
```

**3. Servicio de reglas (opcional)**

```bash
cd ai-service
# Ejecutar con Python 3 o construir la imagen usando el Dockerfile
```

Health check de la API: `GET /health`