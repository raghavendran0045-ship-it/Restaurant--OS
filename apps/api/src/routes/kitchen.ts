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
app.patch(
  "/kitchen/orders/:id/status",
  {
    preHandler: [verifyJWT],
  },
  async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

    const { status } = request.body as {
      status: string;
    };


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


    const order =
      await prisma.order.findFirst({
        where: {
          id,
          restaurantId: restaurant.id,
        },
      });


    if (!order) {
      return reply.status(404).send({
        message: "Order not found",
      });
    }


    const validTransitions: Record<string, string[]> = {
      PENDING: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY"],
      READY: ["COMPLETED"],
      COMPLETED: [],
      CANCELLED: [],
    };


    if (
      !validTransitions[order.status].includes(status)
    ) {
      return reply.status(400).send({
        message:
          `Cannot change ${order.status} to ${status}`,
      });
    }


    const updatedOrder =
      await prisma.order.update({
        where: {
          id,
        },
        data: {
          status: status as any,
        },
      });


    return reply.send(updatedOrder);
  }
);

}
