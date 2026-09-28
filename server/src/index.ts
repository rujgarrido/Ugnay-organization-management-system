import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';

const app = createApp();
// Start the server and listen on the specified port
app.listen(env.PORT, () => {
  logger.info(` Ugnay API listening on http://localhost:${env.PORT}`);
  logger.info(` Health check: http://localhost:${env.PORT}/health`);
  logger.info(` CORS origin: ${env.CORS_ORIGIN}`);
  logger.info(` Auth routes: http://localhost:${env.PORT}/api/v1/auth`);
});
  if (env.NODE_ENV !== 'production') {
    const isNeon = env.DATABASE_URL.includes('.neon.tech');
    if (isNeon) {
      logger.warn(
        '⚠️  DATABASE_URL points to Neon, but NODE_ENV is NOT set to "production". Rate limiting is currently bypassed! Ensure NODE_ENV=production in Render environment variables.'
      );
    }
  }

