import { app } from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`Backend server running on http://localhost:${env.PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => console.log('HTTP server closed'));
});

process.on('SIGINT', () => {
  server.close(() => console.log('HTTP server closed'));
});
