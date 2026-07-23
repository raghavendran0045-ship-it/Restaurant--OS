import { errorHandler } from "./plugins/error-handler";
import Fastify from "fastify";
import jwt from "@fastify/jwt";

import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { profileRoutes } from "./routes/profile";
import { restaurantRoutes } from "./routes/restaurant";

export const app = Fastify({
  logger: true,
});
errorHandler(app);

app.register(jwt, {
  secret: process.env.JWT_SECRET || "restaurantos-dev-secret",
});

app.register(healthRoutes, {
  prefix: "/api/v1",
});

app.register(authRoutes, {
  prefix: "/api/v1/auth",
});

app.register(profileRoutes, {
  prefix: "/api/v1",
});
app.register(restaurantRoutes, {
  prefix: "/api/v1",
});