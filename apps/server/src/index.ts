import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { config } from './config';

const httpServer = createServer(app);

const allowedOrigins = [
  ...(config.CLIENT_ORIGIN ? config.CLIENT_ORIGIN.split(',').map(o => o.trim()) : []),
  'http://localhost:5173',
  'http://localhost:5174'
];

export const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
