import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import { verifyJWT } from "../plugins/auth";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category";

export async function categoryRoutes(app: FastifyInstance) {
  // Create Category
  app.post(
    "/categories",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const { name } = createCategorySchema.parse(request.body);

      const user = request.user as {
        id: string;
      };

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

      const category = await prisma.category.create({
        data: {
          name,
          restaurantId: restaurant.id,
        },
      });

      return reply.status(201).send(category);
    }
  );

  // Get Categories
  app.get(
    "/categories",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const user = request.user as {
        id: string;
      };

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

      const categories = await prisma.category.findMany({
        where: {
          restaurantId: restaurant.id,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return reply.send(categories);
    }
  );

  // Update Category
  app.patch(
    "/categories/:id",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const { name } = updateCategorySchema.parse(request.body);

      const { id } = request.params as {
        id: string;
      };

      const updatedCategory = await prisma.category.update({
        where: {
          id,
        },
        data: {
          name,
        },
      });

      return reply.send(updatedCategory);
    }
  );

  // Delete Category
  app.delete(
    "/categories/:id",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const { id } = request.params as {
        id: string;
      };

      await prisma.category.delete({
        where: {
          id,
        },
      });

      return reply.send({
        message: "Category deleted successfully",
      });
    }
  );
}