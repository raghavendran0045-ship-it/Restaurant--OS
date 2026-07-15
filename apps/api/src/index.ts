import Fastify from "fastify";
import cors from "@fastify/cors";

async function start() {
  const app = Fastify();

  await app.register(cors);

  app.get("/", async () => {
    return {
      message: "RestaurantOS API Running 🚀",
    };
  });

  try {
    await app.listen({
      port: 4000,
      host: "0.0.0.0",
    });

    console.log("🚀 API running at http://localhost:4000");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();