import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/error';
import { authRouter } from './modules/auth/routes';
import { tablesRouter } from './modules/tables/routes';
import { sessionsRouter } from './modules/sessions/routes';
import { scanRouter } from './modules/scan/routes';
import { menuRouter } from './modules/menu/routes';
import { ordersRouter } from './modules/orders/routes';
import { reservationsRouter } from './modules/reservations/routes';
import { feedbackRouter } from './modules/feedback/routes';
import { staffRouter } from './modules/staff/routes';
import { reportsRouter } from './modules/reports/routes';
import { auditRouter } from './modules/audit/routes';
import paymentRouter from './modules/payments/routes';
import { inventoryRouter } from './modules/inventory/routes';

export const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'test',
});

app.use(limiter);

const allowedOrigins = [
  ...(config.CLIENT_ORIGIN ? config.CLIENT_ORIGIN.split(',').map(o => o.trim()) : []),
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/t', scanRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/staff', staffRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/inventory', inventoryRouter);

// Error handling must be last

app.use(errorHandler);
