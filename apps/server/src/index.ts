import { createServer } from 'http';
import { Server } from 'socket.io';
import { app } from './app';
import { config } from './config';

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: [config.CLIENT_ORIGIN, 'http://localhost:5173', 'http://localhost:5174'],
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
