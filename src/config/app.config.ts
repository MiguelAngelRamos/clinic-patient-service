// src/config/app.config.ts
import { registerAs } from "@nestjs/config";

export const appConfig = registerAs("app", () => ({
  port: parseInt(process.env.PORT ?? "3003", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  // URL del user-service para comunicación HTTP REST
  // En K8s: http://user-service:3002
  // En dev local: http://localhost:3002
  userServiceUrl: process.env.USER_SERVICE_URL ?? "http://localhost:3002",
}));
