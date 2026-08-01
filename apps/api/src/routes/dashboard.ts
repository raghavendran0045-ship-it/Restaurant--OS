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

// ==========================
// Top Selling Items
// ==========================
app.get(
  "/dashboard/top-selling",
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


    const items =
      await prisma.orderItem.groupBy({
        by: [
          "menuItemId",
        ],

        _sum: {
          quantity: true,
        },

        orderBy: {
          _sum: {
            quantity: "desc",
          },
        },

        take: 5,
      });


    const menuItems =
      await prisma.menuItem.findMany({
        where: {
          id: {
            in: items.map(
              (item) => item.menuItemId
            ),
          },
        },
      });


    const result = items.map(
      (item) => {

        const menuItem =
          menuItems.find(
            (m) =>
              m.id === item.menuItemId
          );


        return {
          name: menuItem?.name,
          quantity:
            item._sum.quantity ?? 0,
        };
      }
    );


    return reply.send({
      topSellingItems: result,
    });
  }
);

// ==========================
// Sales Analytics
// ==========================
app.get(
  "/dashboard/sales",
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


    const now = new Date();


    const startOfToday =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );


    const startOfWeek =
      new Date(startOfToday);

    startOfWeek.setDate(
      startOfWeek.getDate() - startOfWeek.getDay()
    );


    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );


    const today =
      await prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: "COMPLETED",
          createdAt: {
            gte: startOfToday,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });


    const week =
      await prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: "COMPLETED",
          createdAt: {
            gte: startOfWeek,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });


    const month =
      await prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          status: "COMPLETED",
          createdAt: {
            gte: startOfMonth,
          },
        },
        _sum: {
          totalAmount: true,
        },
      });


    return reply.send({
      todaySales:
        Number(today._sum.totalAmount ?? 0),

      weeklySales:
        Number(week._sum.totalAmount ?? 0),

      monthlySales:
        Number(month._sum.totalAmount ?? 0),
    });
  }
);

}
