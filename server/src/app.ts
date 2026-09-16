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
import { organizationRoutes } from './features/organizations/organization.routes';
import { OrganizationController } from './features/organizations/organization.controller';
import { OrganizationService } from './features/organizations/organization.service';
import { MemberService } from './features/organizations/member.service';
import { usersRoutes } from './features/users/users.routes';
import { projectRoutes } from './features/projects/project.routes';
import { ProjectController } from './features/projects/project.controller';
import { ProjectService } from './features/projects/project.service';
import { TaskService } from './features/projects/task.service';
import { proposalRoutes } from './features/proposals/proposal.routes';
import { ProposalController } from './features/proposals/proposal.controller';
import { ProposalService } from './features/proposals/proposal.service';
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
  const authController = new AuthController(new AuthService());

  // Authentication Routes
  app.use('/api/v1/auth', authRoutes(authController));
  console.log('Auth routes registered at /api/v1/auth');

  // Organization Routes (org lifecycle, members, dashboard, activity)
  const organizationController = new OrganizationController(
    new OrganizationService(),
    new MemberService(),
  );
  app.use('/api/v1/organizations', organizationRoutes(organizationController));
  console.log('Organization routes registered at /api/v1/organizations');

  // User profile routes (US-1.7)
  app.use('/api/v1/users', usersRoutes());
  console.log('User routes registered at /api/v1/users');

  // Project + task routes (US-3.1 / US-3.2 / US-3.3)
  const projectController = new ProjectController(new ProjectService(), new TaskService());
  app.use('/api/v1/organizations', projectRoutes(projectController));
  console.log('Project routes registered at /api/v1/organizations/:orgId/projects');

  // Proposal + signature routes (US-5.1 / US-5.2 / US-5.3)
  const proposalController = new ProposalController(new ProposalService());
  app.use('/api/v1/organizations', proposalRoutes(proposalController));
  console.log('Proposal routes registered at /api/v1/organizations/:orgId/proposals');

  // 404 handler for unmatched routes
  app.use(routesNotFound);
  // Central error handler for all errors thrown in the application
  app.use(errorHandler);

  return app;
}
