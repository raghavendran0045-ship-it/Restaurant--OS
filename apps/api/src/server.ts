import Fastify from "fastify";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";

import { errorHandler } from "./plugins/error-handler";

import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { profileRoutes } from "./routes/profile";
import { restaurantRoutes } from "./routes/restaurant";
import { categoryRoutes } from "./routes/category";
import { menuItemRoutes } from "./routes/menuItem";
import { orderRoutes } from "./routes/order";
import { dashboardRoutes } from "./routes/dashboard";
import { publicMenuRoutes } from "./routes/publicMenu";
import { publicOrderRoutes } from "./routes/publicOrder";
import { kitchenRoutes } from "./routes/kitchen";

export const app = Fastify({
  logger: true,
});

/*
 * CORS must be registered before the application routes.
 * The browser sends an OPTIONS preflight request before
 * PATCH requests such as kitchen order status updates.
 */
app.register(cors, {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
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

app.register(categoryRoutes, {
  prefix: "/api/v1",
});

app.register(menuItemRoutes, {
  prefix: "/api/v1",
});

app.register(orderRoutes, {
  prefix: "/api/v1",
});

app.register(dashboardRoutes, {
  prefix: "/api/v1",
});

app.register(publicMenuRoutes, {
  prefix: "/api/v1",
});

app.register(publicOrderRoutes, {
  prefix: "/api/v1",
});

app.register(kitchenRoutes, {
  prefix: "/api/v1",
});