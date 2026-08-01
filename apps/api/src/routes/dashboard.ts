import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { verifyJWT } from "../plugins/auth";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/dashboard/summary",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const user = request.user as { id: string };

      const restaurant = await prisma.restaurant.findUnique({
        where: {
          ownerId: user.id,
        },
      });

      if (!restaurant) {
        return reply.status(404).send({
          message: "Restaurant not found",
        });
      }

      const totalOrders = await prisma.order.count({
        where: {
          restaurantId: restaurant.id,
        },
      });

      const completedOrders = await prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          status: "COMPLETED",
        },
      });

      const pendingOrders = await prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          status: {
            in: ["PENDING", "PREPARING", "READY"],
          },
        },
      });

      const revenue = await prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: "COMPLETED",
        },
        _sum: {
          totalAmount: true,
        },
      });

      return reply.send({
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue: Number(revenue._sum.totalAmount ?? 0),
      });
    }
  );

  // ==========================
// Recent Orders
// ==========================
app.get(
  "/dashboard/recent-orders",
  {
    preHandler: [verifyJWT],
  },
  async (request, reply) => {
    const user = request.user as { id: string };

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: user.id,
      },
    });

    if (!restaurant) {
      return reply.status(404).send({
        message: "Restaurant not found",
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return reply.send({
      orders,
    });
  }
);

// ==========================
// Order Status Summary
// ==========================
app.get(
  "/dashboard/order-status",
  {
    preHandler: [verifyJWT],
  },
  async (request, reply) => {
    const user = request.user as { id: string };

    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: user.id,
      },
    });

    if (!restaurant) {
      return reply.status(404).send({
        message: "Restaurant not found",
      });
    }

    const grouped = await prisma.order.groupBy({
      by: ["status"],
      where: {
        restaurantId: restaurant.id,
      },
      _count: {
        status: true,
      },
    });

    const result = {
      PENDING: 0,
      PREPARING: 0,
      READY: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const row of grouped) {
      result[row.status] = row._count.status;
    }

    return reply.send(result);
  }
);

}
