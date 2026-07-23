import { FastifyInstance } from "fastify";
import { prisma } from "@repo/database";
import {
  createRestaurantSchema,
  updateRestaurantSchema,
} from "../schemas/restaurant";
import { verifyJWT } from "../plugins/auth";

export async function restaurantRoutes(app: FastifyInstance) {
  // Create Restaurant
  app.post(
    "/restaurants",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const { name } = createRestaurantSchema.parse(request.body);

      const user = request.user as {
        id: string;
        email: string;
      };

      const existingRestaurant = await prisma.restaurant.findUnique({
        where: {
          ownerId: user.id,
        },
      });

      if (existingRestaurant) {
        return reply.status(400).send({
          message: "You already own a restaurant",
        });
      }

      const restaurant = await prisma.restaurant.create({
        data: {
          name,
          ownerId: user.id,
        },
      });

      return reply.status(201).send(restaurant);
    }
  );

  // Get My Restaurant
  app.get(
    "/restaurants/me",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const user = request.user as {
        id: string;
        email: string;
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

      return reply.send(restaurant);
    }
  );

  // Update My Restaurant
  app.patch(
    "/restaurants/me",
    {
      preHandler: [verifyJWT],
    },
    async (request, reply) => {
      const { name } = updateRestaurantSchema.parse(request.body);

      const user = request.user as {
        id: string;
        email: string;
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

      const updatedRestaurant = await prisma.restaurant.update({
        where: {
          ownerId: user.id,
        },
        data: {
          name,
        },
      });

      return reply.send(updatedRestaurant);
    }
  );
}