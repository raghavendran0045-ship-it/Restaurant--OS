import { updateOrderStatusSchema } from "../schemas/updateOrderStatus";
import { orderQuerySchema } from "../schemas/orderQuery";
import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { verifyJWT } from "../plugins/auth";
import { createOrderSchema } from "../schemas/order";

function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

export async function orderRoutes(app: FastifyInstance) {

  
  app.post(
    "/orders",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const data = createOrderSchema.parse(request.body);

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

      const menuItems = await prisma.menuItem.findMany({
        where: {
          restaurantId: restaurant.id,
          id: {
            in: data.items.map((item) => item.menuItemId),
          },
        },
      });

      if (menuItems.length !== data.items.length) {
        return reply.status(400).send({
          message: "One or more menu items are invalid.",
        });
      }

      let totalAmount = 0;

      for (const item of data.items) {
        const menuItem = menuItems.find(
          (m) => m.id === item.menuItemId
        );

        if (!menuItem) continue;

        totalAmount += Number(menuItem.price) * item.quantity;
      }

      const order = await prisma.$transaction(async (tx) => {
       const createdOrder = await tx.order.create({
  data: {
    orderNumber: generateOrderNumber(),
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    totalAmount,
    restaurantId: restaurant.id,
  },
});

        await tx.orderItem.createMany({
          data: data.items.map((item) => {
            const menuItem = menuItems.find(
              (m) => m.id === item.menuItemId
            )!;

            return {
              orderId: createdOrder.id,
              menuItemId: menuItem.id,
              quantity: item.quantity,
              price: menuItem.price,
            };
          }),
        });

        return createdOrder;
      });

      return reply.status(201).send(order);
    }
  );

  // ==========================
// Get Orders
// ==========================
app.get(
  "/orders",
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

    const query = orderQuerySchema.parse(request.query);

    const where = {
      restaurantId: restaurant.id,

      ...(query.status && {
        status: query.status,
      }),
    };

    const total = await prisma.order.count({
      where,
    });

    const orders = await prisma.order.findMany({
      where,

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

      skip: (query.page - 1) * query.limit,

      take: query.limit,
    });

    return reply.send({
      orders,

      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  }
);

// ==========================
// Update Order Status
// ==========================
app.patch(
  "/orders/:id/status",
  {
    preHandler: [verifyJWT],
  },
  async (request, reply) => {
    const { id } = request.params as { id: string };

    const data = updateOrderStatusSchema.parse(request.body);

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

    const order = await prisma.order.findFirst({
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

if (!validTransitions[order.status].includes(data.status)) {
  return reply.status(400).send({
    message: `Cannot change status from ${order.status} to ${data.status}`,
  });
}

    const updatedOrder = await prisma.order.update({
      where: {
        id,
      },
      data: {
        status: data.status,
      },
    });

    return reply.send(updatedOrder);
  }
);


// ==========================
// Get Single Order
// ==========================
app.get(
  "/orders/:id",
  {
    preHandler: [verifyJWT],
  },
  async (request, reply) => {
    const { id } = request.params as { id: string };

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

    const order = await prisma.order.findFirst({
      where: {
        id,
        restaurantId: restaurant.id,
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) {
      return reply.status(404).send({
        message: "Order not found",
      });
    }

    return reply.send(order);
  }
);


}

