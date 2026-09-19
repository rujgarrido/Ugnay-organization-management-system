// webapp/src/instrument.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,

  dataCollection: {
    // To disable sending user data and HTTP bodies, uncomment the lines below:
    // userInfo: false,
    // httpBodies: []
  },

  integrations: [Sentry.browserTracingIntegration()],

  // Tracing
  tracesSampleRate: 1.0, // Lower this to 0.1 once you have real traffic

  // Control which URLs get distributed tracing.
  // Include your backend API origin so traces propagate to the server.
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/ugnay-theta\.vercel\.app\/api/, // your Vercel-hosted API (via rewrite)
    /^https:\/\/ugnay\.onrender\.com\/api/,     // your Render origin (direct)
  ],
});