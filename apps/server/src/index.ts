import { createServer } from 'http';
import { app } from './app';
import { config } from './config';
import { initSocket } from './socket';

const httpServer = createServer(app);

export const io = initSocket(httpServer);

app.set('io', io);

httpServer.listen(config.PORT, () => {
  console.log(`Server listening on port ${config.PORT}`);
});
