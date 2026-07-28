import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { verifyJWT } from "../plugins/auth";
import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from "../schemas/menuItem";

export async function menuItemRoutes(app: FastifyInstance) {
  // Create Menu Item
  app.post(
    "/menu-items",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const data = createMenuItemSchema.parse(request.body);

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

      const menuItem = await prisma.menuItem.create({
        data: {
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl,
          isAvailable: data.isAvailable ?? true,
          categoryId: data.categoryId,
          restaurantId: restaurant.id,
        },
      });

      return reply.status(201).send(menuItem);
    }
  );

  // Get Menu Items
  app.get(
    "/menu-items",
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

      const menuItems = await prisma.menuItem.findMany({
        where: {
          restaurantId: restaurant.id,
        },
        include: {
          category: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return reply.send(menuItems);
    }
  );

  // Get Single Menu Item
  app.get(
    "/menu-items/:id",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const menuItem = await prisma.menuItem.findUnique({
        where: { id },
        include: {
          category: true,
        },
      });

      if (!menuItem) {
        return reply.status(404).send({
          message: "Menu item not found",
        });
      }

      return reply.send(menuItem);
    }
  );

  // Update Menu Item
  app.patch(
    "/menu-items/:id",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const data = updateMenuItemSchema.parse(request.body);

      const { id } = request.params as { id: string };

      const menuItem = await prisma.menuItem.update({
        where: { id },
        data,
      });

      return reply.send(menuItem);
    }
  );

  // Delete Menu Item
  app.delete(
    "/menu-items/:id",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await prisma.menuItem.delete({
        where: { id },
      });

      return reply.send({
        message: "Menu item deleted successfully",
      });
    }
  );
}
