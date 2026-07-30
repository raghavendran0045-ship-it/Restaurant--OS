import { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof ZodError) {
      return reply.status(400).send({
        message: "Validation failed",
        errors: error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      });
    }

    // Temporary for debugging
    return reply.status(500).send({
      message: error.message,
      stack: process.env.NODE_ENV !== "production" ? error.stack : undefined,
    });
  });
}