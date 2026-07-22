import Fastify from "fastify";
import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";

export const app = Fastify({
  logger: true,
});

app.register(healthRoutes, {
  prefix: "/api/v1",
});

app.register(authRoutes, {
  prefix: "/api/v1/auth",
});