import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";

export async function publicMenuRoutes(app: FastifyInstance) {
  app.get(
    "/public/restaurants/:restaurantId/menu",
    async (request, reply) => {
      const { restaurantId } = request.params as {
        restaurantId: string;
      };

      const restaurant = await prisma.restaurant.findUnique({
        where: {
          id: restaurantId,
        },
        include: {
          categories: {
            include: {
              menuItems: {
                where: {
                  isAvailable: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
        },
      });

      if (!restaurant) {
        return reply.status(404).send({
          message: "Restaurant not found",
        });
      }

      return reply.send({
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
        },
        categories: restaurant.categories,
      });
    }
  );
}
