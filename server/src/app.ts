import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import  cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { routesNotFound } from './middleware/routesNotFound';
import { authRoutes } from './features/auth/auth.routes';
import { AuthController } from './features/auth/auth.controller';
import { AuthService } from './features/auth/auth.service';
import { AuthRepository } from './features/auth/auth.repository';
export function createApp(): Express {
  const app = express();
  
  // helmet and cors should be registered before any other middleware to ensure security and cross-origin requests are handled properly
  app.use(helmet());
  
  // Support comma-separated local origins while keeping credentialed requests restricted.
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }));
  
  // Middleware to parse JSON request bodies
  app.use(express.json());

  app.use(cookieParser());
  
  //strip pino-http headers to avoid logging sensitive information
//   app.use(pinoHttp({ logger, serializers: {
//     req: (req) => ({ method: req.method, url: req.url }), // strip headers
//     res: (res) => ({ statusCode: res.statusCode }),
//   },
//  }));

  // Health check — used for local verification and platform (Render) health probes.
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Initialize the AuthController with its dependencies
  const authController = new AuthController(new AuthService(new AuthRepository()));

  // Authentication Routes
  app.use('/api/v1/auth', authRoutes(authController));

console.log('Auth routes registered at /api/v1/auth');

  // 404 handler for unmatched routes
  app.use(routesNotFound);
  // Central error handler for all errors thrown in the application
  app.use(errorHandler);

  return app;
}
