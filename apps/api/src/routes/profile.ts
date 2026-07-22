import { FastifyInstance } from "fastify";
import { verifyJWT } from "../plugins/auth";

export async function profileRoutes(app: FastifyInstance) {
  app.get(
    "/profile",
    {
      preHandler: [verifyJWT],
    },
    async (request) => {
      return request.user;
    }
  );
}