import { dashboardRoutes } from "./routes/dashboard";
import { orderRoutes } from "./routes/order";
import { menuItemRoutes } from "./routes/menuItem";
import Fastify from "fastify";
import jwt from "@fastify/jwt";

import { errorHandler } from "./plugins/error-handler";

import { healthRoutes } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { profileRoutes } from "./routes/profile";
import { restaurantRoutes } from "./routes/restaurant";
import { categoryRoutes } from "./routes/category";
import { publicMenuRoutes } from "./routes/publicMenu";


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


