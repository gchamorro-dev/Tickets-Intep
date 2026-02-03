import fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import jwt from "@fastify/jwt";


import { authRoutes } from "./routes/auth";
// import { authPlugin } from "./plugins/auth"; // si lo tienes
import { requestRoutes } from "./routes/requests";
import { taskRoutes } from "./routes/tasks";
import { userRoutes } from "./routes/users"; // si existe

const app = fastify({ logger: true });

async function main() {
  // ✅ CORS primero
  await app.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret",
  });

  // plugins
  // await app.register(authPlugin); // si aplica


  // routes
  await app.register(requestRoutes);
  await app.register(taskRoutes);
  await app.register(authRoutes);
  await app.register(userRoutes); // si aplica

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: "0.0.0.0" });

  console.log(`API running on http://localhost:${port}`);
}

main().catch((err) => {
  app.log.error(err);
  process.exit(1);
});
