import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { createOrderSchema } from "../schemas/order";

function generateOrderNumber() {
  return `ORD-${Date.now()}`;
}

export async function publicOrderRoutes(app: FastifyInstance) {
  app.post(
    "/public/orders",
    async (request, reply) => {
      const data = createOrderSchema.parse(request.body);

      const menuItemIds = data.items.map(
        (item) => item.menuItemId
      );

      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
          isAvailable: true,
        },
      });

      if (menuItems.length !== menuItemIds.length) {
        return reply.status(400).send({
          message: "Invalid or unavailable menu item",
        });
      }

      const restaurantIds = new Set(
        menuItems.map((item) => item.restaurantId)
      );

      if (restaurantIds.size !== 1) {
        return reply.status(400).send({
          message:
            "All order items must belong to the same restaurant",
        });
      }

      const restaurantId = menuItems[0].restaurantId;

      let totalAmount = 0;

      for (const item of data.items) {
        const menuItem = menuItems.find(
          (menuItem) =>
            menuItem.id === item.menuItemId
        );

        if (!menuItem) {
          return reply.status(400).send({
            message: "Invalid menu item",
          });
        }

        totalAmount +=
          Number(menuItem.price) * item.quantity;
      }

      const order = await prisma.$transaction(
        async (tx) => {
          const createdOrder =
            await tx.order.create({
              data: {
                orderNumber:
                  generateOrderNumber(),

                customerName:
                  data.customerName,

                customerPhone:
                  data.customerPhone,

                totalAmount,

                restaurantId,
              },
            });

          await tx.orderItem.createMany({
            data: data.items.map((item) => {
              const menuItem =
                menuItems.find(
                  (menuItem) =>
                    menuItem.id ===
                    item.menuItemId
                )!;

              return {
                orderId:
                  createdOrder.id,

                menuItemId:
                  menuItem.id,

                quantity:
                  item.quantity,

                price:
                  menuItem.price,
              };
            }),
          });

          return createdOrder;
        }
      );

      return reply.status(201).send(order);
    }
  );
}