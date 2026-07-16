import Fastify from "fastify";
import { healthRoutes } from "./routes/health";

export const app = Fastify({
  logger: true,
});

app.register(healthRoutes, {
  prefix: "/api/v1",
});