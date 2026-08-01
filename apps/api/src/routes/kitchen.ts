import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { verifyJWT } from "../plugins/auth";


export async function kitchenRoutes(app: FastifyInstance) {

  app.get(
    "/kitchen/orders",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {

      const user = request.user as {
        id: string;
      };


      const restaurant =
        await prisma.restaurant.findUnique({
          where: {
            ownerId: user.id,
          },
        });


      if (!restaurant) {
        return reply.status(404).send({
          message: "Restaurant not found",
        });
      }


      const orders =
        await prisma.order.findMany({
          where: {
            restaurantId: restaurant.id,

            status: {
              in: [
                "PENDING",
                "PREPARING",
                "READY",
              ],
            },
          },

          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        });


      return reply.send({
        orders,
      });

    }
  );

}