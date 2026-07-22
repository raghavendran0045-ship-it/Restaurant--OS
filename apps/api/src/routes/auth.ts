import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "@repo/database";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return reply.status(400).send({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return reply.status(201).send({
      id: user.id,
      email: user.email,
    });
  });
}