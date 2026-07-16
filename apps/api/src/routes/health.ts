import { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    return {
      success: true,
      message: "RestaurantOS API Running",
    };
  });
}